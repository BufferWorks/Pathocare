import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Booking, Center } from "@/lib/models";

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");
        const search = searchParams.get("search");

        let query: any = {};
        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }

        // Fetch transactions
        const bookings = await Booking.find(query).sort({ createdAt: -1 }).populate({
            path: "centerId",
            model: Center,
            select: "name"
        }).lean();

        const transactions = bookings.map((b: any) => ({
            date: new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
            branch: b.centerId?.name || "Global Lab",
            test: b.testsCombined || "Diagnostics",
            total: b.totalAmount || 0,
            paid: b.totalAmount || 0, // Mock paid as full for now
            balance: 0,
            status: "Fully Paid"
        })).filter((tx: any) =>
            !search || tx.branch.toLowerCase().includes(search.toLowerCase())
        );

        const grossRevenue = transactions.reduce((sum, tx) => sum + tx.total, 0);
        const totalPaid = transactions.reduce((sum, tx) => sum + tx.paid, 0);
        const pendingBalance = transactions.reduce((sum, tx) => sum + tx.balance, 0);

        return NextResponse.json({
            summary: [
                { label: "Gross Revenue", value: `₹${grossRevenue.toLocaleString()}`, trend: "+12.5%", color: "text-green-500" },
                { label: "Total Paid", value: `₹${totalPaid.toLocaleString()}`, trend: "100% coll.", color: "text-blue-500" },
                { label: "Pending Balance", value: `₹${pendingBalance.toLocaleString()}`, trend: "0% risk", color: "text-orange-500" },
            ],
            transactions
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
