import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Report, Booking, Center, Test, Doctor } from "@/lib/models";

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
    try {
        const { token } = await params;
        await connectDB();

        // High-Security Ephemeral Link Retrieval
        // 1. Locate the report by its unique cryptographic token
        const report = await Report.findOne({ shareToken: token })
            .populate({
                path: "bookingId",
                populate: [
                    { path: "tests", model: Test },
                    { path: "packages", model: "Package" },
                    { path: "doctorId", model: Doctor }
                ]
            })
            .populate({ path: "results.testId", model: Test })
            .lean();

        if (!report) {
            return NextResponse.json({ error: "Access Denied: Universal Node Not Found." }, { status: 404 });
        }

        // 2. Enforce Temporary Access Protocol (Expiration)
        if (report.shareExpiresAt && new Date() > new Date(report.shareExpiresAt)) {
            return NextResponse.json({
                error: "Signal Expired: This ephemeral link has been deactivated for clinical privacy.",
                expired: true
            }, { status: 410 });
        }

        // 3. Retrieve Center Context for Branding
        // Note: report.bookingId might be populated, check centerId there.
        const booking = report.bookingId as any;
        const center = await Center.findById(booking?.centerId).lean();

        return NextResponse.json({
            report,
            center,
            serverTime: new Date()
        });
    } catch (error: any) {
        console.error("Public report access error:", error);
        return NextResponse.json({ error: "Transmission Interrupted: Failed to synchronize with clinical repository." }, { status: 500 });
    }
}
