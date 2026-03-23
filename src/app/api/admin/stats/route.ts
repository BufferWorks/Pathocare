import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Center, Booking, User, Test } from "@/lib/models";

export async function GET() {
    try {
        await connectDB();

        // Fetch counts and data in parallel
        const [centerCount, userCount, testCount, bookings] = await Promise.all([
            Center.countDocuments(),
            User.countDocuments(),
            Test.countDocuments(),
            Booking.find({}).select("totalAmount createdAt").lean()
        ]);

        // Calculate total revenue from all bookings
        const totalRevenue = bookings.reduce((sum, b: any) => sum + (b.totalAmount || 0), 0);

        // Get recent centers for the dashboard
        const topCentersData = await Center.find({})
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        return NextResponse.json({
            activeCenters: centerCount,
            globalUsers: userCount,
            totalTests: testCount,
            revenue: totalRevenue,
            topCentersData: topCentersData.map((c: any) => ({
                name: c.name,
                location: c.address?.split(',').pop()?.trim() || "India",
                revenue: "₹---", // Placeholder until we have multi-center revenue logic
                initials: c.name.charAt(0)
            }))
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
