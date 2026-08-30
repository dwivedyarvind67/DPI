package com.dpi;

import com.dpi.engine.*;
import com.dpi.server.WebServer;

import java.util.ArrayList;
import java.util.List;

/**
 * Main entry point for the DPI Engine.
 *
 * Modes:
 *   1. Server mode (no args): starts the REST + WebSocket server on port 8080.
 *      The frontend dashboard connects to this server.
 *
 *   2. CLI mode (with args): processes a PCAP file offline (backward compatible).
 *      Usage: java -jar dpi-engine.jar <input.pcap> <output.pcap> [options]
 */
public class Main {

    public static void main(String[] args) throws Exception {
        if (args.length == 0 || "--server".equals(args[0])) {
            // ── SERVER MODE ──────────────────────────────────────────────────
            runServer();
        } else {
            // ── CLI MODE (backward compatible) ───────────────────────────────
            runCli(args);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Server mode: starts the web server; engine runs when triggered via API
    // ─────────────────────────────────────────────────────────────────────────
    private static void runServer() throws Exception {
        System.out.println();
        System.out.println("╔══════════════════════════════════════════════════════════════╗");
        System.out.println("║         DPI Engine v2.0 — Server Mode                       ║");
        System.out.println("╠══════════════════════════════════════════════════════════════╣");
        System.out.println("║  Dashboard: http://localhost:3000                            ║");
        System.out.println("║  REST API:  http://localhost:8080/api                        ║");
        System.out.println("║  WebSocket: ws://localhost:8080/ws                           ║");
        System.out.println("╚══════════════════════════════════════════════════════════════╝");
        System.out.println();

        DPIEngine.Config config = new DPIEngine.Config();
        config.numLBs = 2;
        config.fpsPerLB = 2;

        DPIEngine engine = new DPIEngine(config);
        WebServer server = new WebServer(engine.getRuleManager(), engine.getStats(), engine.getFastPaths());
        server.start(8080);

        // Keep alive
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("\n[Main] Shutting down...");
            server.stop();
        }));

        Thread.currentThread().join(); // block main thread forever
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CLI mode: backward-compatible offline PCAP processing
    // ─────────────────────────────────────────────────────────────────────────
    private static void runCli(String[] args) throws Exception {
        if (args.length < 2) {
            printUsage();
            System.exit(1);
        }

        String inputFile  = args[0];
        String outputFile = args[1];

        List<String> blockIps     = new ArrayList<>();
        List<String> blockApps    = new ArrayList<>();
        List<String> blockDomains = new ArrayList<>();
        int lbs = 2;
        int fps = 2;

        for (int i = 2; i < args.length; i++) {
            String arg = args[i];
            if ("--block-ip".equals(arg) && i + 1 < args.length)     blockIps.add(args[++i]);
            else if ("--block-app".equals(arg) && i + 1 < args.length)    blockApps.add(args[++i]);
            else if ("--block-domain".equals(arg) && i + 1 < args.length) blockDomains.add(args[++i]);
            else if ("--lbs".equals(arg) && i + 1 < args.length)          lbs = Integer.parseInt(args[++i]);
            else if ("--fps".equals(arg) && i + 1 < args.length)          fps = Integer.parseInt(args[++i]);
            else System.err.println("Unknown option: " + arg);
        }

        DPIEngine.Config config = new DPIEngine.Config();
        config.numLBs = lbs;
        config.fpsPerLB = fps;

        DPIEngine engine = new DPIEngine(config);
        for (String ip  : blockIps)     engine.getRuleManager().blockIP(ip);
        for (String app : blockApps)    engine.getRuleManager().blockApp(app);
        for (String dom : blockDomains) engine.getRuleManager().blockDomain(dom);

        boolean ok = engine.process(inputFile, outputFile);
        if (ok) System.out.println("\nOutput written to: " + outputFile);
        else  { System.err.println("Processing failed."); System.exit(1); }
    }

    private static void printUsage() {
        System.out.println("DPI Engine v2.0");
        System.out.println("Usage: java -jar dpi-engine.jar                              (server mode)");
        System.out.println("       java -jar dpi-engine.jar <in.pcap> <out.pcap> [opts]  (CLI mode)");
    }
}
