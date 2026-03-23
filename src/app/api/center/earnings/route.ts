import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Booking, Center, Test, Package } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions as any) as any;

        if (!session || !session.user?.centerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const centerId = session.user.centerId;
        const { searchParams } = new URL(req.url);
        const dateFrom = searchParams.get("from");
        const dateTo = searchParams.get("to");

        let query: any = { centerId };

        if (dateFrom || dateTo) {
            query.bookingDate = {};
            if (dateFrom) {
                const start = new Date(dateFrom);
                start.setHours(0, 0, 0, 0);
                query.bookingDate.$gte = start;
            }
            if (dateTo) {
                const end = new Date(dateTo);
                end.setHours(23, 59, 59, 999);
                query.bookingDate.$lte = end;
            }
        } else {
            // Default to today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tonight = new Date();
            tonight.setHours(23, 59, 59, 999);
            query.bookingDate = { $gte: today, $lte: tonight };
        }

        const [centerData, bookings] = await Promise.all([
            Center.findById(centerId).lean(),
            Booking.find(query)
                .populate({ path: "tests", model: Test })
                .populate({ path: "packages", model: Package, strictPopulate: false })
                .sort({ bookingDate: -1 })
                .lean()
        ]);

        const summary = bookings.reduce((acc: any, curr: any) => {
            acc.totalGross += (curr.totalAmount || 0);
            acc.totalDiscount += (curr.discount || 0);
            acc.totalNet += (curr.netAmount || 0);
            acc.totalPaid += (curr.paidAmount || 0);
            acc.totalBalance += (curr.balance || 0);
            return acc;
        }, {
            totalGross: 0,
            totalDiscount: 0,
            totalNet: 0,
            totalPaid: 0,
            totalBalance: 0
        });

        return NextResponse.json({
            center: centerData,
            bookings,
            summary,
            period: {
                from: dateFrom || new Date().toISOString().split('T')[0],
                to: dateTo || new Date().toISOString().split('T')[0]
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
