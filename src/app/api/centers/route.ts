import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Center, User } from "@/lib/models";
import bcrypt from "bcryptjs"; // Need to install this
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { name, phone, address, password } = body;
        const email = body.email?.toLowerCase().trim();

        // 1. Check if center or user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ error: "Email already registered" }, { status: 400 });
        }

        // 2. Generate Universal Lab Credentials
        const apiKey = crypto.randomUUID();
        const labId = `lab_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;

        // 3. Create the Center
        const newCenter = await Center.create({
            name,
            email,
            phone,
            address,
            labId,
            apiKey
        });

        // 3. Create the Center Admin User
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name: `${name} Admin`,
            email,
            password: hashedPassword,
            role: "CENTER_ADMIN",
            centerId: newCenter._id
        });

        // 4. Link User back to Center (optional but good for tracking)
        newCenter.owner = newUser._id;
        await newCenter.save();

        // 5. Create Notification for Super Admin
        const { Notification } = require("@/lib/models");
        await Notification.create({
            title: "New Center Onboarded",
            description: `${name} has successfully established a node in the enterprise matrix.`,
            type: "success",
            icon: "Building2",
            recipientRole: "SUPER_ADMIN"
        });

        return NextResponse.json({
            message: "Center registered successfully",
            centerId: newCenter._id
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET() {
    try {
        await connectDB();
        const centers = await Center.find({}).populate({ path: "owner", model: User, select: "name email" }).sort({ createdAt: -1 });
        return NextResponse.json(centers);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
