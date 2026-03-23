import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions as any);

        if (!session || !session.user.centerId) {
            const users = await User.find({ role: { $ne: "SUPER_ADMIN" } }).lean();
            return NextResponse.json(users);
        }

        const centerId = session.user.centerId;
        const users = await User.find({ centerId }).sort({ role: 1, name: 1 }).lean();

        return NextResponse.json(users);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions as any);
        if (!session || !session.user.centerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        // Set centerId from session for security
        body.centerId = session.user.centerId;

        // Hash the password before saving
        if (body.password) {
            body.password = await bcrypt.hash(body.password, 10);
        } else {
            // Default password if none provided, though it's usually required
            body.password = await bcrypt.hash("staff123", 10);
        }

        const newUser = await User.create(body);
        return NextResponse.json(newUser, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions as any);
        if (!session || !session.user.centerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { _id, ...updateData } = body;

        // Hash password if it's being updated
        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        const updatedUser = await User.findOneAndUpdate(
            { _id, centerId: session.user.centerId },
            updateData,
            { new: true }
        );
        return NextResponse.json(updatedUser);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions as any);
        if (!session || !session.user.centerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        await User.findOneAndDelete({ _id: id, centerId: session.user.centerId });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
