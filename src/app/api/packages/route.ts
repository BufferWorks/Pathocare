import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Package } from "@/lib/models";

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const newPackage = await Package.create({ ...body, isGlobal: true });
        return NextResponse.json(newPackage, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const globalOnly = searchParams.get("global") === "true";

        let query: any = {};
        if (globalOnly) {
            query = { isGlobal: true };
        } else {
            query = { isGlobal: true }; // Default to global
        }

        const packages = await Package.find(query).populate("tests").sort({ createdAt: -1 });
        return NextResponse.json(packages);
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

        const pkg = await Package.findOneAndUpdate(
            { _id, isGlobal: true },
            updateData,
            { new: true }
        );

        return NextResponse.json(pkg);
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

        await Package.findOneAndDelete({ _id: id, isGlobal: true });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
