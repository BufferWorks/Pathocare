"use client";

import { useEffect, useState } from "react";
import {
    Building2,
    FlaskConical,
    Users,
    TrendingUp,
    ArrowUpRight,
    Zap,
    Loader2,
    Calendar,
    Layers,
    Activity,
    Plus,
    RefreshCcw,
    X,
    Globe,
    MapPin,
    Phone,
    Mail,
    Lock,
    Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState("Today");
    const [showRegModal, setShowRegModal] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/stats");
            if (!res.ok) {
                const text = await res.text().catch(() => "N/A");
                console.error("Dashboard Stats Error:", { status: res.status, body: text.substring(0, 200) });
                setStats(null);
                return;
            }
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                console.error("Dashboard Stats: Received non-JSON response");
                setStats(null);
                return;
            }
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error("Failed to fetch dashboard data", err);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [timeRange]);

    const handleSeedData = async () => {
        setIsSeeding(true);
        try {
            await fetch("/api/admin/seed", { method: "POST" });
            fetchStats();
        } catch (err) {
            console.error("Seeding failed", err);
        } finally {
            setIsSeeding(false);
        }
    };

    const handleRegisterCenter = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsRegistering(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch("/api/centers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                setShowRegModal(false);
                fetchStats();
            }
        } catch (err) {
            console.error("Registration failed", err);
        } finally {
            setIsRegistering(false);
        }
    };

    if (loading && !stats) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
                <div className="relative">
                    <Activity className="w-16 h-16 text-primary animate-pulse" />
                    <Loader2 className="w-20 h-20 text-primary animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />
                </div>
                <div className="text-center">
                    <p className="font-black uppercase tracking-[0.4em] text-slate-300 text-[10px] mb-2">Synchronizing Enterprise Nodes</p>
                    <h3 className="text-2xl font-black italic tracking-tighter text-white">Live Intelligence</h3>
                </div>
            </div>
        );
    }

    const statCards = [
        { label: "Total Centers", value: stats?.activeCenters || "0", icon: <Building2 />, color: "text-blue-500", bg: "bg-blue-500/10", trend: "+2 this month" },
        { label: "Global Tests", value: stats?.totalTests || "0", icon: <FlaskConical />, color: "text-purple-500", bg: "bg-purple-500/10", trend: "+156 new" },
        { label: "Active Staff", value: stats?.globalUsers || "0", icon: <Users />, color: "text-emerald-500", bg: "bg-emerald-500/10", trend: "99% active" },
        { label: "Revenue (Gross)", value: `₹${(stats?.revenue || 0).toLocaleString()}`, icon: <TrendingUp />, color: "text-orange-500", bg: "bg-orange-500/10", trend: "+12.4% vs last week" },
    ];

    return (
        <div className="space-y-10 pb-20">
            {/* Registration Modal Overlay */}
            <AnimatePresence>
                {showRegModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-10"
                        onClick={() => setShowRegModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[4rem] shadow-4xl border border-white/10 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] -mr-40 -mt-40" />

                                <div className="relative z-10 flex items-center justify-between mb-12">
                                    <div>
                                        <h3 className="text-4xl font-black tracking-tighter italic uppercase">Onboard Center</h3>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Expanding Enterprise Distribution Matrix</p>
                                    </div>
                                    <button onClick={() => setShowRegModal(false)} className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleRegisterCenter} className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase ml-4 tracking-widest text-slate-400">Laboratory Identity</label>
                                            <div className="relative">
                                                <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                                                <input name="name" required placeholder="e.g., Star Diagnostics Hub" className="w-full h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl pl-16 pr-6 outline-none font-bold border-2 border-transparent focus:border-primary/20" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase ml-4 tracking-widest text-slate-400">Physical Address</label>
                                            <div className="relative">
                                                <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                                                <input name="address" required placeholder="Full street address & floor" className="w-full h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl pl-16 pr-6 outline-none font-bold border-2 border-transparent focus:border-primary/20" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase ml-4 tracking-widest text-slate-400">Communication Node (Phone)</label>
                                            <div className="relative">
                                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                                                <input name="phone" required placeholder="+91 XXXX XXX XXX" className="w-full h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl pl-16 pr-6 outline-none font-bold border-2 border-transparent focus:border-primary/20" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase ml-4 tracking-widest text-slate-400">Admin email (Access Root)</label>
                                            <div className="relative">
                                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                                                <input name="email" type="email" required placeholder="admin@centerhub.com" className="w-full h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl pl-16 pr-6 outline-none font-bold border-2 border-transparent focus:border-primary/20" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase ml-4 tracking-widest text-slate-400">Root Password</label>
                                            <div className="relative">
                                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                                                <input name="password" type="password" required placeholder="••••••••" className="w-full h-16 bg-slate-50 dark:bg-slate-800 rounded-3xl pl-16 pr-6 outline-none font-bold border-2 border-transparent focus:border-primary/20" />
                                            </div>
                                        </div>
                                        <div className="pt-6">
                                            <Button type="submit" disabled={isRegistering} className="w-full h-18 rounded-[2rem] shadow-3xl shadow-primary/40 text-xl font-black uppercase tracking-widest italic flex items-center justify-center gap-4">
                                                {isRegistering ? <Loader2 className="animate-spin" /> : <><Globe size={24} /> Initialize Node</>}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header with Search & Onboarding */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h2 className="text-5xl font-black tracking-tighter italic mb-2 uppercase text-slate-900 dark:text-white">Enterprise Overview</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] ml-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Telemetry Matrix
                    </p>
                </div>

                <div className="flex flex-wrap gap-4 items-center">
                    {stats?.activeCenters === 0 && (
                        <Button onClick={handleSeedData} disabled={isSeeding} variant="outline" className="rounded-2xl h-14 px-8 border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-widest gap-2">
                            {isSeeding ? <Loader2 className="animate-spin" /> : <><Sparkles size={16} /> Seed Demo Data</>}
                        </Button>
                    )}

                    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-[1.2rem] border border-slate-200 dark:border-slate-800 shadow-inner">
                        {["Today", "Weekly", "Monthly"].map((range) => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    timeRange === range ? "bg-white dark:bg-slate-950 shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <Button onClick={fetchStats} variant="outline" className="w-14 h-14 rounded-2xl p-0 border-slate-200 hover:rotate-180 transition-transform duration-500 bg-white dark:bg-slate-900 text-slate-400">
                        <RefreshCcw size={20} />
                    </Button>

                    <Button onClick={() => setShowRegModal(true)} className="rounded-2xl h-14 px-8 shadow-3xl shadow-primary/40 font-black uppercase text-xs tracking-widest group">
                        <Plus className="mr-3 w-5 h-5 group-hover:rotate-90 transition-transform" /> Register New Center
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="group p-10 rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-3xl transition-all relative overflow-hidden cursor-default"
                    >
                        <div className="flex items-center justify-between mb-10 relative z-10">
                            <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-transform group-hover:scale-110 duration-500 shadow-sm", stat.bg, stat.color)}>
                                {stat.icon}
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="flex items-center text-[9px] font-black text-emerald-500 bg-emerald-500/5 px-3 py-1.5 rounded-full border border-emerald-500/10">
                                    {stat.trend}
                                </div>
                            </div>
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{stat.label}</p>
                            <h3 className="text-4xl font-black tracking-tighter group-hover:translate-x-1 transition-transform text-slate-900 dark:text-white">{stat.value}</h3>
                        </div>
                        <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-[0.03] transition-opacity">
                            <Layers size={120} />
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                <div className="xl:col-span-2 p-12 rounded-[4rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between mb-12">
                        <div>
                            <h3 className="text-3xl font-black tracking-tighter italic mb-1 uppercase text-slate-900 dark:text-white">Network Expansion</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global diagnostic distribution nodes</p>
                        </div>
                        <button className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all shadow-sm group">
                            <ArrowUpRight size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {stats?.topCentersData?.map((center: any, i: number) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex items-center justify-between p-7 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 hover:bg-emerald-500/5 border border-transparent hover:border-emerald-500/10 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500">
                                        {center.initials}
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black tracking-tight group-hover:text-primary transition-colors uppercase text-slate-900 dark:text-white">{center.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{center.location}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-[9px] font-black uppercase text-slate-300 mb-1">Operational State</p>
                                        <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] font-black uppercase border border-emerald-500/10">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Syncing
                                        </div>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all">
                                        <ArrowUpRight size={20} />
                                    </div>
                                </div>
                            </motion.div>
                        )) || (
                                <div className="py-20 text-center flex flex-col items-center gap-4">
                                    <Building2 className="w-16 h-16 text-slate-200" strokeWidth={1} />
                                    <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest">No nodes registered in current matrix</p>
                                </div>
                            )}
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="p-12 rounded-[4rem] bg-emerald-500 text-white shadow-3xl shadow-emerald-500/30 relative overflow-hidden group cursor-pointer">
                        <div className="relative z-10">
                            <div className="flex items-center gap-5 mb-10">
                                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl group-hover:bg-white/30 transition-colors">
                                    <Zap size={35} />
                                </div>
                                <h3 className="text-3xl font-black italic tracking-tighter uppercase">Cluster Delta</h3>
                            </div>
                            <div className="mb-12">
                                <p className="text-white/60 text-[11px] font-black uppercase tracking-[0.3em] mb-3 leading-none">Global Network Uptime</p>
                                <div className="flex items-baseline gap-4">
                                    <h4 className="text-8xl font-black tracking-tighter leading-none group-hover:scale-105 transition-transform origin-left">99.9</h4>
                                    <span className="text-2xl font-black text-white/40 italic">%</span>
                                </div>
                            </div>

                            <div className="w-full h-32 flex items-end gap-2 mb-10 px-2">
                                {[40, 60, 45, 80, 55, 90, 75, 40, 85, 65, 50, 95, 70, 80, 60].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        transition={{ delay: i * 0.05, duration: 1 }}
                                        className="flex-1 bg-white/30 rounded-full hover:bg-white transition-colors cursor-crosshair relative group/bar"
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-emerald-600 px-2 py-1 rounded-md text-[8px] font-black opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap">
                                            {h}ms
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <Button className="w-full h-18 rounded-[2rem] bg-white text-emerald-600 hover:bg-slate-50 transition-all font-black uppercase text-xs tracking-[0.2em] shadow-xl">
                                Diagnostic Metrics Node
                            </Button>
                        </div>

                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[120px] -mr-48 -mt-48 group-hover:bg-white/20 transition-all duration-700" />
                    </div>

                    <div className="p-10 rounded-[4rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center gap-8 relative overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                        <div className="w-20 h-20 rounded-[1.5rem] bg-primary/20 flex items-center justify-center text-primary shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500">
                            <Calendar size={38} />
                        </div>
                        <div className="relative z-10">
                            <h4 className="font-black text-slate-900 dark:text-white text-2xl tracking-tighter italic uppercase mb-1">Fiscal Update</h4>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Auto-payout: 48h
                            </p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            <TrendingUp size={120} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
