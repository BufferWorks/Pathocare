import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Test } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);

        if (!session || !session.user.centerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Fetch both local and global tests
        const rawTests = await Test.find({
            $or: [
                { centerId: session.user.centerId },
                { isGlobal: true }
            ]
        }).sort({ createdAt: -1 });

        // 3. De-duplicate by name: Prioritize center-specific overrides
        const uniqueTestsMap = new Map();

        // Phase 1: Lock in local center overrides
        rawTests.filter(t => t.centerId?.toString() === session.user.centerId).forEach(test => {
            uniqueTestsMap.set(test.name, test);
        });

        // Phase 2: Fill gaps with global templates
        rawTests.filter(t => t.isGlobal).forEach(test => {
            if (!uniqueTestsMap.has(test.name)) {
                uniqueTestsMap.set(test.name, test);
            }
        });

        const tests = Array.from(uniqueTestsMap.values());
        return NextResponse.json(tests);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);

        if (!session || !session.user.centerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        // Force isGlobal to false for center-created tests to prevent scope leakage
        const test = await Test.create({
            ...data,
            centerId: session.user.centerId,
            isGlobal: false
        });

        return NextResponse.json(test);
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
        const { _id, ...updateData } = data;

        const test = await Test.findOneAndUpdate(
            { _id, centerId: session.user.centerId },
            updateData,
            { new: true }
        );

        return NextResponse.json(test);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);

        if (!session || !session.user.centerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        await Test.findOneAndDelete({ _id: id, centerId: session.user.centerId });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
