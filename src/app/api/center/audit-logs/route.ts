import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { AuditLog, User } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);
        if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const targetId = searchParams.get("targetId");

        let query: any = { centerId: session.user.centerId };
        if (targetId) {
            query.$or = [
                { targetId: targetId },
                { "details.bookingId": targetId }
            ];
        }

        const logs = await AuditLog.find(query)
            .populate({ path: "userId", model: User, select: "name email role" })
            .sort({ timestamp: -1 })
            .limit(100);

        return NextResponse.json(logs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
