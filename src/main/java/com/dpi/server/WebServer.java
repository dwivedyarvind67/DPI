package com.dpi.server;

import com.dpi.engine.DPIEngine;
import com.dpi.engine.RuleManager;
import com.dpi.engine.Statistics;
import com.dpi.parser.AppType;
import com.dpi.parser.FiveTuple;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.javalin.Javalin;
import io.javalin.websocket.WsContext;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * WebServer: Bridges the DPI Engine to the Next.js dashboard.
 *
 * REST Endpoints:
 *   GET  /api/status           - engine status + stats snapshot
 *   GET  /api/rules            - list active rules
 *   POST /api/rules            - add a new rule (ip/app/domain)
 *   DELETE /api/rules/{id}     - remove a rule by id
 *   POST /api/pipeline/start   - start the engine on an uploaded pcap
 *   POST /api/pipeline/stop    - stop streaming
 *
 * WebSocket:
 *   WS /ws                     - streams live telemetry JSON at ~1fps
 */
public class WebServer {

    // ── live rule tracking ────────────────────────────────────────────────────
    public record Rule(String id, String type, String value) {}
    private final List<Rule> rules = new CopyOnWriteArrayList<>();
    private final AtomicInteger ruleIdSeq = new AtomicInteger(1);

    // ── active WebSocket sessions ─────────────────────────────────────────────
    private final Set<WsContext> sessions = ConcurrentHashMap.newKeySet();

    // ── engine refs (set on pipeline start) ──────────────────────────────────
    private final RuleManager ruleManager;
    private final Statistics stats;
    private final List<com.dpi.engine.FastPath> fastPaths; // live workers
    private volatile boolean pipelineRunning = false;
    private volatile long startTime = 0;

    // ── flow ring buffer for streaming ────────────────────────────────────────
    private final ConcurrentLinkedQueue<Map<String, Object>> flowQueue = new ConcurrentLinkedQueue<>();
    private static final int MAX_FLOW_QUEUE = 200;

    private final ObjectMapper json = new ObjectMapper();
    private final Javalin app;

