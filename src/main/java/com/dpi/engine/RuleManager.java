package com.dpi.engine;

import com.dpi.parser.AppType;
import com.dpi.parser.FiveTuple;

import java.util.List;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.locks.ReadWriteLock;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * Manages blocking rules for IP, Application, and Domain.
 */
public class RuleManager {
    private final Set<Integer> blockedIps = new CopyOnWriteArraySet<>();
    private final Set<AppType> blockedApps = new CopyOnWriteArraySet<>();
    private final List<String> blockedDomains = new CopyOnWriteArrayList<>();

    private final ReadWriteLock lock = new ReentrantReadWriteLock();

    /**
     * Blocks an IP address.
     * @param ip IP address in dotted-quad format.
     */
    public void blockIP(String ip) {
        try {
            String[] parts = ip.split("\\.");
            if (parts.length == 4) {
                // Little-endian: first octet in lowest byte
                int ipInt = (Integer.parseInt(parts[0]) & 0xFF) |
                           ((Integer.parseInt(parts[1]) & 0xFF) << 8) |
                           ((Integer.parseInt(parts[2]) & 0xFF) << 16) |
                           ((Integer.parseInt(parts[3]) & 0xFF) << 24);
                
                lock.writeLock().lock();
                try {
                    blockedIps.add(ipInt);
                    System.out.println("[Rules] Blocked IP: " + ip);
                } finally {
                    lock.writeLock().unlock();
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to parse IP: " + ip);
        }
    }

    /**
     * Blocks an application by name.
     * @param appName Application name.
     */
    public void blockApp(String appName) {
        for (AppType type : AppType.values()) {
            // Match by enum name (YOUTUBE) or display name (YouTube)
            if (type.name().equalsIgnoreCase(appName) || type.toString().equalsIgnoreCase(appName)) {
                lock.writeLock().lock();
                try {
                    blockedApps.add(type);
                    System.out.println("[Rules] Blocked app: " + type.toString());
                } finally {
                    lock.writeLock().unlock();
                }
                return;
            }
        }
        System.err.println("[Rules] Unknown app: " + appName);
    }

    /**
     * Blocks a domain or SNI.
     * @param domain Domain name.
     */
    public void blockDomain(String domain) {
        lock.writeLock().lock();
        try {
            blockedDomains.add(domain);
            System.out.println("[Rules] Blocked domain: " + domain);
        } finally {
            lock.writeLock().unlock();
        }
    }

    /**
     * Checks if a flow is blocked based on source IP, application, or SNI.
     * @param srcIp Source IP as integer (little-endian).
     * @param app Application type.
     * @param sni SNI or domain string.
     * @return True if blocked, false otherwise.
     */
    public boolean isBlocked(int srcIp, AppType app, String sni) {
        lock.readLock().lock();
        try {
            if (blockedIps.contains(srcIp)) {
                return true;
            }
            if (app != null && blockedApps.contains(app)) {
                return true;
            }
            if (sni != null && !sni.isEmpty()) {
                for (String domain : blockedDomains) {
                    if (sni.contains(domain)) {
                        return true;
                    }
                }
            }
            return false;
        } finally {
            lock.readLock().unlock();
        }
    }
}
