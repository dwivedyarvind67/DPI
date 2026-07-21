package com.dpi.engine;

import com.dpi.pcap.*;
import com.dpi.parser.*;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;

/**
 * Main DPI Engine orchestrator.
 * Architecture: Reader -> LoadBalancers -> FastPath workers -> Writer
 *
 * Coordinates multithreaded packet processing pipeline:
 *   1. Reader thread reads raw packets from input PCAP
 *   2. LoadBalancers hash 5-tuple to distribute to specific FastPath workers
 *   3. FastPath workers classify flows, apply rules, forward/drop
 *   4. Writer thread serializes allowed packets to output PCAP
 */
public class DPIEngine {

    /**
     * Engine configuration controlling thread pool sizes.
     */
    public static class Config {
        public int numLBs = 2;
        public int fpsPerLB = 2;
    }

    private final Config config;
    private final RuleManager ruleManager;
    private final Statistics stats;
    private final List<FastPath> fastPaths;
    private final List<LoadBalancer> loadBalancers;
    private final BlockingQueue<PacketJob> outputQueue;

    public DPIEngine(Config config) {
        this.config = config;
        this.ruleManager = new RuleManager();
        this.stats = new Statistics();
        this.fastPaths = new ArrayList<>();
        this.loadBalancers = new ArrayList<>();
        this.outputQueue = new ArrayBlockingQueue<>(10000);

        int totalFPs = config.numLBs * config.fpsPerLB;

        System.out.println();
        System.out.println("\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
        System.out.println("\u2551              DPI ENGINE v2.0 (Multi-threaded)                 \u2551");
        System.out.println("\u2560\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2563");
        System.out.printf("\u2551 Load Balancers: %2d    FPs per LB: %2d    Total FPs: %2d     \u2551%n",
                config.numLBs, config.fpsPerLB, totalFPs);
        System.out.println("\u255a\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255d");
        System.out.println();

        // Create FastPath workers
        for (int i = 0; i < totalFPs; i++) {
            fastPaths.add(new FastPath(i, ruleManager, stats, outputQueue));
        }

        // Create LoadBalancers, each managing a subset of FastPaths
        for (int lb = 0; lb < config.numLBs; lb++) {
            int start = lb * config.fpsPerLB;
            List<FastPath> lbFps = new ArrayList<>();
            for (int i = 0; i < config.fpsPerLB; i++) {
                lbFps.add(fastPaths.get(start + i));
            }
            loadBalancers.add(new LoadBalancer(lb, lbFps));
        }
    }

    public void blockIP(String ip) { ruleManager.blockIP(ip); }
    public void blockApp(String app) { ruleManager.blockApp(app); }
    public void blockDomain(String dom) { ruleManager.blockDomain(dom); }

    /**
     * Process input PCAP file, apply DPI rules, and write filtered output.
     *
     * @param inputFile  Path to input .pcap file
     * @param outputFile Path to output .pcap file
     * @return true if processing completed successfully
     */
    public boolean process(String inputFile, String outputFile) {
        PcapReader reader = new PcapReader();
        PcapWriter writer = new PcapWriter();

        try {
            // Open input PCAP
            if (!reader.open(inputFile)) {
                System.err.println("Error: Cannot open input file: " + inputFile);
                return false;
            }

            // Open output PCAP with same global header
            if (!writer.open(outputFile, reader.getGlobalHeader())) {
                System.err.println("Error: Cannot open output file: " + outputFile);
                return false;
            }

            // Start all FastPath threads, then LoadBalancer threads
            for (FastPath fp : fastPaths) fp.start();
            for (LoadBalancer lb : loadBalancers) lb.start();

            // Start output writer thread
            final PcapWriter finalWriter = writer;
            final Thread writerThread = new Thread(() -> {
                try {
                    while (!Thread.currentThread().isInterrupted()) {
                        PacketJob pkt = outputQueue.poll(100, TimeUnit.MILLISECONDS);
                        if (pkt != null) {
                            try {
                                finalWriter.writePacket(pkt);
                            } catch (java.io.IOException ioe) {
                                System.err.println("[Writer] Write error: " + ioe.getMessage());
                            }
                        }
                    }
                } catch (InterruptedException e) {
                    // Expected on shutdown
                }
                // Drain remaining packets
                PacketJob pkt;
                while ((pkt = outputQueue.poll()) != null) {
                    try {
                        finalWriter.writePacket(pkt);
                    } catch (Exception ex) {
                        // ignore write errors during drain
                    }
                }
            }, "PcapWriter");
            writerThread.start();

            // Reader loop: read packets, parse, dispatch to LBs
            System.out.println("[Reader] Processing packets...");
            int packetId = 0;
            PacketJob raw;

            while ((raw = reader.readNextPacket()) != null) {
                PacketJob job = PacketParser.buildPacketJob(raw.data, packetId, raw.tsSec, raw.tsUsec);
                if (job == null) {
                    packetId++;
                    continue;
                }

                // Update global stats
                stats.totalPackets.incrementAndGet();
                stats.totalBytes.addAndGet(job.data.length);
                if (job.tuple.protocol == 6) stats.tcpPackets.incrementAndGet();
                else if (job.tuple.protocol == 17) stats.udpPackets.incrementAndGet();

                // Dispatch to LoadBalancer via 5-tuple hash
                int lbIdx = Math.abs(job.tuple.hashCode()) % loadBalancers.size();
                loadBalancers.get(lbIdx).getInputQueue().put(job);

                packetId++;
            }

            System.out.println("[Reader] Done reading " + packetId + " packets");
            reader.close();

            // Wait for pipeline to drain
            Thread.sleep(2000);

            // Shutdown pipeline in order: LBs -> FPs -> writer
            for (LoadBalancer lb : loadBalancers) lb.stop();
            for (FastPath fp : fastPaths) fp.stop();

            writerThread.interrupt();
            writerThread.join(3000);

            writer.close();

            // Compute total active flows
            int totalFlows = getFlowCount();
            stats.printReport(totalFlows);

            return true;

        } catch (Exception e) {
            System.err.println("Processing failed: " + e.getMessage());
            e.printStackTrace();
            return false;
        } finally {
            reader.close();
        }
    }

    /**
     * Returns the total number of tracked flows across all FastPath workers.
     */
    public int getFlowCount() {
        int total = 0;
        for (FastPath fp : fastPaths) {
            total += fp.getTracker().getFlowCount();
        }
        return total;
    }
}
