# High-Performance DPI Engine & Telemetry Dashboard

![DPI Engine UI Mockup](https://raw.githubusercontent.com/dwivedyarvind67/DPI/main/pcap-dashboard/public/globe.svg) <!-- Replace with an actual screenshot of the dashboard later -->

A state-of-the-art Deep Packet Inspection (DPI) and network telemetry platform. This project features a high-throughput **Java FastPath backend** for dissecting packets and a premium, highly-responsive **Next.js 15 dashboard** for real-time visualization and control.

## 🚀 Key Features

- **FastPath Architecture:** Multi-threaded packet processing engine capable of handling millions of packets per second without dropping frames.
- **Lock-Free Ring Buffers:** Zero-contention telemetry data collection that never blocks the critical data plane.
- **Dynamic Rules Engine:** Apply, update, and remove L3/L4 packet filtering and dropping rules on the fly.
- **Real-Time Telemetry Dashboard:** 
  - Built with **Next.js 15**, **React**, and **Tailwind CSS**.
  - Premium **Neon Glassmorphism** design aesthetics.
  - Seamless toggle between a vibrant Light Mode and a deep-space Dark Mode.
  - Live 60fps throughput charts, individual worker load bars, and active flow tables driven by WebSockets.
- **REST Control Plane:** Safely upload PCAP files, toggle the engine, and configure worker threads via a decoupled REST API.

## 🏗️ System Architecture

```mermaid
graph LR
    A[PCAP / Network] -->|Ingress| B(Load Balancer)
    B -->|Hash 5-Tuple| C(FastPath Workers)
    C -->|Match Rules| D{Drop or Forward?}
    D -->|Forward| E[Egress]
    
    C -.->|Lock-Free Updates| F((Ring Buffers))
    F -.->|Telemetry Thread| G[WebSocket Server]
    G -.->|60fps Stream| H[Next.js Dashboard]
    
    H -.->|REST API| I[Control Plane]
    I -.->|Configure| B
    I -.->|Update Rules| C
```

## 🛠️ Tech Stack

### Frontend (pcap-dashboard)
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, shadcn/ui
- **State Management:** Zustand
- **Data Visualization:** Recharts, TanStack Table
- **Icons:** Lucide React

### Backend (DPI Engine)
- **Language:** Java (High-Performance FastPath)
- **Packet Processing:** Native bindings / Java PCAP libraries
- **API:** REST (Control Plane) + WebSockets (Data Plane)

## 📦 Getting Started

### 1. Deploy the Frontend Dashboard (Quickest)

You can instantly deploy the frontend dashboard to Vercel for free by clicking the button below:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdwivedyarvind67%2FDPI&root-directory=pcap-dashboard)

*Note: When deploying, Vercel will automatically detect it's a Next.js app and build it.*

### 2. Run the Frontend Locally
Navigate to the dashboard directory, install dependencies, and start the development server:

```bash
cd pcap-dashboard
npm install
npm run dev
```
The dashboard will be available at [http://localhost:3000](http://localhost:3000).

### 2. Start the Backend Engine
*(Backend implementation instructions coming soon)*

## 📖 Learn More

Once the dashboard is running, navigate to the **Blog / How It Works** tab in the sidebar to read an in-depth breakdown of the FastPath worker architecture, lock-free ring buffers, and the rules engine!

---

**Author:** Arvind Dwivedi
