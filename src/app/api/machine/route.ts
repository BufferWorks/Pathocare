import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const barcode = searchParams.get("barcode");

        if (!barcode) return NextResponse.json({ error: "No barcode ID provided" }, { status: 400 });

        // Fetch THE ACTUAL REPORT for this barcode
        const { Machine, Report, Booking } = require("@/lib/models");
        const connectDB = require("@/lib/mongodb").default;
        await connectDB();

        const booking = await Booking.findOne({ barcode });
        if (!booking) return NextResponse.json({ results: {} });

        const report = await Report.findOne({ bookingId: booking._id });
        // Extract structured results from the real report document
        const reportResults = report?.results || [];

        return NextResponse.json({
            status: "Connected",
            activeNodes: ["HEM_BRIDGE"],
            timestamp: new Date().toISOString(),
            results: reportResults // Returning the structured results
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
