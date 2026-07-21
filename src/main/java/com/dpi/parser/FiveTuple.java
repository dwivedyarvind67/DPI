package com.dpi.parser;

import java.util.Objects;

public class FiveTuple {
    public int srcIp;
    public int dstIp;
    public short srcPort;
    public short dstPort;
    public byte protocol;

    public FiveTuple() {
    }

    public FiveTuple(int srcIp, int dstIp, short srcPort, short dstPort, byte protocol) {
        this.srcIp = srcIp;
        this.dstIp = dstIp;
        this.srcPort = srcPort;
        this.dstPort = dstPort;
        this.protocol = protocol;
    }

    public FiveTuple reverse() {
        return new FiveTuple(dstIp, srcIp, dstPort, srcPort, protocol);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof FiveTuple)) return false;
        FiveTuple that = (FiveTuple) o;
        return srcIp == that.srcIp &&
               dstIp == that.dstIp &&
               srcPort == that.srcPort &&
               dstPort == that.dstPort &&
               protocol == that.protocol;
    }

    @Override
    public int hashCode() {
        int h = 0;
        // Boost-style hash combining
        h ^= Integer.hashCode(srcIp) + 0x9e3779b9 + (h << 6) + (h >> 2);
        h ^= Integer.hashCode(dstIp) + 0x9e3779b9 + (h << 6) + (h >> 2);
        h ^= Short.hashCode(srcPort) + 0x9e3779b9 + (h << 6) + (h >> 2);
        h ^= Short.hashCode(dstPort) + 0x9e3779b9 + (h << 6) + (h >> 2);
        h ^= Byte.hashCode(protocol) + 0x9e3779b9 + (h << 6) + (h >> 2);
        return h;
    }

    @Override
    public String toString() {
        String protoStr = (protocol == 6) ? "TCP" : (protocol == 17) ? "UDP" : String.valueOf(protocol);
        return formatIp(srcIp) + ":" + Short.toUnsignedInt(srcPort) + " -> " +
               formatIp(dstIp) + ":" + Short.toUnsignedInt(dstPort) + " (" + protoStr + ")";
    }

    public static String formatIp(int ip) {
        return (ip & 0xFF) + "." +
               ((ip >> 8) & 0xFF) + "." +
               ((ip >> 16) & 0xFF) + "." +
               ((ip >> 24) & 0xFF);
    }

    public static int parseIp(String ip) {
        if (ip == null || ip.isEmpty()) return 0;
        String[] parts = ip.split("\\.");
        if (parts.length != 4) return 0;
        try {
            return (Integer.parseInt(parts[0]) & 0xFF) |
                   ((Integer.parseInt(parts[1]) & 0xFF) << 8) |
                   ((Integer.parseInt(parts[2]) & 0xFF) << 16) |
                   ((Integer.parseInt(parts[3]) & 0xFF) << 24);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
