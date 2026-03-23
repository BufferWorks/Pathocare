import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Test } from "@/lib/models";

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const newTest = await Test.create({ ...body, isGlobal: true });
        return NextResponse.json(newTest, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const centerId = searchParams.get("centerId");
        const globalOnly = searchParams.get("global") === "true";

        let query: any = {};
        if (globalOnly) {
            query = { isGlobal: true };
        } else if (centerId) {
            query = { centerId };
        } else {
            query = { isGlobal: true }; // Default to global if nothing specified
        }

        const tests = await Test.find(query).sort({ category: 1, name: 1 });
        return NextResponse.json(tests);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "Node ID required" }, { status: 400 });
        }

        // Only allow deleting global templates from this API
        await Test.findOneAndDelete({ _id: id, isGlobal: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const data = await req.json();
        const { _id, ...updateData } = data;

        if (!_id) {
            return NextResponse.json({ error: "Node ID required" }, { status: 400 });
        }

        const test = await Test.findOneAndUpdate(
            { _id, isGlobal: true },
            updateData,
            { new: true }
        );

        return NextResponse.json(test);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
