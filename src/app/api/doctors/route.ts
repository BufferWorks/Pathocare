import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Doctor } from "@/lib/models";

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const newDoctor = await Doctor.create(body);
        return NextResponse.json(newDoctor, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        await connectDB();
        const doctors = await Doctor.find({}).sort({ name: 1 });
        return NextResponse.json(doctors);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
