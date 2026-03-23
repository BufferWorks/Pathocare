# 🏥 PathoCare LIS: Laboratory Machine Integration Guide

This document outlines the professional architectural standards for connecting **PathoCare Cloud LIS** with physical laboratory diagnostic hardware (Analyzers).

## 1. Architectural Overview

PathoCare utilizes a **Uni-Directional/Bi-Directional Interface** (depending on the analyzer's capabilities). The connection follows a three-tier synchronization logic:

### Layer A: The Hardware (Analyzer)
* **Output Protocols**: HL7 v2.x, ASTM E1394, or proprietary CSV/XML streams.
* **Connectivity**: RS232 Serial Port or TCP/IP Ethernet.

### Layer B: The Local Bridge (Middleware Agent)
* A local service (Node.js/Python based) installed on the lab workstation.
* **Function**: Captures the raw machine stream, parses the data nodes, and securely transmits them to the PathoCare Cloud.
* **Authentication**: Token-based secure API handshake.

### Layer C: The Cloud LIS (PathoCare)
* **The Ingest Node**: `/api/machine` endpoint receives validated clinical telemetries.
* **Neural Mapping**: Matches Machine Parameter Codes (e.g., `HGB`) to LIS Parameter Names (e.g., `Hemoglobin`).

---

## 2. Integration Modes

### Mode 1: Result Ingest (Automated Reporting)
1. Blood sample is barcoded and placed in the machine.
2. Machine finishes analysis and sends data to the Local Bridge.
3. Bridge POSTs data to PathoCare.
4. Technician clicks **"Sync from Machine"** in the Investigation Matrix.
5. Report is instantly populated.

### Mode 2: Worklist Download (Fully Autonomous)
1. Patient is booked in PathoCare.
2. PathoCare sends the 'Work Order' (Patient ID + Required Tests) to the machine.
3. Machine automatically knows which tests to run for that barcode.

---

## 3. Supported Machine Clusters

PathoCare is engineered to interface with all leading diagnostic hardware, including:
* **Hematology**: Sysmex XN series, Mindray, Horiba, Beckman Coulter.
* **Biochemistry**: Roche Cobas, Abbott Architect, Siemens Dimension.
* **Immunology**: Tosoh, Biomerieux (Vidas), Ortho Vitros.

---

## 4. Getting Started with Integration

To enable hardware connectivity for a new Lab Node:
1. Ensure all machines are equipped with an RS232/Ethernet interface.
2. Request the **PathoCare Local Agent v2.0** deployment package.
3. Map the Machine's Observation IDs to PathoCare Test Parameters.

---
*Configured for Excellence in Clinical Intelligence.*
