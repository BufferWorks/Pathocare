import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Report } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params; // id is bookingId
        await connectDB();

        const session: any = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const report = await Report.findOne({ bookingId: id });
        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        // Generate a 24-character hex token for high-entropy ephemeral access
        const token = crypto.randomBytes(12).toString("hex");

        // Expiration: 24 hours (Dynamic Ephemeral Window)
        // This ensures patient access is temporary and space/privacy is regulated.
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        report.shareToken = token;
        report.shareExpiresAt = expiresAt;
        await report.save();

        const baseUrl = process.env.NEXTAUTH_URL || (req.headers.get("host") ? `${req.headers.get("x-forwarded-proto") || "http"}://${req.headers.get("host")}` : "http://localhost:3000");
        const shareUrl = `${baseUrl}/public/report/${token}`;

        return NextResponse.json({
            success: true,
            shareUrl,
            token,
            expiresAt,
            note: "Ephemeral link active for 24 hours."
        });
    } catch (error: any) {
        console.error("Share link generation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
