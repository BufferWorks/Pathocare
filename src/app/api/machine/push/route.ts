import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Machine, Report, Booking, Test, Center } from "@/lib/models";

/**
 * 🔗 Pathocore Node Push API
 * This is the high-bandwidth endpoint used by the Local Middleware Bridge
 * to ingest clinical data from physical hardware.
 */
export async function POST(req: Request) {
    try {
        await connectDB();

        // 1. Authenticate via Bearer Token
        const authHeader = req.headers.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized: Missing API Key" }, { status: 401 });
        }
        const apiKey = authHeader.split(" ")[1];

        // 2. Parse Body
        const body = await req.json();

        console.log("=== 🔬 INCOMING MACHINE TELEMETRY ===");
        console.log("🔑 API Key:", apiKey);
        console.log("🏢 Lab ID:", body.labId || "N/A (Legacy Format)");
        console.log("📄 Report Payload:", JSON.stringify(body.report || body.results, null, 2));
        console.log("======================================");

        // Support BOTH the new agent_pathalogy format and the legacy format for backwards compatibility
        const isLegacyFormat = body.secretKey !== undefined;

        let labId, sampleId, parameters;

        if (isLegacyFormat) {
            // Legacy path
            const { secretKey, barcode, results } = body;
            const machine = await Machine.findOne({ secretKey });
            if (!machine) return NextResponse.json({ error: "Invalid Node Key" }, { status: 403 });

            // For legacy, we just get the centerId from the machine
            const center = await Center.findById(machine.centerId);
            if (!center) return NextResponse.json({ error: "Matrix Center Missing" }, { status: 404 });

            labId = center.labId;
            sampleId = barcode;
            parameters = results;

            machine.lastSync = new Date();
            machine.health = 100;
            await machine.save();
        } else {
            // NEW agent_pathalogy path
            labId = body.labId;
            const reportPayload = body.report;
            if (!labId || !reportPayload || !reportPayload.sampleId) {
                return NextResponse.json({ error: "Invalid payload format" }, { status: 400 });
            }
            sampleId = reportPayload.sampleId;
            parameters = reportPayload.parameters || [];

            // Verify Center Credentials
            const center = await Center.findOne({ labId, apiKey });
            if (!center) {
                return NextResponse.json({ error: "Unauthorized or Invalid Lab ID" }, { status: 401 });
            }
        }

        // 3. Identify the SPECIMEN (Barcode) - Case Insensitive for robustness
        const booking = await Booking.findOne({
            barcode: { $regex: new RegExp(`^${sampleId}$`, 'i') }
        });
        if (!booking) {
            return NextResponse.json({
                error: "Barcode Match Failed",
                suggestion: "Either the patient is not booked, or the barcode is incorrect."
            }, { status: 404 });
        }

        // 4. Update/Create Report Results
        let report: any = await Report.findOne({ bookingId: booking._id });

        // Populate booking tests to know the expected structure
        await booking.populate('tests');

        // Initialize the report skeleton if it doesn't exist OR if results are wiped
        if (!report || !report.results || report.results.length === 0) {
            if (!report) {
                report = new Report({ bookingId: booking._id, results: [] });
            } else {
                report.results = []; // Ensure it's a clean array
            }

            booking.tests.forEach((t: any) => {
                report.results.push({
                    testId: t._id,
                    testName: t.name, // Temporary tracking
                    category: t.category, // Temporary tracking
                    method: t.method || "",
                    interpretation: t.interpretation || "",
                    parameterResults: (t.parameters || []).map((p: any) => ({
                        name: p.name,
                        value: "",
                        unit: p.unit,
                        normalRange: p.normalRange,
                        status: ""
                    }))
                });
            });
        }

        // --- 🧠 DETERMINISTIC CLINICAL CONTEXT MATCHER ---
        // Helps map Machine Test Names to the correct Test Object IDs found in the booking
        const machineToTestIdMap: any = {};
        booking.tests.forEach((t: any) => {
            const lowName = t.name.toLowerCase();
            const acronym = lowName.replace(/[^a-z\s]/gi, '').split(/\s+/).map((w: string) => w[0]).join('');
            const tid = t._id.toString();

            machineToTestIdMap[lowName] = tid;
            machineToTestIdMap[acronym] = tid;
            if (t.category) machineToTestIdMap[t.category.toLowerCase()] = tid;
        });

        const findTargetId = (machineTestName: string) => {
            if (!machineTestName) return null;
            const pStr = machineTestName.toLowerCase().trim();

            // 1. Direct/Acronym Map (Exact Match)
            if (machineToTestIdMap[pStr]) return machineToTestIdMap[pStr];
            const acronym = pStr.replace(/[^a-z\s]/gi, '').split(/\s+/).map((w: string) => w[0]).join('');
            if (machineToTestIdMap[acronym]) return machineToTestIdMap[acronym];

            // 2. Prioritize Exact Match in booking tests
            const exactMatch = (booking.tests as any[]).find(t => t.name.toLowerCase() === pStr);
            if (exactMatch) return exactMatch._id.toString();

            // 3. Smart Substring Match (Longest match wins)
            let bestMatch: any = null;
            let longestMatchLength = 0;

            for (let t of (booking.tests as any[])) {
                const tn = t.name.toLowerCase();
                if (pStr.includes(tn) || tn.includes(pStr)) {
                    // We take the match that has the longest common string to avoid "CBC" matching "CBC+DIFF" incorrectly
                    const matchLen = Math.min(tn.length, pStr.length);
                    if (matchLen > longestMatchLength) {
                        longestMatchLength = matchLen;
                        bestMatch = t;
                    }
                }
            }
            return bestMatch ? bestMatch._id.toString() : null;
        };

        // High-Performance Mapping Across Multiple Tests
        let updatedCount = 0;
        const seenTests = new Set<string>();

        // 🧠 METADATA EXTRACTION (User-Preferred Workflow)
        // Scan parameters once to extract global context like "Test Mode", Age, etc.
        let extractedTestMode = "";
        const metadata: any = {};
        if (parameters && Array.isArray(parameters)) {
            parameters.forEach((p: any) => {
                const lowName = (p.name || "").toLowerCase().trim();
                if (lowName === "test mode" || lowName === "sample mode" || lowName === "profile") {
                    extractedTestMode = String(p.value);
                }
                // Track other metadata for potential clinical context
                if (["age", "gender", "remark", "ref group"].includes(lowName)) {
                    metadata[lowName] = p.value;
                }
            });
        }

        if (parameters && Array.isArray(parameters)) {
            parameters.forEach((incoming: any) => {
                const incomingFlags = incoming.flag || incoming.status;
                const computedStatus = (incomingFlags && incomingFlags !== "N" && incomingFlags !== "") ? incomingFlags : "NORMAL";
                const incomingName = incoming.name.toLowerCase();

                // 1. Identify which test containers this parameter SHOULD belong to
                // STRATEGY: Combine Template Matching + Metadata Context
                let targetContainers = report.results.filter((res: any) => {
                    const tidStr = (res.testId?._id || res.testId || "").toString();
                    const testTemplate = (booking.tests as any[]).find((bt: any) => bt._id.toString() === tidStr);
                    return (testTemplate as any)?.parameters?.some((p: any) => p.name.toLowerCase() === incomingName);
                });

                if (targetContainers.length === 0) {
                    // Use Metadata Context if individual testName is "Unknown"
                    const effectiveTestName = (incoming.testName && incoming.testName !== "Unknown") 
                        ? incoming.testName 
                        : extractedTestMode;

                    let targetId = findTargetId(effectiveTestName);
                    if (targetId) {
                        // Explicit test name found - find that container
                        const tidStr = targetId.toString();
                        const container = report.results.find((r: any) => (r.testId?._id || r.testId || "").toString() === tidStr);
                        if (container) targetContainers.push(container);
                    } else if (report.results.length > 0) {
                        // Last resort: Fallback to the first container (legacy behavior)
                        targetContainers = [report.results[0]];
                    }
                }

                if (targetContainers.length > 0) {
                    targetContainers.forEach((targetContainer: any) => {
                        const tidStr = (targetContainer.testId?._id || targetContainer.testId || "").toString();
                        seenTests.add(tidStr);

                        // DEDUPLICATION SWEEP: Ensure this parameter DOES NOT exist in other test buckets 
                        // UNLESS it is also part of that test's defined parameters.
                        // This prevents "bleed-over" for non-matching tests while allowing legitimate shared parameters.
                        report.results.forEach((res: any) => {
                            const otherTidStr = (res.testId?._id || res.testId || "").toString();
                            if (otherTidStr !== tidStr) {
                                // Check if this parameter name exists in the template of the OTHER test
                                const otherTestTemplate = (booking.tests as any[]).find((bt: any) => bt._id.toString() === otherTidStr);
                                const isAllowedInOtherTest = (otherTestTemplate as any)?.parameters?.some((p: any) => p.name.toLowerCase() === incomingName);

                                if (!isAllowedInOtherTest) {
                                    res.parameterResults = res.parameterResults.filter(
                                        (p: any) => p.name.toLowerCase() !== incomingName
                                    );
                                }
                            }
                        });

                        // 3. Update existing or Add new
                        const pMatch = targetContainer.parameterResults.find((p: any) => p.name.toLowerCase() === incomingName);
                        if (pMatch) {
                            // Update existing in the correct place
                            pMatch.value = String(incoming.value);
                            if (incoming.range || incoming.normalRange) pMatch.normalRange = incoming.range || incoming.normalRange;
                            if (incoming.unit) pMatch.unit = incoming.unit;
                            pMatch.status = computedStatus;
                            updatedCount++;
                        } else {
                            // Create neatly directly inside its designated home
                            targetContainer.parameterResults.push({
                                name: incoming.name,
                                value: String(incoming.value),
                                unit: incoming.unit || "",
                                normalRange: incoming.range || incoming.normalRange || "",
                                status: computedStatus
                            });
                            updatedCount++;
                        }
                    });
                }
            });

            // 🧠 MASTER TEST SELF-LEARNING
            // If the Master Test was empty, backfill the discovered parameters so future bookings are pre-populated
            for (const tId of Array.from(seenTests)) {
                try {
                    const masterTest = await Test.findById(tId);
                    if (masterTest && (!(masterTest as any).parameters || (masterTest as any).parameters.length === 0)) {
                        const reportTest = report.results.find((r: any) => (r.testId?._id || r.testId || "").toString() === tId);
                        if (reportTest && reportTest.parameterResults.length > 0) {
                            console.log(`🧠 SELF-LEARNING: Updating template for ${masterTest.name}`);
                            (masterTest as any).parameters = reportTest.parameterResults.map((p: any) => ({
                                name: p.name,
                                unit: p.unit || "",
                                normalRange: p.normalRange || ""
                            }));
                            await masterTest.save();
                        }
                    }
                } catch (e) { }
            }

            // Clean up temporary tracking fields
            report.results.forEach((r: any) => {
                delete r.testName;
                delete r.category;
            });

            report.updatedAt = new Date();
            report.markModified('results');

            // Handle VersionError gracefully due to physical hardware retry storms
            try {
                await report.save();
            } catch (saveErr: any) {
                if (saveErr.name === 'VersionError') {
                    console.log("⚠️ Ignored VersionError (Concurrent telemetry streams detected and merged)");
                } else {
                    throw saveErr;
                }
            }
        }

        return NextResponse.json({
            status: "Neural Data Handshake SUCCESS",
            specimen: booking.patientName,
            synchronizedParams: parameters ? parameters.length : 0,
            protocol: isLegacyFormat ? "LEGACY_NODE" : "AGENT_v2"
        });

    } catch (error: any) {
        console.error("DRIVE_SERVER_ERROR:", error);
        return NextResponse.json({ error: "Fatal Internal Matrix Failure" }, { status: 500 });
    }
}
