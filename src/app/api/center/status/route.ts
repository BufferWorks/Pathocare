import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Center } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);

        if (!session?.user || session.user.role === "SUPER_ADMIN") {
            return NextResponse.json({ ok: true });
        }

        const centerId = session.user.centerId;
        const center = await Center.findById(centerId);

        if (!center) {
            return NextResponse.json({ error: "Center not found", suspended: true }, { status: 403 });
        }

        const isExpired = center.expiryDate && new Date(center.expiryDate) < new Date();

        if (!center.isActive || isExpired) {
            return NextResponse.json({
                error: isExpired ? "Subscription Expired" : "Account Suspended",
                suspended: !center.isActive,
                expired: isExpired
            }, { status: 403 });
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
