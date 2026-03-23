import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Test, Package } from "@/lib/models";

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const barcode = searchParams.get("barcode");

        if (!barcode) return NextResponse.json({ error: "No barcode provided" }, { status: 400 });

        // SIMULATED LIS LOGIC: 
        // In a real LIS, you would query an HL7 server or external DB.
        // For demonstration, we'll map specific patterns to 'Investigative Clusters'.

        // Pattern 1: 'BIO-...' (Biochemistry Profile)
        if (barcode.startsWith("BIO")) {
            const basicTests = await Test.find({ name: { $regex: /Glucose|Urea|Creatinine/i } }).limit(3);
            return NextResponse.json({
                patient: { name: "Sample Biochemistry Patient", age: 45, gender: "Male", phone: "9876543210" },
                investigations: {
                    tests: basicTests.map(t => t._id),
                    packages: []
                }
            });
        }

        // Pattern 2: 'HEM-...' (Hematology/CBC)
        if (barcode.startsWith("HEM")) {
            const hemTests = await Test.find({ name: { $regex: /CBC|Haemoglobin/i } }).limit(2);
            return NextResponse.json({
                patient: { name: "Hematology Test Patient", age: 28, gender: "Female", phone: "9988776655" },
                investigations: {
                    tests: hemTests.map(t => t._id),
                    packages: []
                }
            });
        }

        // Default or Unknown: Just return the code
        return NextResponse.json({
            patient: { barcode },
            investigations: { tests: [], packages: [] },
            isUnknown: true
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
