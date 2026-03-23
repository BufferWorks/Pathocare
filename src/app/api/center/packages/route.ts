import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Package } from "@/lib/models";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);
        if (!session || !session.user.centerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Fetch both local and global packages
        const rawPackages = await Package.find({
            $or: [
                { centerId: session.user.centerId },
                { isGlobal: true }
            ]
        })
            .populate("tests")
            .sort({ createdAt: -1 });

        // 3. De-duplicate by name: Prioritize center-specific overrides
        const uniquePackagesMap = new Map();

        // Phase 1: Lock in local center overrides
        rawPackages.filter(t => t.centerId?.toString() === session.user.centerId).forEach(pkg => {
            uniquePackagesMap.set(pkg.name, pkg);
        });

        // Phase 2: Fill gaps with global templates
        rawPackages.filter(t => t.isGlobal).forEach(pkg => {
            if (!uniquePackagesMap.has(pkg.name)) {
                uniquePackagesMap.set(pkg.name, pkg);
            }
        });

        const packages = Array.from(uniquePackagesMap.values());
        return NextResponse.json(packages);
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
        const newPackage = await Package.create({
            ...data,
            centerId: session.user.centerId,
            isGlobal: false
        });

        return NextResponse.json(newPackage);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);
        if (!session || !session.user.centerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await req.json();
        const { _id, ...updateData } = data;
        const updatedPackage = await Package.findOneAndUpdate(
            { _id, centerId: session.user.centerId },
            updateData,
            { new: true }
        );

        return NextResponse.json(updatedPackage);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const session: any = await getServerSession(authOptions);
        if (!session || !session.user.centerId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        await Package.findOneAndDelete({ _id: id, centerId: session.user.centerId });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
