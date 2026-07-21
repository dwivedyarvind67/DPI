package com.dpi.parser;

import java.nio.charset.StandardCharsets;

public class SNIExtractor {

    public static String extract(byte[] payload, int offset, int length) {
        if (payload == null || offset < 0 || length <= 0 || offset + length > payload.length) {
            return null;
        }

        try {
            int pos = offset;

            // Check if there is enough data for a basic TLS header
            if (pos + 5 > offset + length) return null;

            // TLS Record Content Type: 0x16 (Handshake)
            if (payload[pos] != 0x16) return null;
            pos++;

            // Skip version (2 bytes)
            pos += 2;

            // Record Length
            int recordLen = readUint16BE(payload, pos);
            pos += 2;

            if (pos + recordLen > offset + length) {
                // Not enough data for the full record
                return null;
            }

            // Handshake Type: 0x01 (Client Hello)
            if (pos >= offset + length || payload[pos] != 0x01) return null;
            pos++;

            // Skip handshake length (3 bytes), client version (2 bytes), random (32 bytes)
            pos += 37;
            if (pos >= offset + length) return null;

            // Session ID
            int sessionIdLen = payload[pos] & 0xFF;
            pos += 1 + sessionIdLen;
            if (pos >= offset + length) return null;

            // Cipher Suites
            if (pos + 2 > offset + length) return null;
            int cipherSuitesLen = readUint16BE(payload, pos);
            pos += 2 + cipherSuitesLen;
            if (pos >= offset + length) return null;

            // Compression Methods
            int compMethodsLen = payload[pos] & 0xFF;
            pos += 1 + compMethodsLen;
            if (pos + 2 > offset + length) return null;

            // Extensions Length
            int extensionsLen = readUint16BE(payload, pos);
            pos += 2;

            int endPos = Math.min(pos + extensionsLen, offset + length);

            // Parse Extensions
            while (pos + 4 <= endPos) {
                int extType = readUint16BE(payload, pos);
                int extLen = readUint16BE(payload, pos + 2);
                pos += 4;

                if (extType == 0x0000) { // Server Name Indication (SNI)
                    if (pos + 5 > endPos) return null;
                    
                    // Skip Server Name List Length (2 bytes)
                    pos += 2;
                    
                    // Server Name Type (0x00 = host_name)
                    int nameType = payload[pos] & 0xFF;
                    pos += 1;
                    if (nameType != 0x00) return null;
                    
                    // Server Name Length
                    int nameLen = readUint16BE(payload, pos);
                    pos += 2;
                    
                    if (pos + nameLen <= endPos) {
                        return new String(payload, pos, nameLen, StandardCharsets.US_ASCII);
                    } else {
                        return null;
                    }
                }
                
                pos += extLen;
            }

        } catch (Exception e) {
            // Guard against unexpected buffer access issues
            return null;
        }

        return null;
    }

    private static int readUint16BE(byte[] data, int offset) {
        return ((data[offset] & 0xFF) << 8) | (data[offset + 1] & 0xFF);
    }
}
