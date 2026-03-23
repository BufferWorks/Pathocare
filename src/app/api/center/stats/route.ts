import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Booking, Report, Center, Test, Package } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions as any);

        if (!session || !session.user.centerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const centerId = session.user.centerId;

        // Fetch stats for this specific center
        const [centerData, bookings] = await Promise.all([
            Center.findById(centerId).lean(),
            Booking.find({ centerId })
                .populate({ path: "tests", model: Test })
                .populate({ path: "packages", model: Package, strictPopulate: false })
                .sort({ bookingDate: -1 })
                .limit(10)
                .lean()
        ]);

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [todayBookingsCount, readyReportsCount, todayRevenueData] = await Promise.all([
            Booking.countDocuments({ centerId, bookingDate: { $gte: todayStart } }),
            Booking.countDocuments({ centerId, status: "Completed" }),
            Booking.aggregate([
                { $match: { centerId, bookingDate: { $gte: todayStart } } },
                { $group: { _id: null, total: { $sum: "$netAmount" } } }
            ])
        ]);

        return NextResponse.json({
            centerName: centerData?.name || "LifeCare Diagnostics",
            centerId: centerData?._id?.toString().slice(-6).toUpperCase() || "CD-001",
            todayBookings: todayBookingsCount,
            pendingSamples: await Booking.countDocuments({ centerId, status: { $in: ["Pending", "Collected"] } }),
            readyReports: readyReportsCount,
            todayRevenue: todayRevenueData[0]?.total || 0,
            recentPatients: bookings.map((b: any) => {
                const testNames = [
                    ...(b.tests || []).map((t: any) => t.name),
                    ...(b.packages || []).map((p: any) => p.name)
                ].join(", ");

                return {
                    id: b._id.toString().slice(-6).toUpperCase(),
                    name: b.patientName || "Unknown Patient",
                    test: testNames || "Diagnostics Analysis",
                    time: new Date(b.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: b.status || "Pending"
                };
            })
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
