"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
    Activity,
    Download,
    Printer,
    ShieldCheck,
    Clock,
    AlertCircle,
    Loader2,
    MapPin,
    Phone,
    Lock,
    ChevronRight,
    QrCode
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function PublicReportPage() {
    const { token } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expired, setExpired] = useState(false);

    const [isVerified, setIsVerified] = useState(false);
    const [mobileInput, setMobileInput] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [vError, setVError] = useState("");

    const [downloading, setDownloading] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchReport() {
            try {
                const res = await fetch(`/api/public/report/${token}`);
                const bData = await res.json();
                if (!res.ok) {
                    setError(bData.error || "Broadcast Interrupted");
                    if (res.status === 410) setExpired(true);
                } else {
                    setData(bData);
                }
            } catch (err) {
                setError("Terminal Link Severed: Failed to sync with central repository.");
            } finally {
                setLoading(false);
            }
        }
        fetchReport();
    }, [token]);

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        setVerifying(true);
        setVError("");
        const patientPhone = data?.report?.bookingId?.phone || "";
        const cleanInput = (mobileInput || "").replace(/\D/g, '').slice(-10);
        const cleanTarget = (patientPhone || "").replace(/\D/g, '').slice(-10);
        if (cleanInput === cleanTarget) {
            setTimeout(() => {
                setIsVerified(true);
                setVerifying(false);
            }, 800);
        } else {
            setTimeout(() => {
                setVError("Neural Hash Mismatch: Access Code Invalid.");
                setVerifying(false);
            }, 500);
        }
    };

    /**
     * INSTITUTIONAL MODULAR SYNTHESIS ENGINE
     * Each test node gets its own dedicated clinical sheet.
     * Prevents truncation and ensures 1:1 parity with departmental requirements.
     */
    const handleDownloadPDF = async () => {
        const element = reportRef.current;
        if (!element || !data?.report) return;

        setDownloading(true);

        const originalInlineStyles: Map<HTMLElement, string> = new Map();
        const stylesheets = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
        const originalSheetStates: boolean[] = stylesheets.map(s => (s as any).disabled);

        try {
            // STEP 1: DEEP-INLINE (Snapshot Layout)
            const allElements = [element, ...Array.from(element.querySelectorAll('*'))] as HTMLElement[];

            allElements.forEach(el => {
                const computed = window.getComputedStyle(el);
                originalInlineStyles.set(el, el.getAttribute('style') || "");

                const props = [
                    'display', 'position', 'top', 'left', 'right', 'bottom',
                    'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
                    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
                    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
                    'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
                    'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
                    'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
                    'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
                    'background-color', 'color', 'font-size', 'font-weight', 'font-family',
                    'text-align', 'text-transform', 'letter-spacing', 'line-height',
                    'flex', 'flex-direction', 'align-items', 'justify-content', 'flex-wrap', 'flex-grow', 'flex-shrink',
                    'grid-template-columns', 'grid-column', 'grid-row', 'gap', 'column-gap', 'row-gap',
                    'opacity', 'visibility', 'box-shadow', 'z-index', 'vertical-align', 'text-decoration', 'box-sizing'
                ];

                props.forEach(prop => {
                    let val = computed.getPropertyValue(prop);
                    if (val.includes('oklch') || val.includes('lab') || val.includes('oklab') || val.includes('lch')) {
                        if (prop.includes('background')) {
                            // Detect Lightness for Clinical White/Gray fallbacks
                            if (val.includes('0.9') || val.includes('95%') || val.includes('90%') || val.includes('1.0') || val.includes('0.8')) val = '#f8fafc';
                            else if (val.includes('16, 185, 129')) val = '#10b981';
                            else val = '#020617'; // Hard Fallback to Dark Slate for clinical headers
                        } else {
                            // Text logic
                            if (val.includes('0.9') || val.includes('90%')) val = '#ffffff';
                            else if (val.includes('0.1') || val.includes('10%') || val.includes('0.2')) val = '#020617';
                            else val = '#000000';
                        }
                    }
                    el.style.setProperty(prop, val);
                });

                if (el.classList.contains('report-page')) {
                    el.style.setProperty('width', '800px', 'important');
                    el.style.setProperty('margin', '0 auto', 'important');
                    el.style.setProperty('box-shadow', 'none', 'important');
                    el.style.setProperty('border', 'none', 'important');
                    el.style.setProperty('padding', '40px', 'important');
                    el.style.setProperty('box-sizing', 'border-box', 'important');
                    el.style.setProperty('background-color', '#ffffff', 'important');
                }
            });

            // STEP 2: NUCLEAR DISABLE
            stylesheets.forEach(s => (s as any).disabled = true);

            // STEP 3: MODULAR CAPTURE (One Test Per Page)
            const pdf = new jsPDF("p", "mm", "a4");
            const testCount = data.report.results.length;

            for (let i = 0; i < testCount; i++) {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#ffffff",
                    logging: false,
                    windowWidth: 850,
                    onclone: (clonedDoc) => {
                        const clonedPage = clonedDoc.querySelector('.report-page') as HTMLElement;
                        if (!clonedPage) return;

                        // Isolate the target test item
                        const testItems = clonedPage.querySelectorAll('.report-test-item');
                        testItems.forEach((item: any, idx) => {
                            if (idx !== i) {
                                item.style.display = 'none';
                            }
                        });
                    }
                });

                const imgData = canvas.toDataURL("image/jpeg", 0.95);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeightRatio = (canvas.height * pdfWidth) / canvas.width;

                // Add to PDF
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeightRatio, undefined, 'FAST');

                if (i < testCount - 1) {
                    pdf.addPage();
                }
            }

            // STEP 4: RESTORATION
            stylesheets.forEach((s, i) => (s as any).disabled = originalSheetStates[i]);
            allElements.forEach(el => {
                const original = originalInlineStyles.get(el);
                if (original) el.setAttribute('style', original);
                else el.removeAttribute('style');
            });

            const ptName = (data.report.bookingId.patientName || "REPORT").replace(/\s+/g, '_').toUpperCase();
            pdf.save(`REPORT_${ptName}.pdf`);

        } catch (err) {
            console.error("Critical HUB Error:", err);
            stylesheets.forEach((s, i) => (s as any).disabled = originalSheetStates[i]);
            alert("Digital Synthesis Hub Interrupted. Parity Mismatch. Use 'PRINT' -> 'Save as PDF'.");
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-slate-950 flex flex-col items-center justify-center p-10 gap-8">
                <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
                <p className="text-emerald-500/40 font-black uppercase text-[10px] tracking-[0.4em]">Decryption Matrix Initializing...</p>
            </div>
        );
    }

    if (error || expired) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 gap-8 text-center">
                <div className="w-24 h-24 rounded-[2.5rem] bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                    <AlertCircle size={48} />
                </div>
                <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">
                    {expired ? "Signal Expired" : "Access Denied"}
                </h2>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest max-w-md mx-auto">
                    {expired ? "Ephemeral clinical window closed for privacy." : `Fault: ${error}`}
                </p>
            </div>
        );
    }

    if (!isVerified) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white/5 p-10 md:p-14 rounded-[4rem] border border-white/10 backdrop-blur-3xl shadow-4xl space-y-10">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-[2rem] bg-emerald-500 flex items-center justify-center text-white shadow-2xl">
                            <Lock size={32} />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter text-center">Security Matrix</h2>
                    </div>
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-6 italic">Patient Mobile Number</label>
                            <input type="tel" required value={mobileInput} onChange={(e) => setMobileInput(e.target.value)} className="w-full h-20 bg-white/5 border border-white/10 rounded-[2rem] px-8 text-xl font-black text-white outline-none focus:border-emerald-500/50 text-center" placeholder="00000 00000" />
                        </div>
                        {vError && <p className="text-red-500 text-center font-black uppercase text-[10px] tracking-widest italic">{vError}</p>}
                        <Button type="submit" disabled={verifying} className="w-full h-20 rounded-[2rem] bg-emerald-500 text-white font-black uppercase text-lg tracking-widest shadow-3xl">
                            {verifying ? <Loader2 className="animate-spin" /> : "Unlock Portal"}
                        </Button>
                    </form>
                </motion.div>
            </div>
        );
    }

    const report = data.report;
    const booking = report.bookingId;
    const center = data.center;

    return (
        <div className="min-h-screen bg-slate-100 py-10 px-4 md:py-20 flex flex-col items-center">
            <div className="w-full max-w-[850px] flex justify-between items-center p-6 bg-white rounded-2xl shadow-xl border border-slate-200 mb-8 sticky top-4 z-50 print:hidden">
                <h1 className="text-lg font-black text-slate-900 uppercase tracking-tighter italic">Diagnostic Viewing Node</h1>
                <div className="flex gap-3">
                    <Button onClick={() => window.print()} variant="outline" className="rounded-xl h-14 px-6 border-slate-200 font-black uppercase text-[10px] tracking-widest">
                        <Printer className="mr-2 w-4 h-4" /> Print
                    </Button>
                    <Button onClick={handleDownloadPDF} disabled={downloading} className="rounded-xl h-14 px-8 bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest shadow-2xl">
                        {downloading ? <Loader2 className="animate-spin" /> : <Download className="mr-2 w-5 h-5" />}
                        {downloading ? "Formatting..." : "Download Official PDF"}
                    </Button>
                </div>
            </div>

            <div className="report-page bg-white p-6 md:p-14 shadow-4xl rounded-sm border border-slate-100" ref={reportRef}>
                <div className="flex justify-between items-start border-b-[3pt] border-emerald-500 pb-10 mb-10">
                    <div className="flex gap-8 items-start">
                        {center?.logo ? <img src={center.logo} alt="Logo" className="w-24 h-24 object-contain" /> : <div className="w-20 h-20 rounded-[2rem] bg-emerald-500 flex items-center justify-center text-white shadow-xl"><Activity size={44} /></div>}
                        <div className="space-y-1">
                            <h1 className="text-3xl font-[900] tracking-tighter text-slate-950 uppercase leading-none italic">{center?.name}</h1>
                            <p className="text-emerald-500 font-bold uppercase text-[10px] tracking-[0.4em] italic leading-none pb-2">{center?.tagline || "Global Diagnostics Network"}</p>
                            <div className="space-y-1 text-[9px] text-slate-500 font-black uppercase italic pt-1 border-t border-slate-100">
                                <p className="flex items-center gap-2 max-w-[400px]"><MapPin size={10} className="text-emerald-500 min-w-[10px]" /> {center?.address}</p>
                                <p className="flex items-center gap-2"><Phone size={10} className="text-emerald-500" /> {center?.phone} {center?.website && ` | ${center.website}`}</p>
                            </div>
                        </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                        <div className="bg-slate-950 text-white px-4 py-2 rounded-lg inline-block">
                             <span className="text-[10px] font-black tracking-widest uppercase italic">Diagnostic Node</span>
                        </div>
                        <div className="flex gap-1 h-8 opacity-20 mt-2">
                            {[...Array(15)].map((_, i) => (
                                <div key={i} className="w-[2px] bg-black h-full" style={{ width: i % 3 === 0 ? '3px' : '1.5px' }} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="border-[1.5pt] border-slate-200 rounded-[2.5rem] overflow-hidden mb-12 bg-slate-50 p-10 grid grid-cols-2 gap-12 relative">
                    <div className="space-y-6 border-r border-slate-200 pr-12">
                        <div className="grid grid-cols-[110px_1fr] gap-4 items-start">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic pt-1">Patient Name</span>
                            <p className="text-[20px] font-[900] uppercase italic tracking-tighter text-slate-950 leading-none">{booking.patientName}</p>
                        </div>
                        <div className="grid grid-cols-[110px_1fr] gap-4 items-start pt-2 border-t border-slate-200/50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Age / Gender</span>
                            <p className="text-[15px] font-black uppercase italic text-slate-900 leading-none">{booking.age}Y / {booking.gender}</p>
                        </div>
                        <div className="grid grid-cols-[110px_1fr] gap-4 items-start pt-2 border-t border-slate-200/50">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Referred By</span>
                            <p className="text-[15px] font-black uppercase italic text-emerald-600 leading-none">{booking.doctorId?.name || booking.referralName || "SELF"}</p>
                        </div>
                        <div className="flex gap-10 pt-6">
                            <div className="space-y-1">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Specimen Type</span>
                                <p className="text-[11px] font-[800] uppercase italic text-slate-900 leading-none">{booking.sampleType || "WHOLE BLOOD / SERUM"}</p>
                            </div>
                            <div className="space-y-1 border-l border-slate-200 pl-10">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Client Unit</span>
                                <p className="text-[11px] font-[800] uppercase italic text-slate-900 leading-none">{booking.clientCode || "DIRECT-WALKIN"}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5 pl-4 flex flex-col justify-between">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between bg-white px-6 py-4 rounded-2xl border border-slate-200 shadow-sm">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">SAMPLE TRACK ID</span>
                                <div className="flex items-center gap-4">
                                    <p className="text-[16px] font-[950] text-slate-950 tracking-tight leading-none">{booking.barcode || "PC-NODEX-X"}</p>
                                    <QrCode size={18} className="text-slate-300" />
                                </div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 pt-4">
                            <div className="space-y-3">
                                <div className="space-y-0.5">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Sample Drawn</span>
                                    <p className="text-[10px] font-black text-slate-900 leading-none">{booking.sampleDrawnAt ? new Date(booking.sampleDrawnAt).toLocaleString() : "N/A"}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Registered</span>
                                    <p className="text-[10px] font-black text-slate-900 leading-none">{new Date(booking.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="space-y-3 border-l border-slate-200 pl-6">
                                <div className="space-y-0.5">
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Collected At</span>
                                    <p className="text-[10px] font-black text-slate-900 leading-none">{booking.collectedAt ? new Date(booking.collectedAt).toLocaleString() : "N/A"}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest italic">Final Report</span>
                                    <p className="text-[10px] font-black text-emerald-600 leading-none italic">{report.updatedAt ? new Date(report.updatedAt).toLocaleString() : "PENDING"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-16 mb-20">
                    {report.results.map((testRes: any, idx: number) => (
                        <div key={idx} className="report-test-item space-y-8">
                            <div className="bg-slate-950 text-white px-8 py-4 rounded-xl shadow-2xl flex justify-between items-center">
                                <h2 className="text-[14px] font-black uppercase tracking-[0.3em] italic">{testRes.testId?.name}</h2>
                                <span className="text-[10px] opacity-20 italic">NODE #0{idx + 1}</span>
                            </div>
                            <table className="w-full text-left">
                                <thead className="border-b-2 border-slate-950">
                                    <tr>
                                        <th className="pb-4 text-[11px] font-black uppercase text-slate-500 tracking-widest italic">Molecule</th>
                                        <th className="pb-4 text-center text-[11px] font-black uppercase text-slate-500 tracking-widest italic">Result Node</th>
                                        <th className="pb-4 text-center text-[11px] font-black uppercase text-slate-500 tracking-widest italic">Units</th>
                                        <th className="pb-4 text-center text-[11px] font-black uppercase text-slate-500 tracking-widest italic">Bio. Ref. Interval</th>
                                        <th className="pb-4 text-right text-[11px] font-black uppercase text-slate-500 tracking-widest italic">Method</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {testRes.parameterResults.map((param: any, pIdx: number) => (
                                        <tr key={pIdx}>
                                            <td className="py-6 text-[13px] font-black text-slate-950 uppercase italic tracking-tighter">{param.name}</td>
                                            <td className="py-6 text-center">
                                                <span className={`text-[18px] font-[900] italic ${param.status === "High" || param.status === "Low" ? "text-red-600" : "text-slate-900"}`}>
                                                    {param.value}
                                                </span>
                                            </td>
                                            <td className="py-6 text-center text-[11px] font-bold text-slate-400 italic uppercase">{param.unit}</td>
                                            <td className="py-6 text-center text-[11px] font-bold text-slate-600 tracking-tighter italic whitespace-pre-wrap max-w-[150px]">{param.normalRange}</td>
                                            <td className="py-6 text-right text-[10px] font-bold text-slate-400 uppercase italic leading-tight">{testRes.method || testRes.testId?.method || "AUTOMATED SCAN"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {(testRes.interpretation || testRes.testId?.interpretation) && (
                                <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Clinical Interpretation</h4>
                                    <p className="text-[11px] text-slate-600 italic leading-relaxed whitespace-pre-wrap font-medium">
                                        {testRes.interpretation || testRes.testId?.interpretation}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="flex flex-col items-center py-20 gap-4 opacity-50">
                    <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-400 italic">*** End Of Report ***</p>
                </div>

                <div className="pt-12 border-t border-slate-100 flex justify-between items-end gap-16">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center grayscale opacity-40"><ShieldCheck size={40} className="text-emerald-500" /></div>
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] text-center italic leading-tight">Digital Verification Node<br/>Security Matrix IDT-X</span>
                    </div>
                    <div className="text-center space-y-4">
                        {center?.signatories?.[0] ? (
                            <div className="text-center">
                                <div className="h-10 border-b border-slate-100 min-w-[180px]"></div>
                                <p className="text-[11px] font-black uppercase text-slate-950 italic pt-2">{center.signatories[0].name}</p>
                                <p className="text-[9px] font-bold uppercase text-slate-400 italic">{center.signatories[0].designation}</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="h-10 border-b border-slate-100 min-w-[180px]"></div>
                                <p className="text-[11px] font-black uppercase text-slate-950 italic pt-2">Pathologist Signatory</p>
                                <p className="text-[9px] font-bold uppercase text-slate-400 italic">Consultant MD (Pathology)</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-16 flex justify-between items-center opacity-20 text-slate-500">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] italic">SECURE CLINICAL TRANSMISSION</span>
                    <span className="text-[9px] font-black uppercase tracking-tight italic">TERMINATED ON EXPIRY</span>
                </div>
            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                body { font-family: 'Inter', sans-serif; background-color: #020617 !important; }
                .report-page { width: 100%; max-width: 850px; box-shadow: 0 40px 150px -20px rgba(0,0,0,0.8); }
                @media print {
                    body { background: white !important; }
                    .report-page { box-shadow: none !important; margin: 0 !important; width: 100% !important; border: none !important; }
                    .sticky { display: none !important; }
                }
            `}</style>
        </div>
    );
}
