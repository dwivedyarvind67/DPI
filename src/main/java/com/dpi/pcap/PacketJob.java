package com.dpi.pcap;

import com.dpi.parser.FiveTuple;

public class PacketJob {
    public int packetId;
    public FiveTuple tuple;
    public byte[] data;
    public int payloadOffset;
    public int payloadLength;
    public byte tcpFlags;
    public long tsSec;
    public long tsUsec;

    public PacketJob() {
    }
}
