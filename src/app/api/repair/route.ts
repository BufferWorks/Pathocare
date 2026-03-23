import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { User, Center } from "@/lib/models";

export async function GET() {
    try {
        await connectDB();

        const email = "admin@test.com";
        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return NextResponse.json({
                error: "User not found in system matrix.",
                suggestion: "Please register this account first or run the seed command."
            }, { status: 404 });
        }

        // 1. Force Upgrade to SUPER_ADMIN to bypass all subscription logic
        user.role = "SUPER_ADMIN";
        await user.save();

        // 2. If it's attached to a center, calibrate that center as well just in case
        if (user.centerId) {
            await Center.findByIdAndUpdate(user.centerId, {
                isActive: true,
                expiryDate: new Date("2030-01-01"), // Set far into the future
                subscriptionAmount: 9999
            });
        }

        return NextResponse.json({
            status: "SUCCESS",
            message: `Account ${email} has been promoted to SUPER_ADMIN.`,
            action: "You can now log in without facing the 'Subscription Expired' barrier."
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
