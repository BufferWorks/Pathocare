import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Booking } from "@/lib/models";
import { createAuditLog } from "@/lib/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request) {
    try {
        await connectDB();
        const { id, status } = await req.json();

        const booking = await Booking.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!booking) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // Create Audit Log
        const session: any = await getServerSession(authOptions);
        if (session?.user) {
            await createAuditLog({
                centerId: session.user.centerId,
                userId: session.user.id,
                action: "STATUS_UPDATE",
                targetId: booking._id.toString(),
                targetModel: "Booking",
                details: { newStatus: status }
            });
        }

        return NextResponse.json(booking);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
