"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
    Activity,
    Download,
    Printer,
    ShieldCheck,
    AlertCircle,
    Loader2,
    Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

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

    useEffect(() => {
        async function fetchReport() {
            try {
                const res = await fetch(`/api/public/report/${token}`);
                const bData = await res.json();
                if (!res.ok) {
                    setError(bData.error || "Access Interrupted");
                    if (res.status === 410) setExpired(true);
                } else {
                    setData(bData);
                }
            } catch (err) {
                setError("Failed to connect to central server.");
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
                setVError("Verification Failed: Mobile number does not match record.");
                setVerifying(false);
            }, 500);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-slate-50 flex flex-col items-center justify-center p-10 gap-8">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">Initializing Diagnostic Link...</p>
            </div>
        );
    }

    if (error || expired) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 gap-8 text-center">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                    <AlertCircle size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">
                    {expired ? "Access Expired" : "Access Denied"}
                </h2>
                <p className="text-slate-500 font-medium text-sm max-w-md mx-auto">
                    {expired ? "This electronic clinical window has closed for security." : `Issue: ${error}`}
                </p>
                <Button onClick={() => window.location.reload()} className="h-14 px-8 rounded-xl bg-slate-900 text-white font-bold uppercase text-[10px] tracking-widest">Retry Link</Button>
            </div>
        );
    }

    if (!isVerified) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-8">
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white shadow-lg">
                            <Lock size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-2">Secure Validation</h2>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-tight italic">Authentication Required to View Medical Report</p>
                        </div>
                    </div>
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Confirm Patient Mobile Number</label>
                            <input type="tel" required value={mobileInput} onChange={(e) => setMobileInput(e.target.value)} className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-lg font-black text-slate-900 outline-none focus:border-blue-600/50 text-center transition-all" placeholder="Enter Registered Mobile" />
                        </div>
                        {vError && <p className="text-red-500 text-center font-bold uppercase text-[9px] tracking-tight italic bg-red-50 py-2 rounded-lg">{vError}</p>}
                        <Button type="submit" disabled={verifying} className="w-full h-16 rounded-2xl bg-blue-600 text-white font-black uppercase text-sm tracking-widest shadow-xl hover:bg-blue-700 active:scale-95 transition-all">
                            {verifying ? <Loader2 className="animate-spin" /> : "Verify & View Report"}
                        </Button>
                    </form>
                    <p className="text-center text-[8px] text-slate-300 font-bold uppercase tracking-widest italic pt-4">Diagnostic Verification Matrix • Secure Channel</p>
                </motion.div>
            </div>
        );
    }

    const report = data.report;
    const patient = report.bookingId;
    const center = data.center;

    return (
        <div className="min-h-screen bg-slate-100 py-6 md:py-12 px-4 flex flex-col items-center">
            {/* Control Bar */}
            <div className="w-full max-w-[850px] flex justify-between items-center p-4 md:p-6 bg-white rounded-2xl shadow-xl border border-slate-200 mb-6 md:mb-10 sticky top-4 z-50 print:hidden overflow-hidden">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 grayscale">
                        <ShieldCheck size={20} />
                    </div>
                    <div>
                        <h1 className="text-xs md:text-sm font-black text-slate-900 uppercase tracking-tighter italic leading-none">Diagnostic Validation Tool</h1>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic">Authenticity Verified</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => window.print()} variant="outline" className="rounded-xl h-10 md:h-12 px-4 md:px-6 border-slate-200 font-black uppercase text-[9px] tracking-widest hover:bg-slate-50">
                        <Printer className="mr-2 w-3 h-3" /> Print
                    </Button>
                </div>
            </div>

            {/* The Report (Mimicking Printed Version) */}
            <div className="w-full max-w-[850px] bg-white shadow-2xl rounded-sm border border-slate-100 overflow-hidden print:shadow-none print:border-none p-4 md:p-12 lg:p-16">

                {/* 1. Header Area */}
                <div className="flex justify-between items-start border-b-[2.5pt] border-slate-900/10 pb-6 mb-8">
                    <div className="flex gap-4 md:gap-8 items-start">
                        {center?.logo ? (
                            <img src={center.logo} alt="Logo" className="w-16 h-16 md:w-24 md:h-24 object-contain grayscale brightness-50" />
                        ) : (
                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-900 flex items-center justify-center text-white"><Activity size={32} /></div>
                        )}
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl md:text-2xl font-[1000] tracking-tighter text-slate-900 uppercase leading-none italic">{center?.name}</h1>
                                {/* VALIDATION QR */}
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : "")}`}
                                    alt="QR"
                                    className="w-8 h-8 md:w-10 md:h-10 grayscale contrast-125 opacity-70"
                                />
                            </div>
                            <p className="text-blue-600 font-bold uppercase text-[8px] md:text-[9px] tracking-[0.3em] italic leading-none pb-2">{center?.tagline || "Advanced Laboratory Medicine"}</p>
                            <div className="space-y-0.5 text-[8px] md:text-[9px] text-slate-500 font-black uppercase italic pt-1 border-t border-slate-100">
                                <p className="flex items-center gap-2"><span className="text-blue-600 font-black">Address:</span> {center?.address}</p>
                                <p className="flex items-center gap-2"><span className="text-blue-600 font-black">Contact:</span> {center?.phone}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Patient Identity Grid - TWO ROWS */}
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-8 bg-slate-50/10">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y divide-slate-200">
                        {/* Row 1 */}
                        <div className="p-3 flex flex-col">
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Patient Name</span>
                            <span className="text-[12px] font-[1000] text-slate-900 uppercase italic tracking-tight">{patient.patientName}</span>
                        </div>
                        <div className="p-3 flex flex-col">
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Contact / Phone</span>
                            <span className="text-[10px] font-black text-slate-900 uppercase italic">{patient.phone || "---"}</span>
                        </div>
                        <div className="p-3 flex flex-col">
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Age / Gender</span>
                            <span className="text-[10px] font-black text-slate-900 uppercase italic">{patient.age}Y / {patient.gender}</span>
                        </div>
                        <div className="p-3 flex flex-col">
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Specimen ID</span>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter italic">{patient.barcode || "#ONLINE"}</span>
                        </div>
                        {/* Row 2 */}
                        <div className="p-3 flex flex-col">
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Ref By Dr.</span>
                            <span className="text-[10px] font-black text-blue-600 uppercase italic">{patient.referralName || "Self Consultant"}</span>
                        </div>
                        <div className="p-3 flex flex-col">
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Sample Date</span>
                            <span className="text-[10px] font-black text-slate-900 uppercase italic leading-none">
                                {patient.bookingDate ? new Date(patient.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '---'}
                            </span>
                        </div>
                        <div className="p-3 flex flex-col md:col-span-2">
                            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Report Date</span>
                            <span className="text-[10px] font-black text-slate-900 uppercase italic leading-none">
                                {report.updatedAt ? new Date(report.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '---'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Clinical Results */}
                <div className="space-y-12 mb-16">
                    {report.results.map((test: any, idx: number) => (
                        <div key={idx} className="space-y-4">
                            <div className="bg-slate-900 text-white px-5 py-2.5 rounded-lg flex justify-between items-center">
                                <h2 className="text-[12px] md:text-[13px] font-black uppercase tracking-[0.25em] italic">{test.testId?.name}</h2>
                                <span className="text-[8px] opacity-30 italic font-black uppercase">Report Section #{idx + 1}</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b-2 border-slate-900">
                                            <th className="py-2 text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Investigation</th>
                                            <th className="py-2 text-center text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Result</th>
                                            <th className="py-2 text-center text-[10px] font-black uppercase text-slate-500 tracking-widest italic">Units</th>
                                            <th className="py-2 text-right text-[10px] font-black uppercase text-slate-500 tracking-widest italic whitespace-nowrap">Ref. Interval</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(test.parameterResults || [])
                                            .filter((res: any) => res.value && !["TAKE MODE", "BLOOD MODE", "TEST MODE", "REF GROUP", "SECTION ID", "REF GENERAL"].includes(res.name?.toUpperCase()))
                                            .map((res: any, pIdx: number) => (
                                            <tr key={pIdx}>
                                                <td className="py-3.5 text-[12px] md:text-[13px] font-black text-slate-950 uppercase italic tracking-tighter">{res.name}</td>
                                                <td className="py-3.5 text-center">
                                                    <span className={cn(
                                                        "text-[16px] md:text-[18px] font-[1000] italic leading-none",
                                                        (res.status === "High" || res.status === "Low") ? "text-red-600 underline decoration-[1.5pt] underline-offset-4" : "text-slate-900"
                                                    )}>
                                                        {res.value || "---"}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 text-center text-[10px] md:text-[11px] font-bold text-slate-400 italic uppercase">{res.unit}</td>
                                                <td className="py-3.5 text-right text-[10px] md:text-[11px] font-bold text-slate-600 tracking-tighter italic">{res.normalRange}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* TECHNICAL DATA ROW - Public View */}
                            {test.parameterResults?.some((p: any) => ["TAKE MODE", "BLOOD MODE", "TEST MODE", "REF GROUP"].includes(p.name?.toUpperCase())) && (
                                <div className="mt-1 flex flex-wrap gap-x-4 px-1 opacity-20">
                                    {(test.parameterResults || [])
                                        .filter((p: any) => ["TAKE MODE", "BLOOD MODE", "TEST MODE", "REF GROUP"].includes(p.name?.toUpperCase()))
                                        .map((p: any, pIdx: number) => (
                                            <span key={pIdx} className="text-[7px] font-black uppercase tracking-tighter italic whitespace-nowrap">
                                                {p.name}: {p.value}
                                            </span>
                                        ))}
                                </div>
                            )}

                            {/* Clinical Footer for Test */}
                            <div className="mt-2 border-l-[3pt] border-blue-600 pl-4 py-2 bg-slate-50/50 rounded-r-xl">
                                <p className="text-[10px] md:text-[11px] font-bold text-slate-500 italic leading-tight mb-2">Interpretation & Comments</p>
                                <p className="text-[8px] md:text-[9px] font-black text-slate-400 leading-tight uppercase tracking-wide">
                                    Clinical findings must be correlated. All laboratory reports have technical limitations. Authorized validation complete.
                                </p>
                            </div>

                            {/* SIGNATURES FOR EACH TEST (Live from DB) */}
                            {center?.signatories?.length > 0 && (
                                <div className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-2 gap-8 md:gap-16 px-4 md:px-12">
                                    {center.signatories.map((sig: any, sIdx: number) => (
                                        <div key={sIdx} className="text-center group">
                                            <p className="font-serif italic text-slate-200 text-[9px] md:text-[10px] uppercase tracking-[0.4em] font-black group-hover:text-blue-500 transition-colors">Digitally Signed</p>
                                            <div className="w-full h-px bg-slate-900/10 my-2" />
                                            <p className="text-[12px] md:text-[14px] font-black uppercase text-slate-900 leading-none italic tracking-tight mb-1">{sig.name}</p>
                                            <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase italic leading-none">{sig.designation}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Final Verification Badge */}
                <div className="flex flex-col items-center py-12 md:py-20 border-t border-slate-100 gap-4 opacity-50 text-center">
                    <ShieldCheck size={48} className="text-slate-900" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 italic leading-none">*** End Of Diagnostic Document ***</p>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest italic">{new Date().toLocaleString()}</p>
                </div>

                {/* Final Disclaimer */}
                <div className="mt-6 flex justify-between items-center opacity-30 text-slate-400 border-t border-slate-50 pt-4">
                    <span className="text-[8px] font-black uppercase tracking-[0.3em] italic">SECURE CLINICAL TRANSMISSION</span>
                    <span className="text-[8px] font-black uppercase tracking-tight italic">ENCRYPTED PORTAL</span>
                </div>
            </div>

            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                body { font-family: 'Inter', sans-serif; }
                @media print {
                    .print-hidden { display: none !important; }
                    body { background: white !important; }
                    .w-full { max-width: 100% !important; margin: 0 !important; border: none !important; shadow: none !important; }
                }
            `}</style>
        </div>
    );
}
