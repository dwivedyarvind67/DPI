package com.dpi.pcap;

import java.io.*;
import java.nio.*;
import java.nio.channels.FileChannel;

public class PcapReader {

    public static class PcapGlobalHeader {
        public long magic_number;
        public int version_major;
        public int version_minor;
        public int thiszone;
        public long sigfigs;
        public long snaplen;
        public long network;
    }

    public static class PcapPacketHeader {
        public long ts_sec;
        public long ts_usec;
        public long incl_len;
        public long orig_len;
    }

    private DataInputStream dis;
    private PcapGlobalHeader globalHeader;
    private boolean needsByteSwap;

    public boolean open(String filename) {
        try {
            dis = new DataInputStream(new BufferedInputStream(new FileInputStream(filename)));
            
            byte[] magicBytes = new byte[4];
            dis.readFully(magicBytes);
            
            // Read as little-endian by default to check magic
            int magic = ByteBuffer.wrap(magicBytes).order(ByteOrder.LITTLE_ENDIAN).getInt();
            
            if (magic == 0xa1b2c3d4) {
                needsByteSwap = false; // It is little-endian
            } else if (magic == 0xd4c3b2a1) {
                needsByteSwap = true; // It is big-endian
            } else {
                return false; // Unknown or unsupported magic
            }
            
            globalHeader = new PcapGlobalHeader();
            globalHeader.magic_number = Integer.toUnsignedLong(magic);
            globalHeader.version_major = Short.toUnsignedInt(readShort());
            globalHeader.version_minor = Short.toUnsignedInt(readShort());
            globalHeader.thiszone = readInt();
            globalHeader.sigfigs = Integer.toUnsignedLong(readInt());
            globalHeader.snaplen = Integer.toUnsignedLong(readInt());
            globalHeader.network = Integer.toUnsignedLong(readInt());
            
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    public PacketJob readNextPacket() {
        try {
            long ts_sec = Integer.toUnsignedLong(readInt());
            long ts_usec = Integer.toUnsignedLong(readInt());
            long incl_len = Integer.toUnsignedLong(readInt());
            long orig_len = Integer.toUnsignedLong(readInt()); // Not saved in job but part of header
            
            byte[] data = new byte[(int) incl_len];
            dis.readFully(data);
            
            PacketJob job = new PacketJob();
            job.tsSec = ts_sec;
            job.tsUsec = ts_usec;
            job.data = data;
            
            return job;
        } catch (EOFException e) {
            return null; // Expected end of file
        } catch (IOException e) {
            return null;
        }
    }

    public PcapGlobalHeader getGlobalHeader() {
        return globalHeader;
    }

    public void close() {
        if (dis != null) {
            try {
                dis.close();
            } catch (IOException e) {
                // Ignore
            }
        }
    }

    private int readInt() throws IOException {
        byte[] buf = new byte[4];
        dis.readFully(buf);
        return ByteBuffer.wrap(buf)
                .order(needsByteSwap ? ByteOrder.BIG_ENDIAN : ByteOrder.LITTLE_ENDIAN)
                .getInt();
    }

    private short readShort() throws IOException {
        byte[] buf = new byte[2];
        dis.readFully(buf);
        return ByteBuffer.wrap(buf)
                .order(needsByteSwap ? ByteOrder.BIG_ENDIAN : ByteOrder.LITTLE_ENDIAN)
                .getShort();
    }
}
