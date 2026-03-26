import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Booking, Test, Doctor, Package, Center } from "@/lib/models";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectDB();
        
        // 1. Fetch Booking with populated tests/packages
        const booking = await Booking.findById(id)
            .populate({ path: "tests", model: Test })
            .populate({ path: "packages", model: Package, strictPopulate: false })
            .populate({ path: "doctorId", model: Doctor })
            .lean();

        if (!booking) {
            return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
        }

        // 2. Fetch Center details based on the booking's centerId
        const center = await Center.findById((booking as any).centerId).lean();

        if (!center) {
            return NextResponse.json({ error: "Laboratory node not found" }, { status: 404 });
        }

        // Return combined data for the public view
        return NextResponse.json({ booking, center });
    } catch (error: any) {
        console.error("Public Receipt API Error:", error);
        return NextResponse.json({ error: "Terminal Link Severed" }, { status: 500 });
    }
}
