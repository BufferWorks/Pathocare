import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Center, Booking, Test, User } from "@/lib/models";

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query || query.length < 2) {
            return NextResponse.json([]);
        }

        const regex = new RegExp(query, "i");

        const [centers, bookings, tests] = await Promise.all([
            Center.find({ $or: [{ name: regex }, { address: regex }] }).limit(3).lean(),
            Booking.find({ $or: [{ patientName: regex }, { phone: regex }] }).limit(3).lean(),
            Test.find({ name: regex }).limit(3).lean(),
        ]);

        const results = [
            ...centers.map((c: any) => ({ type: "Center", title: c.name, sub: c.address, link: "/admin/centers" })),
            ...bookings.map((b: any) => ({ type: "Patient", title: b.patientName, sub: b.phone, link: "/center/worklist" })),
            ...tests.map((t: any) => ({ type: "Test", title: t.name, sub: `₹${t.price}`, link: "/admin/tests" })),
        ];

        return NextResponse.json(results);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
