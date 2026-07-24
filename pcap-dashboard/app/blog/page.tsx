import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BlogPage() {
  return (
    <div className="p-6 lg:p-8 h-full overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">How It Works</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Deep dive into the architecture of our High-Performance DPI Engine.</p>
      </div>

      <div className="grid gap-5 max-w-3xl">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">1. Deep Packet Inspection (DPI)</CardTitle>
            <CardDescription>The core purpose of this engine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Deep Packet Inspection (DPI) is an advanced method of examining and managing network traffic. Unlike traditional packet filtering, which only looks at packet headers (Source IP, Destination IP, Ports), DPI examines the <strong className="text-foreground">data part (payload)</strong> of the packet as it passes an inspection point.
            </p>
            <p>
              In our engine, DPI is used to identify protocols, track connection states, measure throughput, and enforce dynamic filtering rules in real-time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">2. FastPath Worker Architecture</CardTitle>
            <CardDescription>Achieving millions of packets per second</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              To process gigabits of traffic without dropping packets, our engine utilizes a <strong className="text-foreground">FastPath architecture</strong>. When a PCAP file is ingested or a live interface is monitored, the packet stream is distributed across multiple worker threads.
            </p>
            <p>
              Each worker operates independently, parsing Ethernet, IPv4/IPv6, and TCP/UDP headers. By scaling the number of workers (adjustable in the <Badge variant="outline">Config</Badge> tab), the system linearly scales its processing throughput.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">3. The Rules Engine</CardTitle>
            <CardDescription>Dynamic packet classification and dropping</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              As packets flow through the workers, they are matched against a dynamic ruleset. The rules engine allows administrators to define conditions based on protocols, source IPs, destination IPs, and destination ports.
            </p>
            <p>
              If a packet matches a <Badge variant="destructive">DROP</Badge> rule, it is immediately discarded. Otherwise, it is <Badge variant="secondary">FORWARDED</Badge>. This entire matching process happens in microseconds.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">4. Ring Buffers & Telemetry</CardTitle>
            <CardDescription>Lock-free data collection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              One of the biggest challenges in high-speed packet processing is getting statistics out of the workers without slowing them down. We solve this using <strong className="text-foreground">Lock-Free Ring Buffers</strong>.
            </p>
            <p>
              Workers push statistics into a ring buffer. A dedicated telemetry thread consumes these buffers and aggregates the data. The critical data-plane never has to wait for locks or I/O operations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">5. The Next.js Dashboard</CardTitle>
            <CardDescription>Real-time visualization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              This dashboard is built with <strong className="text-foreground">Next.js 15</strong>, <strong className="text-foreground">React</strong>, and <strong className="text-foreground">Tailwind CSS</strong> with seamless light and dark mode support.
            </p>
            <p>
              The frontend communicates with the backend via two channels:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong className="text-foreground">REST API (Control Plane):</strong> Used to upload PCAP files, start/stop the pipeline, change worker counts, and update filtering rules.</li>
              <li><strong className="text-foreground">WebSockets (Data Plane):</strong> Used to stream live telemetry data (throughput, worker loads, flow tables) into the UI using Zustand for state management.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">6. The Monitor Dashboard Explained</CardTitle>
            <CardDescription>Understanding the real-time telemetry view</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              The Monitor tab presents a live, high-fidelity view of the system&apos;s inner workings, divided into three sections:
            </p>

            <div className="space-y-2">
              <h3 className="font-medium text-sm text-foreground">A. The Pipeline Diagram</h3>
              <p>
                A visual flow diagram showing the four stages of a packet&apos;s lifecycle:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="text-foreground">PCAP Reader:</strong> The ingress point where packets are read from a file or live interface.</li>
                <li><strong className="text-foreground">Load Balancers:</strong> Uses a Hash 5-Tuple to distribute packets to worker threads consistently.</li>
                <li><strong className="text-foreground">FastPath Workers:</strong> Displays the number of active processing threads.</li>
                <li><strong className="text-foreground">Writer:</strong> The egress point, showing forwarded packet counts.</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm text-foreground">B. Throughput (Packets / Sec)</h3>
              <p>
                A real-time area chart plotting aggregate packets per second over time. Hovering reveals exact timestamps and throughput metrics.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium text-sm text-foreground">C. FastPath Worker Load</h3>
              <p>
                Individual worker progress bars showing CPU utilization, packet counts, and queue depths. This helps identify bottlenecks or uneven load balancing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
