import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Booking, Report, Test, Package, Notification, Center, Panel } from "@/lib/models";
import { createAuditLog } from "@/lib/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        await connectDB();

        // 1. Authenticate and resolve centerId
        const session: any = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized: Access Denied" }, { status: 401 });
        }

        const data = await req.json();
        let centerId = session.user.centerId;

        // EMERGENCY PROTOCOL: If Super Admin is booking but no centerId is in session, 
        // fetch the first available center for the demo/dev broadcast.
        if (!centerId && session.user.role === "SUPER_ADMIN") {
            const firstCenter = await Center.findOne();
            if (firstCenter) centerId = firstCenter._id.toString();
        }

        if (!centerId) {
            return NextResponse.json({ error: "Node Identity Unavailable: Missing Center ID" }, { status: 400 });
        }

        // 1. Auto-generate Barcode if not provided
        let barcode = data.barcode;
        if (!barcode || barcode.trim() === "") {
            // Generate unique 8-char identifier: PC-[6 random chars]
            const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid ambiguous O, 0, I, 1
            let isUnique = false;
            while (!isUnique) {
                let random = "";
                for (let i = 0; i < 6; i++) {
                    random += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                barcode = `PC-${random}`;
                const existing = await Booking.findOne({ barcode });
                if (!existing) isUnique = true;
            }
        }

        // Force the resolved centerId to maintain data isolation
        const bookingData = {
            ...data,
            barcode,
            centerId
        };

        // 1. Create the booking document
        const newBooking = await Booking.create(bookingData);

        // 2. Aggregate all test IDs (from direct tests and packages)
        let allTestIds = [...(bookingData.tests || [])];

        if (bookingData.packages && bookingData.packages.length > 0) {
            const packages = await Package.find({ _id: { $in: bookingData.packages } });
            packages.forEach(pkg => {
                pkg.tests.forEach((testId: any) => {
                    if (!allTestIds.includes(testId.toString())) {
                        allTestIds.push(testId.toString());
                    }
                });
            });
        }

        // 3. Initialize an empty report for all unique tests
        const testsWithParams = await Test.find({ _id: { $in: allTestIds } });

        await Report.create({
            bookingId: newBooking._id,
            results: testsWithParams.map((test: any) => ({
                testId: test._id,
                parameterResults: test.parameters.map((p: any) => ({
                    name: p.name,
                    unit: p.unit,
                    normalRange: p.normalRange,
                    value: "" // Initial empty value
                }))
            }))
        });

        // 4. Create Audit Log
        if (session?.user) {
            await createAuditLog({
                centerId: session.user.centerId,
                userId: session.user.id,
                action: "PATIENT_REGISTRATION",
                targetId: newBooking._id.toString(),
                targetModel: "Booking",
                details: { patientName: newBooking.patientName }
            });
        }
        // 5. Create Notification for the Center
        await Notification.create({
            title: "New Booking Registered",
            description: `Patient ${newBooking.patientName} has been booked for diagnostics.`,
            type: "info",
            icon: "UserPlus",
            centerId: newBooking.centerId
        });

        return NextResponse.json(newBooking, { status: 201 });
    } catch (error: any) {
        console.error("Booking creation error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const centerId = searchParams.get("centerId");
        const dateFrom = searchParams.get("from");
        const dateTo = searchParams.get("to");

        let query: any = centerId ? { centerId } : {};

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
        }

        // Fetch bookings with test and package details populated
        const bookings = await Booking.find(query)
            .populate({ path: "tests", model: Test })
            .populate({ path: "packages", model: Package, strictPopulate: false })
            .populate("panelId")
            .sort({ bookingDate: -1 });

        return NextResponse.json(bookings);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
