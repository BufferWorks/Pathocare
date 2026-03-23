import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Report } from "@/lib/models";

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const bookingId = searchParams.get("bookingId");

        const report = await Report.findOne({ bookingId }).populate("bookingId");
        return NextResponse.json(report);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { reportId, results } = body;

        const updatedReport = await Report.findByIdAndUpdate(
            reportId,
            { results, updatedAt: new Date() },
            { new: true }
        );

        return NextResponse.json(updatedReport);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
