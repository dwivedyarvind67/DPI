<div align="center">
  
  # 🚀 High-Performance DPI Engine & Telemetry Dashboard
  
  **A state-of-the-art Deep Packet Inspection (DPI) and network telemetry platform.**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![Java](https://img.shields.io/badge/Java-21-orange?style=for-the-badge&logo=java)](https://www.java.com/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Zustand](https://img.shields.io/badge/State-Zustand-764ABC?style=for-the-badge)](https://zustand-demo.pmnd.rs/)

  *This project features a high-throughput **Java FastPath backend** for dissecting packets and a premium, highly-responsive **Next.js 15 dashboard** for real-time visualization and control.*

</div>

---

## 📸 Dashboard Sneak Peek

*(Note to developer: Replace these placeholders with actual screenshots of your running app by saving them to a `docs/` folder)*

| 🌙 Dark Mode | ☀️ Light Mode |
| :---: | :---: |
| <img src="https://placehold.co/600x350/121212/ffffff?text=Monitor+Dashboard+(Dark)" width="400" alt="Monitor Dark"><br>*(Real-time telemetry and pipeline diagram)* | <img src="https://placehold.co/600x350/f8f9fa/121212?text=Monitor+Dashboard+(Light)" width="400" alt="Monitor Light"><br>*(Real-time telemetry and pipeline diagram)* |
| <img src="https://placehold.co/600x350/121212/ffffff?text=Configuration+(Dark)" width="400" alt="Config Dark"><br>*(Rule editor and worker configuration)* | <img src="https://placehold.co/600x350/f8f9fa/121212?text=Configuration+(Light)" width="400" alt="Config Light"><br>*(Rule editor and worker configuration)* |
| <img src="https://placehold.co/600x350/121212/ffffff?text=Traffic+Flows+(Dark)" width="400" alt="Flows Dark"><br>*(Live tracking of network connections)* | <img src="https://placehold.co/600x350/f8f9fa/121212?text=Traffic+Flows+(Light)" width="400" alt="Flows Light"><br>*(Live tracking of network connections)* |

---

## 🚀 Key Features

- **FastPath Architecture:** Multi-threaded packet processing engine capable of handling millions of packets per second without dropping frames.
- **Lock-Free Ring Buffers:** Zero-contention telemetry data collection that never blocks the critical data plane.
- **Dynamic Rules Engine:** Apply, update, and remove L3/L4 packet filtering and dropping rules on the fly.
- **Real-Time Telemetry Dashboard:** 
  - Built with **Next.js 15**, **React**, and **Tailwind CSS**.
  - Clean, professional SaaS design aesthetics.
  - Seamless toggle between Light Mode and Dark Mode.
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
- **Language:** Java 21 (High-Performance FastPath)
- **Packet Processing:** Native bindings / Java PCAP libraries
- **Testing:** Python 3 (Automated end-to-end testing suite)
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

### 3. Run the Backend Engine Tests
We have built an automated Python test suite that generates PCAP files, compiles the Java engine, and verifies its filtering rules.

Requirements:
- Java JDK 21+
- Python 3.x

```bash
# Generate test traffic and run the Java engine
python test_dpi_engine.py
```
This script will output a detailed summary of the pipeline execution and generate a filtered output file (`output.pcap`).

## 📖 Learn More

Once the dashboard is running, navigate to the **Blog / How It Works** tab in the sidebar to read an in-depth breakdown of the FastPath worker architecture, lock-free ring buffers, and the rules engine!

---

**Author:** Arvind Dwivedi
