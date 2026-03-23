"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Search, Calendar, ChevronRight, AlertCircle, Clock, CheckCircle2, Loader2, User, Fingerprint } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function ConfirmationPage() {
    const { data: session } = useSession() as any;
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchPending = async () => {
        if (!session?.user?.centerId) return;
        setLoading(true);
        try {
            const url = `/api/bookings?centerId=${session.user.centerId}&from=${dateFrom}&to=${dateTo}`;
            const res = await fetch(url);
            const data = await res.json();
            // Filter only pending or awaiting confirmation
            setBookings(data.filter((b: any) => b.status === "Pending" || b.status === "Collected"));
        } catch (err) {
            console.error("Failed to fetch pending samples", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (session) fetchPending();
    }, [session]);

    const filteredBookings = bookings.filter((b: any) =>
        b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b._id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleConfirm = async (id: string) => {
        try {
            const res = await fetch(`/api/bookings/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: "Collected" }),
            });
            if (res.ok) fetchPending();
        } catch (err) {
            console.error("Confirmation failed", err);
        }
    };

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-6xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white">Sample Verification</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2 ml-1">Confirm and Validate Patient Samples for Processing</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="rounded-2xl h-16 px-10 font-black border-slate-200 dark:border-slate-800 uppercase text-xs tracking-widest italic hover:bg-emerald-50 hover:border-emerald-200 group">
                        <CheckCircle className="mr-3 w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" /> Mass Approval
                    </Button>
                </div>
            </div>

            {/* Date Range Selector */}
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-10 items-end">
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Registration Date (From)</label>
                        <div className="relative group">
                            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors w-6 h-6" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full h-18 bg-slate-50 dark:bg-slate-800 border-none rounded-[1.5rem] pl-16 pr-8 font-bold outline-none shadow-inner text-lg"
                            />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Registration Date (To)</label>
                        <div className="relative group">
                            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors w-6 h-6" />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full h-18 bg-slate-50 dark:bg-slate-800 border-none rounded-[1.5rem] pl-16 pr-8 font-bold outline-none shadow-inner text-lg"
                            />
                        </div>
                    </div>
                </div>
                <Button onClick={fetchPending} className="h-18 px-16 rounded-[2rem] bg-slate-900 text-white dark:bg-primary shadow-3xl shadow-primary/20 text-xl font-black italic uppercase tracking-tighter shrink-0 hover:scale-105 active:scale-95 transition-all">
                    Filter Records <ChevronRight className="ml-3 w-6 h-6" />
                </Button>
            </div>

            {/* Search and Summary */}
            <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                <div className="relative group w-full md:w-[500px]">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors w-6 h-6" />
                    <input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search patient name or ID..."
                        className="w-full h-18 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] md:rounded-[2rem] pl-16 pr-8 outline-none font-bold italic shadow-sm focus:ring-4 focus:ring-primary/5 transition-all text-lg"
                    />
                </div>
                <div className="flex items-center gap-10 bg-slate-900 text-white px-10 py-6 rounded-[2rem] shadow-2xl">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Pending Total</span>
                        <span className="text-3xl font-black italic tracking-tighter text-primary">₹{filteredBookings.reduce((acc, b) => acc + (b.netAmount || 0), 0)}</span>
                    </div>
                </div>
            </div>

            {/* Sample Table */}
            <div className="bg-white dark:bg-slate-900 rounded-[5rem] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm relative group">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/50">
                                <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Patient Name / Identity</th>
                                <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Booking Details</th>
                                <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-center italic">Financial Summary (Gross / Disc / Net / Bal)</th>
                                <th className="px-12 py-10 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 text-right italic">Action Required</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="py-32 text-center space-y-4">
                                        <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">Finding Pending Samples...</p>
                                    </td>
                                </tr>
                            ) : filteredBookings.length > 0 ? filteredBookings.map((sample, i) => (
                                <tr key={sample._id} className="hover:bg-primary/5 transition-all group/row cursor-default">
                                    <td className="px-12 py-12">
                                        <div className="flex items-center gap-8">
                                            <div className="w-20 h-20 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover/row:bg-primary group-hover/row:text-white transition-all duration-700 shadow-inner">
                                                <User size={32} />
                                            </div>
                                            <div>
                                                <p className="text-slate-900 dark:text-white font-black text-3xl tracking-tighter uppercase italic">{sample.patientName}</p>
                                                <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black mt-1 italic">Booking ID: #{sample._id.slice(-8).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-12 py-12">
                                        <div className="flex items-center gap-3 text-slate-500 mb-2">
                                            <Clock size={16} className="text-primary" />
                                            <span className="text-[11px] uppercase font-black italic tracking-widest">{new Date(sample.bookingDate).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-tighter italic">Referral: <span className="text-primary underline underline-offset-4 decoration-primary/20 decoration-2">Dr. {sample.doctorId?.name || "Self Consult"}</span></p>
                                    </td>
                                    <td className="px-12 py-12 text-center">
                                        <div className="flex items-center justify-center gap-4">
                                            <div className="flex flex-col items-center px-6 border-r-2 border-slate-50 dark:border-slate-800">
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Gross</span>
                                                <span className="text-xl font-black italic tracking-tighter">₹{sample.totalAmount}</span>
                                            </div>
                                            <div className="flex flex-col items-center px-6 border-r-2 border-slate-50 dark:border-slate-800">
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Disc</span>
                                                <span className="text-xl font-black italic tracking-tighter text-red-500/50">₹{sample.discount || 0}</span>
                                            </div>
                                            <div className="flex flex-col items-center px-6 border-r-2 border-slate-50 dark:border-slate-800">
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest text-primary">Net</span>
                                                <span className="text-xl font-black italic tracking-tighter text-primary">₹{sample.netAmount}</span>
                                            </div>
                                            <div className="flex flex-col items-center px-6">
                                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Bal</span>
                                                <span className="text-xl font-black italic tracking-tighter text-orange-500/50">₹{sample.balance || 0}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-12 py-12 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {sample.status === "Collected" ? (
                                                <>
                                                    <Link href={`/center/reports/invoice/${sample._id}`}>
                                                        <Button variant="outline" className="h-16 px-6 rounded-2xl border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest italic hover:bg-slate-50">
                                                            Print Bill
                                                        </Button>
                                                    </Link>
                                                    <div className="inline-flex items-center gap-4 bg-emerald-500 text-white px-8 py-4 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/40 italic">
                                                        <CheckCircle2 size={20} /> Collected
                                                    </div>
                                                </>
                                            ) : (
                                                <Button
                                                    onClick={() => handleConfirm(sample._id)}
                                                    className="h-18 rounded-[2rem] px-12 bg-primary text-white shadow-3xl shadow-primary/30 text-xs font-black uppercase tracking-[0.2em] italic hover:scale-105 active:scale-95 transition-all"
                                                >
                                                    Confirm Collection
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="py-40 text-center space-y-6 border-2 border-dashed border-slate-50 dark:border-slate-800 m-12 rounded-[4rem]">
                                        <AlertCircle size={80} className="mx-auto text-slate-100 dark:text-slate-800" strokeWidth={1} />
                                        <h5 className="text-3xl font-black text-slate-200 dark:text-slate-800 uppercase tracking-[0.3em] italic">No Pending Samples</h5>
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Everything is up-to-date. No samples awaiting verification.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
