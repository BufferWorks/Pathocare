import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Center, Test, User, Booking, Report } from "@/lib/models";
import bcrypt from "bcryptjs";

export async function POST() {
    try {
        await connectDB();

        // 1. Create a demo center
        const center = await Center.create({
            name: "Global Diagnostics Hub",
            address: "123 Medical Square, Silicon Valley",
            phone: "+1 555-0199",
            email: "demo@globalhub.com"
        });

        // 2. Create demo tests with parameters
        const tests = await Test.insertMany([
            {
                name: "CBC",
                category: "Hematology",
                price: 450,
                code: "T-CBC",
                isGlobal: true,
                parameters: [
                    { name: "Haemoglobin", unit: "g/dL", normalRange: "13.0 - 17.0" },
                    { name: "Total WBC Count", unit: "cells/cu.mm", normalRange: "4000 - 11000" },
                    { name: "RBC Count", unit: "mill/cu.mm", normalRange: "4.50 - 5.50" },
                    { name: "Platelet Count", unit: "lakhs/cu.mm", normalRange: "1.50 - 4.50" },
                    { name: "PCV", unit: "%", normalRange: "40 - 50" },
                    { name: "MCV", unit: "fL", normalRange: "80 - 100" }
                ]
            },
            {
                name: "WIDAL TEST",
                category: "Serology",
                price: 350,
                code: "T-WIDAL",
                isGlobal: true,
                parameters: [
                    { name: "S. Typhi 'O'", unit: "Titre", normalRange: "< 1:80" },
                    { name: "S. Typhi 'H'", unit: "Titre", normalRange: "< 1:80" },
                    { name: "S. Typhi 'AH'", unit: "Titre", normalRange: "< 1:80" },
                    { name: "S. Typhi 'BH'", unit: "Titre", normalRange: "< 1:80" }
                ]
            },
            {
                name: "Lipid Profile",
                category: "Biochemistry",
                price: 850,
                code: "T-LIPID",
                isGlobal: true,
                parameters: [
                    { name: "Total Cholesterol", unit: "mg/dL", normalRange: "< 200" },
                    { name: "Triglycerides", unit: "mg/dL", normalRange: "< 150" },
                    { name: "HDL Cholesterol", unit: "mg/dL", normalRange: "> 40" },
                    { name: "LDL Cholesterol", unit: "mg/dL", normalRange: "< 130" }
                ]
            }
        ]);

        // 3. Create demo staff
        const hashedPassword = await bcrypt.hash("demopass123", 10);
        await User.create([
            { name: "Dr. Sarah Mitchell", email: "sarah@globalhub.com", password: hashedPassword, role: "CENTER_ADMIN", centerId: center._id },
            { name: "James Logan", email: "james@globalhub.com", password: hashedPassword, role: "STAFF", centerId: center._id }
        ]);

        // 4. Create some demo bookings and revenue
        await Booking.create([
            {
                patientName: "Alice Wonderland",
                age: 30,
                gender: "Female",
                phone: "9876543210",
                centerId: center._id,
                totalAmount: 450,
                netAmount: 450,
                tests: [tests[0]._id],
                status: "Completed",
                deliveryMode: "Self"
            },
            {
                patientName: "Bob Builder",
                age: 45,
                gender: "Male",
                phone: "9123456780",
                centerId: center._id,
                totalAmount: 1200,
                netAmount: 1200,
                tests: [tests[2]._id],
                status: "Process",
                deliveryMode: "Email"
            }
        ]);

        return NextResponse.json({ message: "Enterprise Data Seeded Successfully" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
