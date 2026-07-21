package com.dpi.parser;

import java.nio.charset.StandardCharsets;

public class HTTPHostExtractor {

    public static String extract(byte[] payload, int offset, int length) {
        if (!isHTTPRequest(payload, offset, length)) {
            return null;
        }

        String data = new String(payload, offset, length, StandardCharsets.US_ASCII);
        String lowerData = data.toLowerCase();

        int hostIdx = lowerData.indexOf("\r\nhost: ");
        if (hostIdx == -1) {
            if (lowerData.startsWith("host: ")) {
                hostIdx = 0;
            } else {
                return null;
            }
        } else {
            hostIdx += 2; // skip \r\n
        }

        int startIdx = hostIdx + 6; // length of "host: "
        int endIdx = data.indexOf("\r\n", startIdx);

        if (endIdx != -1) {
            return data.substring(startIdx, endIdx).trim();
        }
        
        return null; // Host header found but no trailing \r\n
    }

    public static boolean isHTTPRequest(byte[] payload, int offset, int length) {
        if (payload == null || offset < 0 || length < 4 || offset + length > payload.length) {
            return false;
        }
        
        String start = new String(payload, offset, Math.min(length, 10), StandardCharsets.US_ASCII);
        return start.startsWith("GET ") ||
               start.startsWith("POST ") ||
               start.startsWith("PUT ") ||
               start.startsWith("DELETE ") ||
               start.startsWith("HEAD ") ||
               start.startsWith("OPTIONS ") ||
               start.startsWith("PATCH ");
    }
}
