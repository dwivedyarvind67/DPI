package com.dpi.parser;

import com.dpi.pcap.PacketJob;

public class PacketParser {

    public static class ParsedInfo {
        public String srcIp;
        public String destIp;
        public int srcPort;
        public int destPort;
        public int protocol;
        public boolean hasIp;
        public boolean hasTcp;
        public boolean hasUdp;
        public byte tcpFlags;
    }

    public static boolean parse(byte[] data, ParsedInfo info) {
        if (data == null || data.length < 14) {
            return false;
        }

        // Ethernet header ethertype at offset 12 (big-endian)
        int ethertype = readUint16BE(data, 12);
        if (ethertype != 0x0800) {
            return false; // Not IPv4
        }

        if (data.length < 34) {
            return false;
        }

        int ipOffset = 14;
        int ihl = data[ipOffset] & 0x0F;
        int ipHeaderLen = ihl * 4;

        if (data.length < ipOffset + ipHeaderLen) {
            return false;
        }

        info.protocol = data[ipOffset + 9] & 0xFF;
        
        // IP src/dst (little-endian representation internally)
        int srcIpInt = (data[ipOffset + 12] & 0xFF) |
                       ((data[ipOffset + 13] & 0xFF) << 8) |
                       ((data[ipOffset + 14] & 0xFF) << 16) |
                       ((data[ipOffset + 15] & 0xFF) << 24);

        int destIpInt = (data[ipOffset + 16] & 0xFF) |
                        ((data[ipOffset + 17] & 0xFF) << 8) |
                        ((data[ipOffset + 18] & 0xFF) << 16) |
                        ((data[ipOffset + 19] & 0xFF) << 24);

        info.srcIp = FiveTuple.formatIp(srcIpInt);
        info.destIp = FiveTuple.formatIp(destIpInt);
        info.hasIp = true;

        int transportOffset = ipOffset + ipHeaderLen;

        if (info.protocol == 6) { // TCP
            if (data.length < transportOffset + 20) {
                return false;
            }
            info.hasTcp = true;
            info.srcPort = readUint16BE(data, transportOffset);
            info.destPort = readUint16BE(data, transportOffset + 2);
            info.tcpFlags = data[transportOffset + 13];
        } else if (info.protocol == 17) { // UDP
            if (data.length < transportOffset + 8) {
                return false;
            }
            info.hasUdp = true;
            info.srcPort = readUint16BE(data, transportOffset);
            info.destPort = readUint16BE(data, transportOffset + 2);
        }

        return true;
    }

    public static PacketJob buildPacketJob(byte[] data, int packetId, long tsSec, long tsUsec) {
        if (data == null || data.length < 14) return null;
        
        int ethertype = readUint16BE(data, 12);
        if (ethertype != 0x0800) return null; // Not IPv4
        
        int ipOffset = 14;
        if (data.length < ipOffset + 20) return null;
        
        int ihl = data[ipOffset] & 0x0F;
        int ipHeaderLen = ihl * 4;
        int protocol = data[ipOffset + 9] & 0xFF;
        
        int srcIpInt = (data[ipOffset + 12] & 0xFF) | ((data[ipOffset + 13] & 0xFF) << 8) | ((data[ipOffset + 14] & 0xFF) << 16) | ((data[ipOffset + 15] & 0xFF) << 24);
        int dstIpInt = (data[ipOffset + 16] & 0xFF) | ((data[ipOffset + 17] & 0xFF) << 8) | ((data[ipOffset + 18] & 0xFF) << 16) | ((data[ipOffset + 19] & 0xFF) << 24);
        
        int transportOffset = ipOffset + ipHeaderLen;
        int payloadOffset;
        int srcPort;
        int dstPort;
        
        if (protocol == 6) {
            if (data.length < transportOffset + 20) return null;
            srcPort = readUint16BE(data, transportOffset);
            dstPort = readUint16BE(data, transportOffset + 2);
            int dataOffset = (data[transportOffset + 12] >> 4) & 0x0F;
            int tcpHeaderLen = dataOffset * 4;
            payloadOffset = transportOffset + tcpHeaderLen;
        } else if (protocol == 17) {
            if (data.length < transportOffset + 8) return null;
            srcPort = readUint16BE(data, transportOffset);
            dstPort = readUint16BE(data, transportOffset + 2);
            payloadOffset = transportOffset + 8;
        } else {
            return null; // Not TCP or UDP
        }
        
        int payloadLength = data.length - payloadOffset;
        if (payloadLength < 0) payloadLength = 0;
        
        FiveTuple tuple = new FiveTuple(srcIpInt, dstIpInt, (short)srcPort, (short)dstPort, (byte)protocol);
        
        PacketJob job = new PacketJob();
        // Assuming public fields or standard access for the job
        job.packetId = packetId;
        job.tsSec = tsSec;
        job.tsUsec = tsUsec;
        job.data = data;
        job.payloadOffset = payloadOffset;
        job.payloadLength = payloadLength;
        job.tuple = tuple;
        
        return job;
    }

    private static int readUint16BE(byte[] data, int offset) {
        return ((data[offset] & 0xFF) << 8) | (data[offset + 1] & 0xFF);
    }
}
