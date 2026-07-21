# Deep Packet Inspection Engine

**Java, Python, Multithreading, Networking**

A multithreaded packet inspection engine that analyzes network traffic, inspects packet headers, and classifies communication flows. Implements concurrent packet processing, flow tracking, and rule-based traffic filtering to simulate enterprise network security systems. Includes Python utilities for packet generation, preprocessing, and automated testing.

---

## Architecture

```
Input PCAP ─> [Reader Thread] ─> [Load Balancers] ─> [FastPath Workers] ─> [Writer Thread] ─> Output PCAP
                                      │                     │
                                 Hash 5-tuple          Classify flow
                                 to select FP          Apply rules
                                                       Forward/Drop
```

### Multithreaded Pipeline

| Thread Pool       | Count          | Role                                                    |
|-------------------|----------------|---------------------------------------------------------|
| Reader            | 1              | Sequentially reads raw packets from input PCAP           |
| Load Balancers    | Configurable   | Hash-based distribution ensuring per-flow affinity       |
| FastPath Workers  | LBs × FPs/LB  | Concurrent classification, rule-checking, flow tracking  |
| Writer            | 1              | Serializes allowed packets to output PCAP                |

### Deep Packet Inspection Capabilities

- **TLS SNI Extraction** — Parse TLS Client Hello handshake to extract the Server Name Indication (domain name) from encrypted HTTPS traffic
- **HTTP Host Header** — Extract the `Host:` header from plaintext HTTP requests
- **DNS Classification** — Identify DNS query traffic by port analysis
- **Application Fingerprinting** — Classify 18+ applications (YouTube, Facebook, Netflix, Google, Twitter, etc.) from domain patterns
- **Rule-Based Filtering** — Block traffic by source IP, application type, or domain substring match

---

## Project Structure

```
Packet_analyzer/
├── src/main/java/com/dpi/
│   ├── Main.java                          # CLI entry point
│   ├── engine/
│   │   ├── DPIEngine.java                 # Main orchestrator (thread pool management)
│   │   ├── LoadBalancer.java              # Hash-based packet distribution
│   │   ├── FastPath.java                  # Concurrent packet classification worker
│   │   ├── ConnectionTracker.java         # Per-worker flow state tracking
│   │   ├── RuleManager.java              # Thread-safe blocking rules (ReadWriteLock)
│   │   └── Statistics.java               # Atomic counters and reporting
│   ├── parser/
│   │   ├── FiveTuple.java                # Connection identifier (src/dst IP+port+proto)
│   │   ├── AppType.java                  # Application classification enum + SNI mapping
│   │   ├── PacketParser.java             # Ethernet/IPv4/TCP/UDP header parsing
│   │   ├── SNIExtractor.java             # TLS Client Hello SNI extraction
│   │   ├── HTTPHostExtractor.java        # HTTP Host header extraction
│   │   └── ProtocolDecoder.java          # Port-based protocol classification
│   └── pcap/
│       ├── PcapReader.java               # Pure-Java PCAP file reader (no native libs)
│       ├── PcapWriter.java               # Thread-safe PCAP file writer
│       └── PacketJob.java                # Packet data container for queue passing
│
├── generate_test_pcap.py                  # Python utility: generates test PCAP traffic
├── test_dpi_engine.py                     # Python utility: automated end-to-end testing
├── test_dpi.pcap                          # Sample capture with TLS/HTTP/DNS traffic
│
├── src/                                   # Original C++ implementation (reference)
├── include/                               # C++ header files (reference)
└── README.md
```

---

## Building and Running

### Prerequisites
- **Java 8+** (JDK with `javac` and `java`)
- **Python 3.6+** (for test utilities)

### Compile

```bash
cd Packet_analyzer
javac -d out -sourcepath src/main/java src/main/java/com/dpi/Main.java
```

### Run

```bash
# Basic usage — process all traffic
java -cp out com.dpi.Main input.pcap output.pcap

# Block YouTube and a specific IP
java -cp out com.dpi.Main capture.pcap filtered.pcap --block-app YouTube --block-ip 192.168.1.50

# Block a domain pattern with custom thread counts
java -cp out com.dpi.Main input.pcap output.pcap --block-domain facebook --lbs 4 --fps 4
```

### CLI Options

