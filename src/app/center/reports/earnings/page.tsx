"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import {
    Printer,
    ChevronLeft,
    Calendar,
    TrendingUp,
    DollarSign,
    User,
    Search,
    Loader2,
    Activity,
    CreditCard
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

export default function EarningsReportPage() {
    const { data: session } = useSession() as any;
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/center/earnings?from=${dateFrom}&to=${dateTo}`);
            const data = await res.json();
            setReport(data);
        } catch (err) {
            console.error("Failed to fetch earnings report", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) fetchReport();
    }, [session]);

    const handlePrint = () => {
        window.print();
    };

    const filteredBookings = report?.bookings?.filter((b: any) =>
        b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b._id.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (loading && !report) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-14 h-14 text-primary animate-spin" />
                <p className="font-black uppercase tracking-[0.4em] text-slate-300 text-[10px]">Generating Financial Audit...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20 print:p-0 print:space-y-0 print:max-w-none print:mx-0">
            <style jsx global>{`
                @media print {
                    @page { 
                        size: A4; 
                        margin: 15mm 10mm; 
                    }
                    body { 
                        background: white !important; 
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .print-hide { display: none !important; }
                    .print-shadow-none { 
                        box-shadow: none !important; 
                        border: 1px solid #f1f5f9 !important;
                        background: white !important;
                    }
                    
                    /* Force Colors */
                    .bg-slate-50 { background-color: #f8fafc !important; }
                    .text-emerald-500 { color: #10b981 !important; }
                    .text-red-500 { color: #ef4444 !important; }
                    .text-orange-500 { color: #f97316 !important; }
                    .text-primary { color: #10b981 !important; }
                    .border-slate-950 { border-color: #0f172a !important; }

                    /* Typography */
                    h1 { font-size: 24pt !important; }
                    h3 { font-size: 18pt !important; }
                    table th { font-size: 8pt !important; color: #94a3b8 !important; }
                    table td { font-size: 10pt !important; }
                    .text-4xl { font-size: 24pt !important; }
                }
            `}</style>

            {/* Header / Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print-hide px-4 md:px-0">
                <div className="space-y-2">
                    <Link href="/center/dashboard">
                        <Button variant="ghost" className="rounded-xl gap-3 font-bold text-slate-500 mb-2">
                            <ChevronLeft size={20} /> Dashboard
                        </Button>
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">Earnings Report</h1>
                </div>
                <div className="flex gap-4">
                    <Button onClick={handlePrint} className="rounded-2xl h-16 px-10 shadow-3xl shadow-primary/30 font-black uppercase text-xs tracking-widest bg-primary text-white">
                        <Printer className="mr-3 w-6 h-6" /> Print Report
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 print-hide mx-4 md:mx-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Period Start</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 outline-none font-bold italic shadow-inner border-none"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Period End</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 outline-none font-bold italic shadow-inner border-none"
                        />
                    </div>
                    <Button onClick={fetchReport} className="h-16 rounded-2xl bg-slate-950 text-white font-black uppercase tracking-widest italic hover:scale-105 active:scale-95 transition-all">
                        Update Matrix
                    </Button>
                </div>
                <div className="relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors w-6 h-6" />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search patient name or ID in this period..."
                        className="w-full h-18 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] md:rounded-[2rem] pl-16 pr-8 outline-none font-bold italic shadow-sm"
                    />
                </div>
            </div>

            {/* Report Content */}
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] md:rounded-[5rem] shadow-4xl border border-slate-100 dark:border-slate-800 overflow-hidden print-shadow-none mx-4 md:mx-0">
                {/* Visual Summary */}
                <div className="p-8 md:p-16 bg-slate-50 dark:bg-slate-950/20 border-b-2 border-slate-100 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Gross Revenue</p>
                        <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white">₹{report?.summary?.totalGross || 0}</h3>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Total Discounts</p>
                        <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter text-red-500">₹{report?.summary?.totalDiscount || 0}</h3>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Net Collection</p>
                        <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter text-emerald-500">₹{report?.summary?.totalNet || 0}</h3>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Outstanding Bal.</p>
                        <h3 className="text-3xl md:text-4xl font-black italic tracking-tighter text-orange-500">₹{report?.summary?.totalBalance || 0}</h3>
                    </div>
                </div>

                {/* Table */}
                <div className="p-8 md:p-16">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-slate-100 dark:border-slate-800">
                                <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Date / ID</th>
                                <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Patient Details</th>
                                <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right italic">Gross</th>
                                <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right italic">Disc.</th>
                                <th className="py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right italic">Net Paid</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {filteredBookings.map((b: any) => (
                                <tr key={b._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all">
                                    <td className="py-8">
                                        <p className="text-sm font-black italic text-slate-900 dark:text-white">{new Date(b.bookingDate).toLocaleDateString()}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">#{b._id.slice(-8).toUpperCase()}</p>
                                    </td>
                                    <td className="py-8">
                                        <p className="text-lg font-black italic text-slate-900 dark:text-white uppercase tracking-tight">{b.patientName}</p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic mt-1">{b.phone}</p>
                                    </td>
                                    <td className="py-8 text-right font-black italic text-slate-400">₹{b.totalAmount}</td>
                                    <td className="py-8 text-right font-black italic text-red-500/50">₹{b.discount || 0}</td>
                                    <td className="py-8 text-right font-black italic text-slate-900 dark:text-white text-xl tracking-tighter">₹{b.netAmount}</td>
                                </tr>
                            ))}
                            {filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-[10px] italic">No transaction records found for this period.</p>
                                    </td>
                                </tr>
                            ) : (
                                <tr className="border-t-4 border-slate-950 dark:border-slate-700">
                                    <td colSpan={2} className="py-10 text-2xl font-black italic uppercase tracking-tighter">Total Aggregate</td>
                                    <td className="py-10 text-right text-lg font-black italic text-slate-400">₹{report?.summary?.totalGross || 0}</td>
                                    <td className="py-10 text-right text-lg font-black italic text-red-500/50">₹{report?.summary?.totalDiscount || 0}</td>
                                    <td className="py-10 text-right text-4xl font-black italic text-primary tracking-tighter">₹{report?.summary?.totalNet || 0}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="mt-20 pt-20 border-t border-slate-100 dark:border-slate-800 flex justify-between items-end">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">Audit Information</p>
                            <p className="text-xs font-bold text-slate-400 uppercase">Generated on: {new Date().toLocaleString()}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase">Audit Link: {report?.center?._id}</p>
                        </div>
                        <div className="text-right space-y-2">
                            <div className="w-48 h-0.5 bg-slate-900 dark:bg-white ml-auto" />
                            <p className="text-[10px] font-black uppercase tracking-widest italic">Authorized Signature</p>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
