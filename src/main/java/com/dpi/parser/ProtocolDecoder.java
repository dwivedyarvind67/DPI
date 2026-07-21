package com.dpi.parser;



/**
 * Utility class for decoding network protocols and classifying applications.
 */
public class ProtocolDecoder {

    /**
     * Classifies the application type based on the destination port.
     *
     * @param dstPort The destination port of the packet.
     * @return The classified AppType (HTTPS, HTTP, DNS, or UNKNOWN).
     */
    public static AppType classifyByPort(int dstPort) {
        switch (dstPort) {
            case 443:
                return AppType.HTTPS;
            case 80:
            case 8080:
            case 8443:
                return AppType.HTTP;
            case 53:
                return AppType.DNS;
            default:
                return AppType.UNKNOWN;
        }
    }

    /**
     * Determines if the traffic is DNS based on source and destination ports.
     *
     * @param srcPort The source port of the packet.
     * @param dstPort The destination port of the packet.
     * @return true if either the source or destination port is 53, false otherwise.
     */
    public static boolean isDNS(int srcPort, int dstPort) {
        return srcPort == 53 || dstPort == 53;
    }

    /**
     * Converts an IP protocol number to its standard string representation.
     *
     * @param protocol The IP protocol number (e.g., 6 for TCP, 17 for UDP).
     * @return The standard protocol name, or "Unknown(<protocol>)" if unmapped.
     */
    public static String getProtocolName(int protocol) {
        if (protocol == 6) {
            return "TCP";
        } else if (protocol == 17) {
            return "UDP";
        } else {
            return "Unknown(" + protocol + ")";
        }
    }
}
