// Corporate Panel Logic Sector
import { NextResponse } from "next/server";
import { Panel } from "@/lib/models";
import connectDB from "@/lib/mongodb";

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const centerId = searchParams.get("centerId");

        if (!centerId) {
            return NextResponse.json({ error: "Center ID required" }, { status: 400 });
        }

        const panels = await Panel.find({ centerId }).sort({ name: 1 });
        return NextResponse.json(panels);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch panels" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { name, centerId } = body;

        const panel = await Panel.create({ name, centerId });
        return NextResponse.json(panel);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create panel" }, { status: 500 });
    }
}
