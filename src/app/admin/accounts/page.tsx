"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
    DollarSign,
    Calendar as CalendarIcon,
    Filter,
    Download,
    ArrowUpRight,
    TrendingUp,
    Wallet,
    ReceiptText,
    Search,
    Loader2,
    RefreshCcw,
    Building2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AccountsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [search, setSearch] = useState("");

    const fetchFinance = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (from) params.append("from", from);
            if (to) params.append("to", to);
            if (search) params.append("search", search);

            const res = await fetch(`/api/admin/accounts?${params.toString()}`);
            const result = await res.json();
            setData(result);
        } catch (err) {
            console.error("Failed to fetch accounts", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinance();
    }, []);

    const summaryItems = data?.summary || [
        { label: "Gross Revenue", value: "₹0", trend: "0%", color: "text-green-500" },
        { label: "Total Paid", value: "₹0", trend: "0% coll.", color: "text-blue-500" },
        { label: "Pending Balance", value: "₹0", trend: "0% risk", color: "text-orange-500" },
    ];

    return (
        <div className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h2 className="text-5xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white">Finance & Accounts</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 ml-1">Live Global Revenue Nodes & Fiscal Tracking</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="outline" className="rounded-2xl h-16 px-8 font-black uppercase text-xs tracking-widest border-slate-100 dark:border-slate-800">
                        <Download className="mr-3 w-5 h-5" /> Export PDF
                    </Button>
                    <Button onClick={fetchFinance} className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary text-white shadow-3xl shadow-primary/30">
                        <RefreshCcw className={cn("w-6 h-6", loading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Live Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {summaryItems.map((item: any, i: number) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all"
                    >
                        <div className={cn(
                            "w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-8 transition-transform group-hover:scale-110 duration-500 shadow-inner",
                            item.color
                        )}>
                            {i === 0 ? <TrendingUp size={30} /> : i === 1 ? <Wallet size={30} /> : <ReceiptText size={30} />}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{item.label}</p>
                        <h3 className="text-4xl font-black tracking-tighter italic text-slate-900 dark:text-white">{item.value}</h3>
                        <div className={cn(
                            "mt-6 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest w-fit px-4 py-1.5 rounded-full border shadow-sm",
                            i === 2 ? "bg-orange-500/10 text-orange-500 border-orange-500/10" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/10"
                        )}>
                            <TrendingUp size={12} /> {item.trend}
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                ))}
            </div>

            {/* Neural Filter Node */}
            <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-8 items-end">
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Fiscal Origin (From)</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                            <input
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl py-5 pl-16 pr-6 font-bold outline-none text-lg shadow-inner focus:ring-4 focus:ring-primary/5 transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Fiscal Limit (To)</label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                            <input
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl py-5 pl-16 pr-6 font-bold outline-none text-lg shadow-inner focus:ring-4 focus:ring-primary/5 transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Branch Node Search</label>
                        <div className="relative">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                            <input
                                placeholder="Filter by Center Name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-3xl py-5 pl-16 pr-6 font-bold outline-none text-lg shadow-inner focus:ring-4 focus:ring-primary/5 transition-all"
                            />
                        </div>
                    </div>
                </div>
                <Button onClick={fetchFinance} className="h-18 px-12 rounded-[2rem] shadow-3xl shadow-primary/30 text-xl font-black italic uppercase tracking-tighter">
                    Sync Ledger <ArrowUpRight className="ml-3" />
                </Button>
            </div>

            {/* Global Transaction Matrix */}
            <div className="bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-950/50">
                                <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Transaction Origin</th>
                                <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Gross (INR)</th>
                                <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Settled</th>
                                <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Liability</th>
                                <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Node Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Decrypting Financial Nodes...</p>
                                    </td>
                                </tr>
                            ) : data?.transactions?.length > 0 ? data.transactions.map((tx: any, i: number) => (
                                <tr key={i} className="hover:bg-primary/5 transition-all cursor-default group">
                                    <td className="px-12 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                                                <Building2 size={24} />
                                            </div>
                                            <div>
                                                <p className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{tx.branch}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">{tx.date} • <span className="text-primary italic">{tx.test}</span></p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-12 py-8 text-center text-xl font-black text-slate-900 dark:text-white italic tracking-tighter">₹{tx.total.toLocaleString()}</td>
                                    <td className="px-12 py-8 text-center text-xl font-black text-emerald-500 italic tracking-tighter">₹{tx.paid.toLocaleString()}</td>
                                    <td className="px-12 py-8 text-center text-xl font-black text-orange-500 italic tracking-tighter">₹{tx.balance.toLocaleString()}</td>
                                    <td className="px-12 py-8 text-right">
                                        <span className={cn(
                                            "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm border",
                                            tx.status === "Fully Paid" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/10" :
                                                tx.status === "Partial" ? "bg-orange-500/10 text-orange-500 border-orange-500/10" : "bg-red-500/10 text-red-500 border-red-500/10"
                                        )}>
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center text-slate-300">
                                        <ReceiptText size={64} className="mx-auto mb-6 opacity-30" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">No financial data detected in current matrix</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Fiscal Integrity: Nodes Syncing
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="h-2 w-32 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="h-full bg-primary shadow-3xl shadow-primary/50"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
