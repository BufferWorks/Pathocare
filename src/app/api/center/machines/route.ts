import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Machine, Center } from "@/lib/models";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const centerId = searchParams.get("centerId") || session.user.centerId;

        // If Super Admin, they can view any center's machines
        // If Center Admin, they can only view their own
        const finalCenterId = session.user.role === "SUPER_ADMIN" ? centerId : session.user.centerId;

        if (!finalCenterId) {
            // If Super Admin and no centerId provided, return all centers for selection
            if (session.user.role === "SUPER_ADMIN") {
                const centers = await Center.find().select("name email phone");
                return NextResponse.json({ type: "centers", data: centers });
            }
            return NextResponse.json({ error: "No center context found" }, { status: 400 });
        }

        const machines = await Machine.find({ centerId: finalCenterId }).sort({ createdAt: -1 });
        const center = await Center.findById(finalCenterId).select("name");

        // Discovery: Get Server's own Local IP as fallback for relay
        const os = require('os');
        const networkInterfaces = os.networkInterfaces();
        let serverIP = '127.0.0.1';
        for (const interfaceName in networkInterfaces) {
            for (const iface of networkInterfaces[interfaceName]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    serverIP = iface.address;
                    break;
                }
            }
        }

        return NextResponse.json({
            type: "machines",
            centerName: center?.name,
            hostIP: serverIP,
            data: machines
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);

        if (!session || (session.user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Forbidden: Super Admin Access Required for Control" }, { status: 403 });
        }

        const body = await req.json();
        const { machineId, name, protocol, isPaused, globalKill, centerId } = body;

        if (globalKill) {
            await Machine.updateMany({ centerId }, { isPaused: true });
            return NextResponse.json({ message: "Global Circuit Breaker Activated" });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (protocol) updateData.protocol = protocol;
        if (typeof isPaused === 'boolean') updateData.isPaused = isPaused;

        const machine = await Machine.findByIdAndUpdate(machineId, updateData, { new: true });
        return NextResponse.json(machine);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);

        if (!session || (session.user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Forbidden: Super Admin Access Required for Provisioning" }, { status: 403 });
        }

        const body = await req.json();
        const { name, type, protocol, port, centerId } = body;

        const machine = await Machine.create({
            name,
            type,
            protocol,
            port,
            centerId,
            isPaused: false,
            secretKey: `PATHOCARE_NODE_${Math.random().toString(36).substring(2, 10).toUpperCase()}`, // Secure Token
            health: 100,
            lastSync: new Date()
        });

        return NextResponse.json(machine);

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);

        if (!session || (session.user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({ error: "Forbidden: Super Admin Access Required for Decommissioning" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const machineId = searchParams.get("machineId");

        if (!machineId) {
            return NextResponse.json({ error: "Machine ID Required" }, { status: 400 });
        }

        await Machine.findByIdAndDelete(machineId);

        return NextResponse.json({ message: "Node Decommissioned Successfully" });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
