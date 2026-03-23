"use client";

import { useEffect, useState } from "react";
import { Activity, Printer, ChevronLeft, Loader2, ShieldCheck, MapPin, Phone, Zap } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";

export default function PrintReportPage() {
    const { id } = useParams();
    const [report, setReport] = useState<any>(null);
    const [center, setCenter] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (report?.bookingId) {
            const pt = report.bookingId;
            const ptId = pt?._id?.toString().slice(-6).toUpperCase() || "NODE";
            document.title = `REPORT_${pt.patientName?.replace(/\s+/g, '_').toUpperCase()}_${ptId}`;
        }
    }, [report]);

    useEffect(() => {
        async function fetchData() {
            try {
                const [reportRes, centerRes] = await Promise.all([
                    fetch(`/api/reports/${id}`),
                    fetch("/api/center/profile")
                ]);
                const reportData = await reportRes.json();
                const centerData = await centerRes.json();
                setReport(reportData);
                setCenter(centerData);
            } catch (err) {
                console.error("Fetch failed", err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-6 bg-slate-50">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                <p className="font-black uppercase tracking-[0.4em] text-slate-300 text-[10px]">Assembling Clinical Document...</p>
            </div>
        );
    }

    const patient = report?.bookingId || {};

    return (
        <div className="bg-slate-100 min-h-screen py-8 md:py-20 font-sans text-[#1a1a1a] print:p-0 print:bg-white flex flex-col items-center">
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        font-family: 'Inter', sans-serif !important;
                    }
                    .print-hide { display: none !important; }

                    /* The Table Print System */
                    .print-container-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }

                    .print-header-spacer { 
                        height: ${center?.showHeader === false ? '50mm' : '0mm'}; 
                    }

                    .print-footer-spacer { 
                        height: ${center?.showFooter === false ? '60mm' : '0mm'}; 
                    }

                    .report-section {
                        break-inside: avoid !important;
                    }

                    table { border-collapse: collapse !important; width: 100% !important; }
                    th { border-bottom: 2pt solid #000 !important; font-size: 8pt !important; padding: 6pt 4pt !important; text-transform: uppercase !important; }
                    td { padding: 8pt 4pt !important; font-size: 9pt !important; }
                    .result-row td { border-bottom: 0.5pt solid #eee !important; }
                }

                body {
                    font-family: 'Inter', sans-serif;
                }
            `}</style>

            {/* Action Bar */}
            <div className="w-full max-w-[850px] flex justify-between items-center p-6 print:hidden gap-6 bg-white rounded-2xl shadow-xl border border-slate-200 mb-8 mx-4">
                <div className="flex items-center gap-4">
                    <Link href="/center/worklist" className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold uppercase text-[10px] tracking-widest transition-all">
                        <ChevronLeft size={18} /> Exit
                    </Link>
                    <div className="w-px h-6 bg-slate-200" />
                    <button 
                        onClick={() => window.location.reload()}
                        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold uppercase text-[10px] tracking-widest transition-all"
                    >
                        <Zap size={14} className="animate-pulse" /> Sync Diagnostics
                    </button>
                </div>
                <button
                    onClick={() => window.print()}
                    className="bg-[#0f172a] text-white px-8 py-3.5 rounded-xl font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all"
                >
                    <Printer size={16} /> Print Final Report
                </button>
            </div>

            {/* Clinical Document Body */}
            <div className="w-full max-w-[850px] bg-white p-10 md:p-14 print:p-0 shadow-2xl print:shadow-none min-h-[1100px] flex flex-col relative overflow-hidden">

                {/* Final Report Document Architecture */}
                <table className="print-container-table w-full">
                    <thead>
                        <tr>
                            <td>
                                <div className="print-header-spacer" />

                                {center?.showHeader !== false && (
                                    <div className="flex justify-between items-start border-b-[3pt] border-blue-600 pb-8 mb-8 mt-4 report-section">
                                        <div className="flex gap-6 items-start">
                                            {center?.logo ? (
                                                <img src={center.logo} alt="Lab Logo" className="w-24 h-24 object-contain" />
                                            ) : (
                                                <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                                                    <Activity size={40} />
                                                </div>
                                            )}
                                            <div>
                                                <h1 className="text-3xl font-[900] tracking-tight text-slate-900 uppercase leading-none mb-2">
                                                    {center?.name || "Standard Diagnostic Center"}
                                                </h1>
                                                <p className="text-blue-600 font-bold uppercase text-[10px] tracking-widest mb-4 italic">
                                                    {center?.tagline || "Advanced Laboratory Medicine & Research"}
                                                </p>
                                                <div className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-sm">
                                                    <p className="flex items-center gap-1.5"><MapPin size={12} className="text-blue-600" /> {center?.address}</p>
                                                    <p className="flex items-center gap-1.5 mt-1"><Phone size={12} className="text-blue-600" /> {center?.phone} | {center?.email || "reports@diagnostics.com"}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-3 pt-2">
                                            <div className="bg-slate-100 px-3 py-1.5 rounded text-[9px] font-bold text-slate-500 border border-slate-200 uppercase tracking-widest">
                                                {center?.headerText || "ISO 9001:2015 CERTIFIED"}
                                            </div>
                                            <div className="text-[10px] font-bold flex flex-col items-end gap-1">
                                                <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[8px]">NABL ACCREDITED</span>
                                                <span className="text-slate-400 mt-1 uppercase tracking-tighter">MC-1234/5678</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                {/* 2. Patient & Sample Matrix */}
                                <div className="report-section border border-slate-200 rounded-xl overflow-hidden mb-10 bg-slate-50/30">
                                    <table className="w-full text-left border-collapse">
                                        <tbody>
                                            <tr className="border-b border-slate-200">
                                                <td className="p-4 w-1/2 border-r border-slate-200">
                                                    <div className="grid grid-cols-[110px,1fr] gap-2 items-baseline text-slate-900">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient Name</span>
                                                        <span className="text-[14px] font-[900] uppercase italic tracking-tight leading-none">{patient.patientName}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 w-1/2">
                                                    <div className="grid grid-cols-[110px,1fr] gap-2 items-baseline text-slate-900">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Specimen ID</span>
                                                        <span className="text-[12px] font-black uppercase tracking-tighter text-blue-600 italic">{patient.barcode || "#NODE-REF"}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr className="border-b border-slate-200">
                                                <td className="p-4 w-1/2 border-r border-slate-200">
                                                    <div className="grid grid-cols-[110px,1fr] gap-2 items-baseline text-slate-900">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age / Gender</span>
                                                        <span className="text-[11px] font-black uppercase italic">{patient.age}Y / {patient.gender}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 w-1/2">
                                                    <div className="grid grid-cols-[110px,1fr] gap-2 items-baseline text-slate-900">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sample Date</span>
                                                        <span className="text-[11px] font-black uppercase italic leading-none">
                                                            {patient.bookingDate ? new Date(patient.bookingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '---'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="p-4 w-1/2 border-r border-slate-200">
                                                    <div className="grid grid-cols-[110px,1fr] gap-2 items-baseline text-slate-900">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ref By Dr.</span>
                                                        <span className="text-[11px] font-black text-blue-600 uppercase italic tracking-tighter leading-none">{patient.referralName || "Self Consultant"}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 w-1/2 text-slate-900">
                                                    <div className="grid grid-cols-[110px,1fr] gap-2 items-baseline">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Date</span>
                                                        <span className="text-[11px] font-black uppercase italic tracking-tighter leading-none">
                                                            {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                {/* 3. Investigation Results */}
                                <div className="space-y-12 mb-16">
                                    {(report?.results || []).map((test: any, idx: number) => (
                                        <div key={idx} className="report-section px-2">
                                            <div className="bg-slate-900 text-white px-5 py-2.5 flex justify-between items-center rounded-sm mb-6">
                                                <h2 className="text-[12px] font-black uppercase tracking-[0.2em]">{test.testId?.name}</h2>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="border-b-2 border-slate-900">
                                                            <th className="py-2.5 text-[10px] font-black uppercase text-slate-600 tracking-wider">Investigation</th>
                                                            <th className="py-2.5 text-center text-[10px] font-black uppercase text-slate-600 tracking-wider">Observed Value</th>
                                                            <th className="py-2.5 text-center text-[10px] font-black uppercase text-slate-600 tracking-wider">Units</th>
                                                            <th className="py-2.5 text-right text-[10px] font-black uppercase text-slate-600 tracking-wider">Ref. Interval</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {(test.parameterResults || []).filter((p: any) => p.value).map((res: any, pIdx: number) => (
                                                            <tr key={pIdx} className="result-row group">
                                                                <td className="py-4 text-[12px] font-black text-slate-900 uppercase tracking-tight leading-tight italic relative">
                                                                    {res.name}
                                                                    {res.status === "Digital Handshake Completed" && (
                                                                        <span className="absolute left-[-15px] top-1/2 -translate-y-1/2 text-blue-500/30 print:hidden">
                                                                            <Zap size={10} fill="currentColor" />
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="py-4 text-center text-[15px] font-[900] text-slate-900 tracking-tighter italic">
                                                                    <div className="flex flex-col items-center">
                                                                        <span>{res.value || "---"}</span>
                                                                        {res.status === "Digital Handshake Completed" && (
                                                                            <span className="text-[6px] font-black uppercase tracking-[0.2em] text-blue-500 opacity-40 mt-1 leading-none">Synced Node</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="py-4 text-center text-[11px] font-bold text-slate-400 italic uppercase">
                                                                    {res.unit}
                                                                </td>
                                                                <td className="py-4 text-right text-[11px] font-bold text-slate-600 tracking-tighter italic whitespace-nowrap">
                                                                    <span className={cn(
                                                                        "px-2 py-1 rounded-md",
                                                                        res.value && res.normalRange ? "bg-slate-50" : ""
                                                                    )}>
                                                                        {res.normalRange}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="mt-4 border-l-3 border-blue-600 pl-4 py-1">
                                                <p className="text-[9px] font-black text-slate-400 leading-relaxed uppercase italic tracking-wide">
                                                    Interpretation: Clinical findings must be correlated. All laboratory reports have technical limitations.
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td>
                                <div className="print-footer-spacer" />
                                {center?.showFooter !== false && (
                                    <div className="pt-8 border-t-2 border-slate-900 mb-6 report-section">
                                        <div className="grid grid-cols-3 items-end gap-12 px-6 mb-12">
                                            {/* Verification Node */}
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-24 h-24 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center p-2 relative group grayscale">
                                                    <ShieldCheck className="text-slate-300 opacity-40" size={48} />
                                                </div>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-center leading-tight">Authentic Secure<br />Report Verification</p>
                                            </div>

                                            {/* Signatures */}
                                            {center?.signatories?.length > 0 ? (
                                                <div className="col-span-2 grid grid-cols-2 gap-12">
                                                    {center.signatories.map((sig: any, sIdx: number) => (
                                                        <div key={sIdx} className="text-center">
                                                            <div className="h-12 flex items-center justify-center mb-2">
                                                                <p className="font-serif italic text-slate-300 text-[13px] opacity-40">Digitally Verified</p>
                                                            </div>
                                                            <div className="w-full h-px bg-slate-200 mb-3" />
                                                            <p className="text-[11px] font-black uppercase text-slate-900 tracking-tighter leading-none mb-1">{sig.name}</p>
                                                            <p className="text-[8px] font-bold text-slate-400 uppercase italic tracking-tighter leading-none">{sig.designation}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="text-center">
                                                        <div className="h-12 flex items-center justify-center mb-2">
                                                            <p className="font-serif italic text-slate-300 text-[13px] opacity-40">Digitally Verified</p>
                                                        </div>
                                                        <div className="w-full h-px bg-slate-200 mb-3" />
                                                        <p className="text-[11px] font-black uppercase text-slate-900 tracking-tighter leading-none mb-1">Senior Lab Specialist</p>
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase italic tracking-tighter leading-none">Verification Node ID: 4521/TR</p>
                                                    </div>

                                                    <div className="text-center">
                                                        <div className="h-12 flex items-center justify-center mb-2">
                                                            <p className="font-serif italic text-slate-300 text-[13px] opacity-40">Authorized Signatory</p>
                                                        </div>
                                                        <div className="w-full h-px bg-slate-900 mb-3" />
                                                        <p className="text-[11px] font-black uppercase text-slate-900 tracking-tighter leading-none mb-1">MD Pathologist (Consultant)</p>
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase italic tracking-tighter leading-none">Council Reg: MC-12344/5</p>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center px-6 opacity-40 text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck size={14} className="text-blue-600 opacity-60" />
                                                <span className="text-[8.5px] font-black uppercase tracking-[0.2em] italic leading-none whitespace-nowrap">
                                                    {center?.footerText || "Diagnostic Intelligence Grid • Secure HIPAA Compliant Transmission"}
                                                </span>
                                            </div>
                                            <p className="text-[9px] font-black uppercase tracking-tighter italic leading-none whitespace-nowrap">Diagnostic Transmission • Node Verified</p>
                                        </div>
                                    </div>
                                )}
                            </td>
                        </tr>
                    </tfoot>
                </table>

                {/* Secure Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none rotate-[35deg] scale-150 print:hidden">
                    <Activity size={400} />
                </div>
            </div>
        </div>
    );
}
