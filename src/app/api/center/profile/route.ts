import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Center } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);

        if (!session || !session.user.centerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const center = await Center.findById(session.user.centerId);
        return NextResponse.json(center);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);

        if (!session || !session.user.centerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const center: any = await Center.findById(session.user.centerId);

        if (!center) {
            return NextResponse.json({ error: "Laboratory not found" }, { status: 404 });
        }

        console.log("OLD Center Data:", JSON.stringify(center, null, 2));
        console.log("NEW Data to apply:", JSON.stringify(data, null, 2));

        // Manually apply updates
        Object.keys(data).forEach(key => {
            if (data[key] !== undefined) {
                center[key] = data[key];
            }
        });

        // Ensure array is marked as modified for persistence
        center.markModified('signatories');

        const savedCenter = await center.save();
        console.log("SAVED Center Result:", JSON.stringify(savedCenter, null, 2));

        return NextResponse.json(savedCenter);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