| Option              | Description                                      |
|---------------------|--------------------------------------------------|
| `--block-ip <ip>`   | Block all traffic from a source IP address        |
| `--block-app <app>` | Block an application (YouTube, Facebook, etc.)    |
| `--block-domain <d>`| Block domains containing substring                |
| `--lbs <n>`         | Number of Load Balancer threads (default: 2)      |
| `--fps <n>`         | FastPath workers per Load Balancer (default: 2)   |

---

## Python Utilities

### Generate Test Traffic

```bash
python generate_test_pcap.py
```

Creates `test_dpi.pcap` with:
- 16 TLS connections with SNI (Google, YouTube, Facebook, Netflix, etc.)
- 2 HTTP connections with Host headers
- 4 DNS queries
- 5 packets from a "blocked" source IP

### Automated Testing

```bash
python test_dpi_engine.py
```

Runs 7 automated tests:
1. PCAP generation validation
2. Java compilation check
3. DPI engine with no rules (all traffic forwarded)
4. Application blocking (YouTube)
5. IP blocking (192.168.1.50)
6. Combined blocking (app + IP + domain)
7. Output PCAP file validation

---

## How It Works

### 1. Packet Parsing (Layer 2-4)

Every network packet is parsed through protocol layers:

```
Ethernet (14 bytes) → IPv4 (20+ bytes) → TCP/UDP (20/8 bytes) → Payload
```

The parser extracts the **Five-Tuple** (source IP, destination IP, source port, destination port, protocol) that uniquely identifies each connection flow.

### 2. Deep Inspection (Layer 7)

For HTTPS traffic (port 443), the engine parses the **TLS Client Hello** handshake to extract the **Server Name Indication** (SNI) — the domain name sent in plaintext before encryption begins.

For HTTP traffic (port 80), the engine extracts the **Host** header from the request.

### 3. Flow Tracking

All packets sharing the same Five-Tuple belong to the same flow. Each FastPath worker maintains its own flow table (no cross-thread locking needed). The LoadBalancer's hash ensures flow affinity.

### 4. Rule Enforcement

Blocking rules are checked against:
- **Source IP** — exact match
- **Application type** — classified from SNI/Host patterns
- **Domain substring** — partial match against SNI

Blocked packets are dropped; allowed packets are written to the output PCAP.

---

## Networking Concepts

### The Five-Tuple

| Field            | Example             | Purpose                  |
|------------------|---------------------|--------------------------|
| Source IP        | 192.168.1.100       | Who is sending           |
| Destination IP   | 172.217.14.206      | Where it's going         |
| Source Port      | 54321               | Sender's app identifier  |
| Destination Port | 443                 | Service (443 = HTTPS)    |
| Protocol         | TCP (6)             | TCP or UDP               |

### TLS SNI Extraction

```
TLS Client Hello:
├── Content Type: 0x16 (Handshake)
├── Version: TLS 1.0/1.2
├── Handshake Type: 0x01 (Client Hello)
├── Random: [32 bytes]
├── Session ID
├── Cipher Suites
├── Compression Methods
└── Extensions:
    └── SNI Extension (0x0000):
        └── Server Name: "www.youtube.com"  ← Extracted!
```

---

## Supported Applications

| Application | Detection Patterns                                      |
|-------------|--------------------------------------------------------|
| YouTube     | youtube, ytimg, youtu.be                                |
| Google      | google, gstatic, googleapis, ggpht                      |
| Facebook    | facebook, fbcdn, fb.com, meta.com                       |
| Instagram   | instagram, cdninstagram                                 |
| Twitter/X   | twitter, twimg, x.com                                   |
| Netflix     | netflix, nflxvideo, nflximg                              |
| Amazon      | amazon, amazonaws, cloudfront                           |
| Microsoft   | microsoft, msn.com, office, azure, outlook              |
| Apple       | apple, icloud, mzstatic, itunes                         |
| Telegram    | telegram, t.me                                          |
| TikTok      | tiktok, tiktokcdn, bytedance                            |
| Spotify     | spotify, scdn.co                                        |
| Zoom        | zoom                                                    |
| Discord     | discord, discordapp                                     |
| GitHub      | github, githubusercontent                                |
| Cloudflare  | cloudflare                                              |
| WhatsApp    | whatsapp, wa.me                                         |
