import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Booking, Test, Doctor, Package } from "@/lib/models";

import { isValidObjectId } from "mongoose";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectDB();
        const booking = await Booking.findById(id)
            .populate({ path: "tests", model: Test })
            .populate({ path: "packages", model: Package, strictPopulate: false })
            .populate({ path: "doctorId", model: Doctor })
            .lean();

        if (!booking) {
            return NextResponse.json({ error: "Booking node not found in cluster" }, { status: 404 });
        }

        return NextResponse.json(booking);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
