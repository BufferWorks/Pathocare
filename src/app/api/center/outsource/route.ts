import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { OutsourceLab } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);

        if (!session || !session.user.centerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const labs = await OutsourceLab.find({ centerId: session.user.centerId }).sort({ createdAt: -1 });
        return NextResponse.json(labs);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);

        if (!session || !session.user.centerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const lab = await OutsourceLab.create({
            ...data,
            centerId: session.user.centerId
        });

        return NextResponse.json(lab);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
