import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function BlogPage() {
  return (
    <div className="flex flex-col gap-6 p-8 h-full overflow-y-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">How It Works</h1>
        <p className="text-muted-foreground">Deep dive into the architecture of our High-Performance DPI Engine.</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-primary">1. Deep Packet Inspection (DPI)</CardTitle>
            <CardDescription>The core purpose of this engine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              Deep Packet Inspection (DPI) is an advanced method of examining and managing network traffic. Unlike traditional packet filtering, which only looks at the packet headers (like Source IP, Destination IP, and Ports), DPI examines the <strong>data part (payload)</strong> of the packet as it passes an inspection point.
            </p>
            <p>
              In our engine, DPI is used to identify protocols, track connection states, measure throughput, and enforce dynamic filtering rules in real-time.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-secondary">2. FastPath Worker Architecture</CardTitle>
            <CardDescription>Achieving millions of packets per second</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              To process gigabits of traffic without dropping packets, our engine utilizes a <strong>FastPath architecture</strong>. When a PCAP file is ingested or a live interface is monitored, the packet stream is distributed across multiple <em>Worker Threads</em>.
            </p>
            <p>
              Each worker operates independently on its assigned packets, parsing the Ethernet, IPv4/IPv6, and TCP/UDP headers. By scaling the number of workers (adjustable in the <Badge variant="outline">Config</Badge> tab), the system linearly scales its processing throughput, fully utilizing modern multi-core CPUs.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-primary">3. The Rules Engine</CardTitle>
            <CardDescription>Dynamic packet classification and dropping</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              As packets flow through the workers, they are matched against a dynamic ruleset. The rules engine allows administrators to define conditions based on protocols, source IPs, destination IPs, and destination ports.
            </p>
            <p>
              If a packet matches a <Badge variant="destructive">DROP</Badge> rule, it is immediately discarded, saving downstream processing cycles. Otherwise, it is <Badge>FORWARDED</Badge>. This entire matching process happens in microseconds.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-secondary">4. Ring Buffers & Telemetry</CardTitle>
            <CardDescription>Lock-free data collection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              One of the biggest challenges in high-speed packet processing is getting statistics out of the workers without slowing them down. We solve this using <strong>Lock-Free Ring Buffers</strong>.
            </p>
            <p>
              Workers push statistics (throughput, flow states) into a ring buffer. A dedicated telemetry thread consumes these buffers and aggregates the data. This means the critical data-plane (the workers processing packets) never has to wait for locks or I/O operations.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-primary">5. The Next.js Dashboard</CardTitle>
            <CardDescription>Real-time visualization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed">
            <p>
              This beautiful, responsive dashboard is built with <strong>Next.js 15</strong>, <strong>React</strong>, and <strong>Tailwind CSS</strong>. It features a premium "Neon Glassmorphism" design with seamless light and dark modes.
            </p>
            <p>
              The frontend never touches raw packets directly. Instead, it communicates with the backend via two channels:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong>REST API (Control Plane):</strong> Used to upload PCAP files, start/stop the pipeline, change the worker thread count, and update filtering rules.</li>
              <li><strong>WebSockets (Data Plane):</strong> Used to stream live telemetry data (throughput graphs, worker loads, and live flow tables) directly into the UI at 60 frames per second using <em>Zustand</em> for state management.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
