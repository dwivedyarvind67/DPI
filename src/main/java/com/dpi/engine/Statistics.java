package com.dpi.engine;

import com.dpi.parser.AppType;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Statistics class for tracking packet statistics and application counts.
 */
public class Statistics {
    public final AtomicLong totalPackets = new AtomicLong();
    public final AtomicLong totalBytes = new AtomicLong();
    public final AtomicLong forwarded = new AtomicLong();
    public final AtomicLong dropped = new AtomicLong();
    public final AtomicLong tcpPackets = new AtomicLong();
    public final AtomicLong udpPackets = new AtomicLong();

    private final ConcurrentHashMap<AppType, AtomicLong> appCounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AppType> detectedSnis = new ConcurrentHashMap<>();

    /**
     * Records the application type and SNI.
     * @param app Application type.
     * @param sni Server Name Indication or domain.
     */
    public void recordApp(AppType app, String sni) {
        if (app != null) {
            appCounts.computeIfAbsent(app, k -> new AtomicLong(0)).incrementAndGet();
        }
        if (sni != null && !sni.isEmpty() && app != null) {
            detectedSnis.put(sni, app);
        }
    }

    /**
     * Prints a formatted report of the statistics.
     * @param activeFlows The total number of active flows.
     */
    public void printReport(int activeFlows) {
        System.out.println("┌──────────────────────────────────────────────┐");
        System.out.println("│ DPI Engine Statistics Report                 │");
        System.out.println("├──────────────────────────────────────────────┤");
        System.out.printf("│ Total Packets : %-28d │\n", totalPackets.get());
        System.out.printf("│ Forwarded     : %-28d │\n", forwarded.get());
        System.out.printf("│ Dropped       : %-28d │\n", dropped.get());
        System.out.printf("│ Active Flows  : %-28d │\n", activeFlows);
        System.out.println("├──────────────────────────────────────────────┤");
        System.out.println("│ Application Breakdown                        │");
        System.out.println("├──────────────────────────────────────────────┤");
        
        long totalAppCount = 0;
        for (AtomicLong count : appCounts.values()) {
            totalAppCount += count.get();
        }
        
        for (Map.Entry<AppType, AtomicLong> entry : appCounts.entrySet()) {
            long count = entry.getValue().get();
            double percentage = totalAppCount > 0 ? (count * 100.0) / totalAppCount : 0.0;
            int barLength = (int) (percentage / 5);
            StringBuilder bar = new StringBuilder();
            for (int i = 0; i < barLength; i++) {
                bar.append("█");
            }
            System.out.printf("│ %-12s: %6d (%5.1f%%) %-10s │\n", entry.getKey().name(), count, percentage, bar.toString());
        }
        
        System.out.println("├──────────────────────────────────────────────┤");
        System.out.println("│ Detected Domains / SNIs                      │");
        System.out.println("├──────────────────────────────────────────────┤");
        for (Map.Entry<String, AppType> entry : detectedSnis.entrySet()) {
            System.out.printf("│ %-30s -> %-10s │\n", entry.getKey(), entry.getValue().name());
        }
        System.out.println("└──────────────────────────────────────────────┘");
    }
}
