package com.dpi;

import com.dpi.engine.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Main entry point for the Deep Packet Inspection (DPI) Engine.
 * Parses CLI arguments and orchestrates the multithreaded pipeline.
 */
public class Main {

    public static void main(String[] args) {
        if (args.length < 2) {
            printUsage();
            System.exit(1);
        }

        String inputFile = args[0];
        String outputFile = args[1];

        List<String> blockIps = new ArrayList<>();
        List<String> blockApps = new ArrayList<>();
        List<String> blockDomains = new ArrayList<>();
        int lbs = 2;
        int fps = 2;

        // Parse remaining arguments
        for (int i = 2; i < args.length; i++) {
            String arg = args[i];
            if ("--block-ip".equals(arg) && i + 1 < args.length) {
                blockIps.add(args[++i]);
            } else if ("--block-app".equals(arg) && i + 1 < args.length) {
                blockApps.add(args[++i]);
            } else if ("--block-domain".equals(arg) && i + 1 < args.length) {
                blockDomains.add(args[++i]);
            } else if ("--lbs".equals(arg) && i + 1 < args.length) {
                lbs = Integer.parseInt(args[++i]);
            } else if ("--fps".equals(arg) && i + 1 < args.length) {
                fps = Integer.parseInt(args[++i]);
            } else {
                System.err.println("Unknown or incomplete option: " + arg);
            }
        }

        // Create engine configuration
        DPIEngine.Config config = new DPIEngine.Config();
        config.numLBs = lbs;
        config.fpsPerLB = fps;

        // Create and configure engine
        DPIEngine engine = new DPIEngine(config);

        // Apply blocking rules
        for (String ip : blockIps) {
            engine.blockIP(ip);
        }
        for (String app : blockApps) {
            engine.blockApp(app);
        }
        for (String domain : blockDomains) {
            engine.blockDomain(domain);
        }

        // Process the PCAP file
        boolean success = engine.process(inputFile, outputFile);

        if (success) {
            System.out.println("\nOutput written to: " + outputFile);
        } else {
            System.err.println("Processing failed.");
            System.exit(1);
        }
    }

    private static void printUsage() {
        System.out.println("DPI Engine - Deep Packet Inspection System");
        System.out.println("==========================================");
        System.out.println();
        System.out.println("Usage: java com.dpi.Main <input.pcap> <output.pcap> [options]");
        System.out.println();
        System.out.println("Options:");
        System.out.println("  --block-ip <ip>        Block traffic from source IP");
        System.out.println("  --block-app <app>      Block application (YouTube, Facebook, etc.)");
        System.out.println("  --block-domain <dom>   Block domain (substring match)");
        System.out.println("  --lbs <n>              Number of load balancer threads (default: 2)");
        System.out.println("  --fps <n>              Fast path threads per LB (default: 2)");
        System.out.println();
        System.out.println("Example:");
        System.out.println("  java com.dpi.Main capture.pcap filtered.pcap --block-app YouTube --block-ip 192.168.1.50");
    }
}
