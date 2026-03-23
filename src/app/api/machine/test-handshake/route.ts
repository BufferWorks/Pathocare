import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Machine, Booking, Report, Test } from "@/lib/models";

/**
 * 🧪 PathoCare Neural Handshake Simulator
 * This endpoint allows developers to simulate a physical machine connection.
 * It provides the exact CURL commands and Payload structure required for 
 * any lab analyzer (Hematology, Biochemistry, etc.) to bridge with the cloud.
 */
export async function GET() {
    try {
        await connectDB();

        // 1. Find a valid specimen and matching hardware node
        const booking = await Booking.findOne().sort({ createdAt: -1 });
        const machine = await Machine.findOne({ secretKey: { $exists: true } });

        console.log("TEST_HANDSHAKE: Machine found ->", machine?.name, "Key ->", machine?.secretKey);

        if (!booking || !machine) {
            return NextResponse.json({
                error: "Simulation Environment Not Ready",
                suggestion: "Please book a patient and provision a machine node first."
            });
        }

        const barcode = booking.barcode || "NODE_SPEC_01";
        const secretKey = machine.secretKey;

        // 2. Generate the Exact Connection Blueprint
        const payload: any = {
            secretKey: secretKey,
            barcode: barcode,
            results: {
                "HGB": (11 + Math.random() * 4).toFixed(1),
                "WBC": Math.floor(4000 + Math.random() * 6000),
                "PLT": Math.floor(150000 + Math.random() * 250000)
            },
            timestamp: new Date().toISOString()
        };

        const curlCommand = `curl -X POST http://localhost:3000/api/machine/push \
-H "Content-Type: application/json" \
-d '${JSON.stringify(payload)}'`;

        return NextResponse.json({
            handshake: {
                target_node: machine.name,
                target_specimen: booking.patientName,
                assigned_barcode: barcode,
                node_security_key: secretKey
            },
            protocol_definition: {
                endpoint: "/api/machine/push",
                method: "POST",
                payload_schema: {
                    secretKey: "NODE_SECRET_TOKEN",
                    barcode: "PATIENT_SAMPLE_BARCODE",
                    results: "KEY_VALUE_PAIRS_OF_READINGS",
                    timestamp: "UTC_TIMESTAMP"
                }
            },
            simulation_command: curlCommand
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
