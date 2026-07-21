package com.dpi.engine;

import com.dpi.parser.*;
import com.dpi.pcap.PacketJob;

import java.util.HashMap;

/**
 * Tracks connection flows per FastPath worker.
 *
 * NOT thread-safe: each FastPath has its own ConnectionTracker instance,
 * eliminating the need for synchronization on the hot path.
 */
public class ConnectionTracker {

    /**
     * Represents an active connection flow identified by its 5-tuple.
     */
    public static class FlowEntry {
        public FiveTuple tuple;
        public AppType appType = AppType.UNKNOWN;
        public String sni = "";
        public long packets = 0;
        public long bytes = 0;
        public boolean blocked = false;
        public boolean classified = false;

        public FlowEntry(FiveTuple tuple) {
            this.tuple = tuple;
        }
    }

    private final HashMap<FiveTuple, FlowEntry> flows = new HashMap<>();

    /**
     * Retrieves an existing flow or creates a new one.
     */
    public FlowEntry getOrCreateFlow(FiveTuple tuple) {
        return flows.computeIfAbsent(tuple, FlowEntry::new);
    }

    /**
     * Classifies a flow using Layer-7 inspection (SNI, HTTP Host, DNS).
     *
     * @param pkt  The packet job with payload data
     * @param flow The flow entry to classify
     */
    public void classifyFlow(PacketJob pkt, FlowEntry flow) {
        int dstPort = Short.toUnsignedInt(flow.tuple.dstPort);

        // Try TLS SNI extraction for HTTPS (port 443)
        if (dstPort == 443 && pkt.payloadLength > 5) {
            String extractedSni = SNIExtractor.extract(pkt.data, pkt.payloadOffset, pkt.payloadLength);
            if (extractedSni != null && !extractedSni.isEmpty()) {
                flow.sni = extractedSni;
                flow.appType = AppType.fromSni(extractedSni);
                flow.classified = true;
                return;
            }
        }

        // Try HTTP Host header extraction (port 80)
        if (dstPort == 80 && pkt.payloadLength > 10) {
            String extractedHost = HTTPHostExtractor.extract(pkt.data, pkt.payloadOffset, pkt.payloadLength);
            if (extractedHost != null && !extractedHost.isEmpty()) {
                flow.sni = extractedHost;
                flow.appType = AppType.fromSni(extractedHost);
                flow.classified = true;
                return;
            }
        }

        // DNS classification
        if (dstPort == 53 || Short.toUnsignedInt(flow.tuple.srcPort) == 53) {
            flow.appType = AppType.DNS;
            flow.classified = true;
            return;
        }

        // Port-based fallback (don't mark classified — might get SNI later)
        if (dstPort == 443) {
            flow.appType = AppType.HTTPS;
        } else if (dstPort == 80) {
            flow.appType = AppType.HTTP;
        }
    }

    /**
     * Returns the number of tracked flows.
     */
    public int getFlowCount() {
        return flows.size();
    }
}
