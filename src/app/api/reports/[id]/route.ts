import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Report, Booking, Test, Package } from "@/lib/models";
import { createAuditLog } from "@/lib/audit";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectDB();

        // Find report for this booking ID
        let report: any = await Report.findOne({ bookingId: id })
            .populate({
                path: "bookingId",
                populate: [
                    { path: "tests", model: "Test" },
                    { path: "packages", model: "Package" },
                    { path: "doctorId", model: "Doctor" }
                ],
                strictPopulate: false
            })
            .populate({ path: "results.testId", model: "Test" })
            .lean();

        if (report) {
            // NEW: Ensure report has a shareToken for QR code functionality
            if (!report.shareToken) {
                const crypto = require('crypto');
                const newToken = crypto.randomBytes(16).toString('hex');
                await Report.updateOne({ _id: report._id }, { 
                    $set: { 
                        shareToken: newToken,
                        shareExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                    } 
                });
                report.shareToken = newToken;
                console.log(`SECURE: Generated new shareToken for report ${report._id}`);
            }

            // FIX: Self-healing for empty parameterResults
            let modified = false;
            for (let testRes of report.results) {
                if (!testRes.parameterResults || testRes.parameterResults.length === 0) {
                    // Try to get test definition from populated field first
                    let testDef = testRes.testId;
                    
                    // If not populated correctly or missing parameters, try a direct lookup
                    if (!testDef || !testDef.parameters || testDef.parameters.length === 0) {
                        const targetTestId = testRes.testId?._id || testRes.testId;
                        if (targetTestId) {
                            testDef = await Test.findById(targetTestId);
                        }
                    }

                    if (testDef && testDef.parameters && testDef.parameters.length > 0) {
                        console.log(`HEALING: Found missing parameters for test ${testDef.name} (${testDef._id})`);
                        testRes.parameterResults = testDef.parameters.map((p: any) => ({
                            name: p.name,
                            unit: p.unit,
                            normalRange: p.normalRange,
                            value: ""
                        }));
                        modified = true;
                    } else {
                        // FUZZY HEALING: If ID failed, try to find ANY test with this name that has parameters
                        const testName = testRes.testId?.name || (await Test.findById(testRes.testId))?.name;
                        if (testName) {
                            const betterTest = await Test.findOne({ 
                                name: testName, 
                                parameters: { $exists: true, $not: { $size: 0 } } 
                            }).sort({ isGlobal: -1 });

                            if (betterTest) {
                                console.log(`FUZZY HEALING: Matched ${testName} to a similar template with parameters.`);
                                testRes.parameterResults = betterTest.parameters.map((p: any) => ({
                                    name: p.name,
                                    unit: p.unit,
                                    normalRange: p.normalRange,
                                    value: ""
                                }));
                                modified = true;
                            }
                        }
                        
                        if (!modified) {
                            console.warn(`HEALING FAIL: No parameters found for test reference ${testRes.testId?._id || testRes.testId}`);
                        }
                    }
                }
            }
            if (modified) {
                // Update the report in the background to persist the fix
                await Report.updateOne({ _id: report._id }, { $set: { results: report.results } });
                console.log("REPORTS: Self-healing applied and persisted.");
            }
            return NextResponse.json(report);
        }

        // If report doesn't exist, create it from booking
        const booking = await Booking.findById(id).populate("tests").populate("packages");
        if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

        // Aggregate all test IDs (including those from packages)
        let allTestIds = booking.tests.map((t: any) => t._id.toString());

        if (booking.packages && booking.packages.length > 0) {
            const fullPackages = await Package.find({ _id: { $in: booking.packages } });
            fullPackages.forEach((pkg: any) => {
                pkg.tests.forEach((tId: any) => {
                    if (!allTestIds.includes(tId.toString())) {
                        allTestIds.push(tId.toString());
                    }
                });
            });
        }

        const testsWithParams = await Test.find({ _id: { $in: allTestIds } });

        const newReport = await Report.create({
            bookingId: id,
            status: "Pending",
            results: testsWithParams.map((test: any) => ({
                testId: test._id,
                method: test.method,
                interpretation: test.interpretation,
                parameterResults: (test.parameters || []).map((p: any) => ({
                    name: p.name,
                    unit: p.unit,
                    normalRange: p.normalRange,
                    value: ""
                }))
            }))
        });

        // Re-fetch with population
        const populatedReport = await Report.findById(newReport._id)
            .populate({ path: "results.testId", model: "Test" })
            .populate({
                path: "bookingId",
                populate: [
                    { path: "tests", model: "Test" },
                    { path: "packages", model: "Package" },
                    { path: "doctorId", model: "Doctor" }
                ],
                strictPopulate: false
            })
            .lean();

        return NextResponse.json(populatedReport);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        await connectDB();
        const { results, barcode, sampleType, clientCode, sampleDrawnAt, collectedAt } = await req.json();

        // 0. Update booking clinical details if provided
        const bookingUpdate: any = {};
        if (barcode) bookingUpdate.barcode = barcode;
        if (sampleType) bookingUpdate.sampleType = sampleType;
        if (clientCode) bookingUpdate.clientCode = clientCode;
        if (sampleDrawnAt && !isNaN(new Date(sampleDrawnAt).getTime())) bookingUpdate.sampleDrawnAt = new Date(sampleDrawnAt);
        if (collectedAt && !isNaN(new Date(collectedAt).getTime())) bookingUpdate.collectedAt = new Date(collectedAt);
        bookingUpdate.status = "Completed";
        bookingUpdate.reportedAt = new Date();

        await Booking.findByIdAndUpdate(id, bookingUpdate);

        // 1. Get old report for delta check
        const oldReport = await Report.findOne({ bookingId: id });
        const isCorrection = oldReport && oldReport.results && oldReport.results.some((tr: any) =>
            tr.parameterResults && tr.parameterResults.some((pr: any) => pr.value !== "")
        );

        const report: any = await Report.findOneAndUpdate(
            { bookingId: id },
            { 
                results, 
                status: "Finalized",
                updatedAt: new Date() 
            },
            { new: true }
        );

        if (!report) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        // 2. Update booking status to 'Completed'
        await Booking.findByIdAndUpdate(id, { status: "Completed" });

        // 3. Create Audit Log
        const session: any = await getServerSession(authOptions);
        if (session?.user) {
            await createAuditLog({
                centerId: session.user.centerId,
                userId: session.user.id,
                action: isCorrection ? "RESULT_CORRECTION" : "RESULT_ENTRY",
                targetId: report._id.toString(),
                targetModel: "Report",
                details: { bookingId: id }
            });
        }

        return NextResponse.json(report);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
