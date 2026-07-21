package com.dpi.engine;

import com.dpi.pcap.PacketJob;
import com.dpi.parser.*;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * FastPath worker thread for DPI packet processing.
 *
 * Each FastPath maintains its own ConnectionTracker (no shared state)
 * to avoid locking overhead. Packets belonging to the same flow are
 * always routed to the same FastPath by the LoadBalancer's hash.
 */
public class FastPath implements Runnable {
    private final int id;
    private final RuleManager rules;
    private final Statistics stats;
    private final BlockingQueue<PacketJob> inputQueue;
    private final BlockingQueue<PacketJob> outputQueue;
    private final ConnectionTracker tracker;
    private volatile boolean running;
    private Thread thread;
    public final AtomicLong processed = new AtomicLong(0);

    public FastPath(int id, RuleManager rules, Statistics stats, BlockingQueue<PacketJob> outputQueue) {
        this.id = id;
        this.rules = rules;
        this.stats = stats;
        this.outputQueue = outputQueue;
        this.inputQueue = new ArrayBlockingQueue<>(10000);
        this.tracker = new ConnectionTracker();
    }

    /** Starts the FastPath worker thread. */
    public void start() {
        running = true;
        thread = new Thread(this, "FastPath-" + id);
        thread.start();
    }

    /** Stops the FastPath worker thread gracefully. */
    public void stop() {
        running = false;
        if (thread != null) {
            thread.interrupt();
            try {
                thread.join(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    public BlockingQueue<PacketJob> getInputQueue() {
        return inputQueue;
    }

    public ConnectionTracker getTracker() {
        return tracker;
    }

    @Override
    public void run() {
        while (running) {
            try {
                PacketJob pkt = inputQueue.poll(100, TimeUnit.MILLISECONDS);
                if (pkt == null) continue;

                FiveTuple tuple = pkt.tuple;

                // Get or create flow entry
                ConnectionTracker.FlowEntry flow = tracker.getOrCreateFlow(tuple);
                flow.packets++;
                flow.bytes += pkt.data.length;

                // Classify flow if not yet done
                if (!flow.classified) {
                    tracker.classifyFlow(pkt, flow);
                }

                // Check blocking rules
                if (!flow.blocked) {
                    if (rules.isBlocked(tuple.srcIp, flow.appType, flow.sni)) {
                        flow.blocked = true;
                        System.out.printf("[BLOCKED] %s -> %s (%s",
                                FiveTuple.formatIp(tuple.srcIp),
                                FiveTuple.formatIp(tuple.dstIp),
                                flow.appType);
                        if (!flow.sni.isEmpty()) {
                            System.out.printf(": %s", flow.sni);
                        }
                        System.out.println(")");
                    }
                }

                // Record application statistics
                stats.recordApp(flow.appType, flow.sni);

                // Forward or drop
                if (flow.blocked) {
                    stats.dropped.incrementAndGet();
                } else {
                    stats.forwarded.incrementAndGet();
                    outputQueue.put(pkt);
                }

                processed.incrementAndGet();

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                System.err.println("[FastPath-" + id + "] Error: " + e.getMessage());
            }
        }
    }
}
