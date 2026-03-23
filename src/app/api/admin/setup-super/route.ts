import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Center, User, Machine } from "@/lib/models";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        await connectDB();

        const hashedPassword = await bcrypt.hash("demopass123", 10);

        // 1. Create/Update Super Admin
        await User.findOneAndUpdate(
            { email: "superadmin@pathocore.com" },
            { name: "Master Admin", password: hashedPassword, role: "SUPER_ADMIN" },
            { upsert: true }
        );

        // 2. Create Center 1: Metro Core Diagnostics
        const center1 = await Center.findOneAndUpdate(
            { email: "metro@lab.com" },
            { name: "Metro Core Diagnostics", address: "Mumbai Central", phone: "9876543210", isActive: true },
            { upsert: true, new: true }
        );

        await User.findOneAndUpdate(
            { email: "admin1@lab.com" },
            { name: "Metro Admin", password: hashedPassword, role: "CENTER_ADMIN", centerId: center1._id },
            { upsert: true }
        );

        // Seed Machines for Center 1
        await Machine.deleteMany({ centerId: center1._id });
        const c1Key1 = `NODE_C1_HEM_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const c1Key2 = `NODE_C1_BIO_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const c1Key3 = `NODE_C1_IMM_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        await Machine.create([
            { name: "Erba Mannheim H 560", type: "HEMATOLOGY", protocol: "HL7 v2.5", port: "TCP: 192.168.1.11", centerId: center1._id, health: 98, secretKey: c1Key1 },
            { name: "Erba Mannheim EM 200", type: "BIOCHEMISTRY", protocol: "ASTM", port: "TCP: 192.168.1.12", centerId: center1._id, health: 100, secretKey: c1Key2 },
            { name: "Snibe Maglumi 800", type: "CLIA", protocol: "HL7", port: "TCP: 192.168.1.13", centerId: center1._id, health: 99, secretKey: c1Key3 }
        ]);

        // 3. Create Center 2: Apex Clinical Node
        const center2 = await Center.findOneAndUpdate(
            { email: "apex@lab.com" },
            { name: "Apex Clinical Node", address: "Delhi NCR", phone: "9123456789", isActive: true },
            { upsert: true, new: true }
        );

        await User.findOneAndUpdate(
            { email: "admin2@lab.com" },
            { name: "Apex Admin", password: hashedPassword, role: "CENTER_ADMIN", centerId: center2._id },
            { upsert: true }
        );

        // Seed Machines for Center 2
        await Machine.deleteMany({ centerId: center2._id });
        const c2Key1 = `NODE_C2_HEM_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const c2Key2 = `NODE_C2_CLIA_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        const c2Key3 = `NODE_C2_HBA1C_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        await Machine.create([
            { name: "Erba Mannheim H 560", type: "HEMATOLOGY", protocol: "HL7", port: "TCP: 192.168.2.11", centerId: center2._id, health: 95, secretKey: c2Key1 },
            { name: "Snibe Maglumi 800", type: "CLIA", protocol: "HL7", port: "TCP: 192.168.2.12", centerId: center2._id, health: 99, secretKey: c2Key2 },
            { name: "Arkray HA-8380V", type: "DIABETES", protocol: "ASTM", port: "COM 4", centerId: center2._id, health: 88, secretKey: c2Key3 }
        ]);

        return NextResponse.json({
            status: "Multi-Center Matrix Seeded",
            centers: ["Metro Core Diagnostics", "Apex Clinical Node"],
            credentials: {
                super: "superadmin@pathocore.com / demopass123",
                admin1: "admin1@lab.com / demopass123",
                admin2: "admin2@lab.com / demopass123"
            }
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
