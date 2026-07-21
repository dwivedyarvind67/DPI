package com.dpi.engine;

import com.dpi.pcap.PacketJob;
import com.dpi.parser.FiveTuple;

import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Load Balancer thread that distributes packets to FastPath workers.
 *
 * Packets are assigned to a specific FastPath based on the 5-tuple hash,
 * ensuring all packets in the same flow go to the same worker for
 * correct connection tracking without cross-thread synchronization.
 */
public class LoadBalancer implements Runnable {
    private final int id;
    private final List<FastPath> fastPaths;
    private final BlockingQueue<PacketJob> inputQueue;
    private volatile boolean running;
    private Thread thread;
    public final AtomicLong dispatched = new AtomicLong(0);

    public LoadBalancer(int id, List<FastPath> fastPaths) {
        this.id = id;
        this.fastPaths = fastPaths;
        this.inputQueue = new ArrayBlockingQueue<>(10000);
    }

    public void start() {
        running = true;
        thread = new Thread(this, "LoadBalancer-" + id);
        thread.start();
    }

    public void stop() {
        running = false;
        if (thread != null) {
            thread.interrupt();
            try {
                thread.join(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
    }

    public BlockingQueue<PacketJob> getInputQueue() {
        return inputQueue;
    }

    @Override
    public void run() {
        while (running) {
            try {
                PacketJob pkt = inputQueue.poll(100, TimeUnit.MILLISECONDS);
                if (pkt == null) continue;

                // Hash 5-tuple to select FastPath worker
                int hash = pkt.tuple.hashCode();
                int fpIdx = Math.abs(hash) % fastPaths.size();

                fastPaths.get(fpIdx).getInputQueue().put(pkt);
                dispatched.incrementAndGet();

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                System.err.println("[LoadBalancer-" + id + "] Error: " + e.getMessage());
            }
        }
    }
}
