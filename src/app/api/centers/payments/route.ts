import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Center, SubscriptionPayment } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const centerId = searchParams.get("centerId");

        const query = centerId ? { centerId } : {};
        const payments = await SubscriptionPayment.find(query)
            .populate({ path: "centerId", model: Center, select: "name" })
            .sort({ timestamp: -1 });

        return NextResponse.json(payments);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { centerId, amount, plan, method, expiryDate, remarks } = body;

        // 1. Create Payment Record
        const payment = await SubscriptionPayment.create({
            centerId,
            amount,
            plan,
            method,
            expiryDate: new Date(expiryDate),
            remarks
        });

        // 2. Update Center Subscription Pulse
        await Center.findByIdAndUpdate(centerId, {
            subscriptionAmount: amount,
            expiryDate: new Date(expiryDate),
            isActive: true
        });

        return NextResponse.json(payment, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
