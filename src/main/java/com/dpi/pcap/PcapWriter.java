package com.dpi.pcap;

import java.io.*;

public class PcapWriter {

    private DataOutputStream dos;

    public boolean open(String filename, PcapReader.PcapGlobalHeader header) {
        try {
            dos = new DataOutputStream(new BufferedOutputStream(new FileOutputStream(filename)));
            
            // Write global header fields as little-endian
            writeIntLE((int) header.magic_number);
            writeShortLE((short) header.version_major);
            writeShortLE((short) header.version_minor);
            writeIntLE(header.thiszone);
            writeIntLE((int) header.sigfigs);
            writeIntLE((int) header.snaplen);
            writeIntLE((int) header.network);
            
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    public synchronized void writePacket(PacketJob pkt) throws IOException {
        if (dos == null) {
            return;
        }
        
        // Write packet header: ts_sec (u32), ts_usec (u32), incl_len (u32), orig_len (u32)
        writeIntLE((int) pkt.tsSec);
        writeIntLE((int) pkt.tsUsec);
        writeIntLE(pkt.data.length);
        writeIntLE(pkt.data.length);
        
        // Write raw packet data
        dos.write(pkt.data);
    }

    public void close() {
        if (dos != null) {
            try {
                dos.flush();
                dos.close();
            } catch (IOException e) {
                // Ignore
            }
        }
    }

    private void writeIntLE(int v) throws IOException {
        dos.writeInt(Integer.reverseBytes(v));
    }

    private void writeShortLE(short v) throws IOException {
        dos.writeShort(Short.reverseBytes(v));
    }
}
