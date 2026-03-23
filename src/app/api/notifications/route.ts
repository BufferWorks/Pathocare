import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Notification } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        await connectDB();
        const session = (await getServerSession(authOptions as any)) as any;

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userRole = session.user.role;
        const centerId = session.user.centerId;

        let query: any = {};

        if (userRole === "SUPER_ADMIN") {
            // Fetch notifications intended for Super Admin or global notifications
            query = {
                $or: [
                    { recipientRole: "SUPER_ADMIN" },
                    { centerId: null }
                ]
            };
        } else {
            // Fetch notifications for the specific center
            query = { centerId };
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(20);

        return NextResponse.json(notifications);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const session = (await getServerSession(authOptions as any)) as any;

        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await req.json();

        // Mark as read
        const notification = await Notification.findByIdAndUpdate(
            id,
            { isRead: true },
            { new: true }
        );

        return NextResponse.json(notification);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
