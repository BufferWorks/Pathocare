import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Machine } from "@/lib/models";

/**
 * 🛰️ Neural Telemetry Handshake API
 * Used by the Relay Node to update its heartbeat and connection status.
 */
export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { secretKey, isOnline, machineIP, relayIP, relayPort, connectionMode, log_stream } = body;

        if (!secretKey) return NextResponse.json({ error: "No Token" }, { status: 400 });

        const machine = await Machine.findOne({ secretKey });
        if (!machine) return NextResponse.json({ error: "Node Unknown" }, { status: 404 });

        // Update the machine's real-time telemetry state
        if (isOnline !== undefined) machine.isOnline = isOnline;
        if (machineIP !== undefined) machine.machineIP = machineIP;
        if (relayIP !== undefined) machine.relayIP = relayIP;
        if (relayPort !== undefined) machine.relayPort = relayPort;
        if (connectionMode) machine.connectionMode = connectionMode;

        // CAPTURE TERMINAL LOGS: Pushes relay stdout to the cloud terminal UI
        if (log_stream) {
            machine.terminalLogs = [log_stream, ...(machine.terminalLogs || [])].slice(0, 100);
            machine.markModified('terminalLogs'); // Ensure Mongoose saves the array change
        }

        machine.lastSync = new Date(); // Heartbeat pulse
        await machine.save();

        return NextResponse.json({ 
            node: machine.name, 
            status: machine.isOnline ? "ONLINE_ACTIVE" : "ONLINE_READY",
            linkedMachine: machine.machineIP || "AWAITING_PHYSICAL_HANDSHAKE" 
        });

    } catch (error: any) {
        return NextResponse.json({ error: "Telemetry Sync Failure: " + error.message }, { status: 500 });
    }
}
