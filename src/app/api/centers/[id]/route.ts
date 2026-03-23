import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Center } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectDB();

        const session: any = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized: Super Admin access required" }, { status: 401 });
        }

        const { userEmail, password, ...centerData } = await req.json();

        // 1. Update center with subscription fields
        const center = await Center.findByIdAndUpdate(id, centerData, { new: true });

        if (!center) {
            return NextResponse.json({ error: "Center not found" }, { status: 404 });
        }

        // 2. Update Owner Credentials if provided
        if (center.owner && (userEmail || password)) {
            const { User } = require("@/lib/models");
            const bcrypt = require("bcryptjs");

            const updateData: any = {};
            if (userEmail) updateData.email = userEmail.toLowerCase().trim();
            if (password) updateData.password = await bcrypt.hash(password, 10);

            await User.findByIdAndUpdate(center.owner, updateData);
        }

        const updatedCenter = await Center.findById(center._id).populate({ path: "owner", model: require("@/lib/models").User, select: "name email" });
        return NextResponse.json(updatedCenter);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectDB();

        const session: any = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await Center.findByIdAndDelete(id);
        return NextResponse.json({ message: "Center deleted successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