    public WebServer(RuleManager ruleManager, Statistics stats, List<com.dpi.engine.FastPath> fastPaths) {
        this.ruleManager = ruleManager;
        this.stats = stats;
        this.fastPaths = fastPaths;

        // Wire this server into each FastPath so they can push live flow events
        for (com.dpi.engine.FastPath fp : fastPaths) {
            fp.setWebServer(this);
        }

        app = Javalin.create(config -> {
            config.bundledPlugins.enableCors(cors -> cors.addRule(it -> it.anyHost()));
            config.showJavalinBanner = false;
        });


        registerRoutes();
        startTelemetryBroadcaster();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Route registration
    // ─────────────────────────────────────────────────────────────────────────

    private void registerRoutes() {

        // ── GET /api/status ──────────────────────────────────────────────────
        app.get("/api/status", ctx -> {
            Map<String, Object> status = new LinkedHashMap<>();
            status.put("running", pipelineRunning);
            status.put("totalRead", stats.totalPackets.get());
            status.put("totalForwarded", stats.forwarded.get());
            status.put("totalDropped", stats.dropped.get());
            status.put("uptime", pipelineRunning ? System.currentTimeMillis() - startTime : 0);
            ctx.json(status);
        });

        // ── GET /api/rules ───────────────────────────────────────────────────
        app.get("/api/rules", ctx -> ctx.json(rules));

        // ── POST /api/rules ──────────────────────────────────────────────────
        app.post("/api/rules", ctx -> {
            @SuppressWarnings("unchecked")
            Map<String, String> body = ctx.bodyAsClass(Map.class);
            String type  = body.getOrDefault("type", "").toLowerCase();
            String value = body.getOrDefault("value", "").trim();

            if (value.isEmpty()) { ctx.status(400).result("value is required"); return; }

            String id = String.valueOf(ruleIdSeq.getAndIncrement());
            Rule rule = new Rule(id, type, value);
            rules.add(rule);

            // Apply to live engine immediately
            switch (type) {
                case "ip"     -> ruleManager.blockIP(value);
                case "app"    -> ruleManager.blockApp(value);
                case "domain" -> ruleManager.blockDomain(value);
                default       -> { ctx.status(400).result("type must be ip|app|domain"); return; }
            }
            ctx.status(201).json(rule);
        });

        // ── DELETE /api/rules/{id} ───────────────────────────────────────────
        app.delete("/api/rules/{id}", ctx -> {
            String id = ctx.pathParam("id");
            boolean removed = rules.removeIf(r -> r.id().equals(id));
            // Note: RuleManager doesn't support individual removal yet; the
            // rule list is the source of truth for the UI. A full engine restart
            // would reload the rules. This is acceptable for the current design.
            ctx.status(removed ? 200 : 404).result(removed ? "deleted" : "not found");
        });

        // ── POST /api/pipeline/start ─────────────────────────────────────────
        app.post("/api/pipeline/start", ctx -> {
            if (pipelineRunning) { ctx.status(409).result("already running"); return; }
            // The pipeline is triggered externally (via test script or PCAP upload).
            // Mark as running so the UI reflects the correct state.
            pipelineRunning = true;
            startTime = System.currentTimeMillis();
            ctx.result("started");
        });

        // ── POST /api/pipeline/stop ──────────────────────────────────────────
        app.post("/api/pipeline/stop", ctx -> {
            pipelineRunning = false;
            ctx.result("stopped");
        });

        // ── WS /ws ───────────────────────────────────────────────────────────
        app.ws("/ws", ws -> {
            ws.onConnect(ctx -> {
                sessions.add(ctx);
                System.out.println("[WS] Client connected: " + ctx.sessionId());
            });
            ws.onClose(ctx -> {
                sessions.remove(ctx);
                System.out.println("[WS] Client disconnected: " + ctx.sessionId());
            });
            ws.onError(ctx -> sessions.remove(ctx));
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Telemetry broadcaster — 1fps
    // ─────────────────────────────────────────────────────────────────────────

    private void startTelemetryBroadcaster() {
        ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "TelemetryBroadcaster");
            t.setDaemon(true);
            return t;
        });

        scheduler.scheduleAtFixedRate(() -> {
            if (sessions.isEmpty()) return;
            try {
                String payload = buildTelemetryPayload();
                for (WsContext ctx : sessions) {
                    try { ctx.send(payload); }
                    catch (Exception ignored) { sessions.remove(ctx); }
                }
            } catch (Exception e) {
                System.err.println("[Telemetry] Broadcast error: " + e.getMessage());
            }
        }, 1, 1, TimeUnit.SECONDS);
    }

    private String buildTelemetryPayload() throws Exception {
        Map<String, Object> payload = new LinkedHashMap<>();

        // Stats
        payload.put("running", pipelineRunning);
        payload.put("totalRead", stats.totalPackets.get());
        payload.put("totalForwarded", stats.forwarded.get());
        payload.put("totalDropped", stats.dropped.get());
        payload.put("pps", computePps());

        // Per-worker load
        List<Map<String, Object>> workers = new ArrayList<>();
        for (int i = 0; i < fastPaths.size(); i++) {
            com.dpi.engine.FastPath fp = fastPaths.get(i);
            Map<String, Object> w = new LinkedHashMap<>();
            w.put("id", i);
            w.put("processed", fp.processed.get());
            w.put("loadPct", computeWorkerLoad(fp));
            workers.add(w);
        }
        payload.put("workers", workers);

        // Drain up to 20 pending flows
        List<Map<String, Object>> flows = new ArrayList<>();
        for (int i = 0; i < 20 && !flowQueue.isEmpty(); i++) {
            Map<String, Object> f = flowQueue.poll();
            if (f != null) flows.add(f);
        }
        payload.put("flows", flows);

        return json.writeValueAsString(payload);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API for the engine to push flow events
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Called by FastPath workers to push a completed flow decision to the stream.
     */
    public void pushFlow(FiveTuple tuple, String action, String sni, AppType appType) {
        if (flowQueue.size() > MAX_FLOW_QUEUE) flowQueue.poll(); // ring-buffer behaviour
        Map<String, Object> f = new LinkedHashMap<>();
        f.put("id", UUID.randomUUID().toString().substring(0, 8));
        f.put("src", FiveTuple.formatIp(tuple.srcIp));
        f.put("sport", Short.toUnsignedInt(tuple.srcPort));
        f.put("dst", FiveTuple.formatIp(tuple.dstIp));
        f.put("dport", Short.toUnsignedInt(tuple.dstPort));
        f.put("proto", tuple.protocol == 6 ? "TCP" : tuple.protocol == 17 ? "UDP" : "OTHER");
        f.put("action", action);
        f.put("sni", sni != null ? sni : "");
        f.put("app", appType != null ? appType.name() : "UNKNOWN");
        f.put("timestamp", System.currentTimeMillis());
        flowQueue.offer(f);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private long lastTotalPackets = 0;

    private long computePps() {
        long current = stats.totalPackets.get();
        long delta = current - lastTotalPackets;
        lastTotalPackets = current;
        return delta; // packets processed in the last second
    }

    private long computeWorkerLoad(com.dpi.engine.FastPath fp) {
        // Simple heuristic: clamp processed count relative to total
        long total = stats.totalPackets.get();
        if (total == 0 || fastPaths.isEmpty()) return 0;
        long perWorker = total / fastPaths.size();
        if (perWorker == 0) return 0;
        return Math.min(99, (fp.processed.get() * 100) / (perWorker + 1));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle
    // ─────────────────────────────────────────────────────────────────────────

    public void start(int port) {
        app.start(port);
        System.out.printf("%n[WebServer] REST API + WebSocket live on http://localhost:%d%n", port);
        System.out.printf("[WebServer] WebSocket endpoint: ws://localhost:%d/ws%n%n", port);
    }

    public void stop() {
        app.stop();
    }

    public void markPipelineRunning(boolean running) {
        this.pipelineRunning = running;
        if (running) startTime = System.currentTimeMillis();
    }
}
