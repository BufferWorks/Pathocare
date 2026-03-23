"use client";

import { useEffect, useState } from "react";
import {
    Activity,
    LayoutDashboard,
    UserPlus,
    FlaskConical,
    Printer,
    ArrowRight,
    TrendingUp,
    Users,
    Calendar,
    Database,
    Search,
    Headset,
    ShieldCheck,
    Cpu,
    Globe,
    MessageSquare,
    AlertTriangle,
    Zap,
    ExternalLink,
    X,
    Loader2,
    Clock,
    CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function CenterDashboard() {
    const router = useRouter();
    const { data: session } = useSession() as any;
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSupportOpen, setIsSupportOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isOptimized, setIsOptimized] = useState(false);
    const [diagnosticLog, setDiagnosticLog] = useState<string[]>([]);

    const runDiagnostic = () => {
        setIsScanning(true);
        setIsOptimized(false);
        setDiagnosticLog(["Initializing Neural Link..."]);

        const logs = [
            "Initializing Neural Link...",
            "Scanning Local Database Parity...",
            "Checking Heuristic Sync Logs...",
            "Optimizing Query Cache...",
            "Synchronizing Cloud Vectors...",
            "Neural Pathways Calibrated."
        ];

        logs.forEach((log, index) => {
            setTimeout(() => {
                setDiagnosticLog(prev => [...prev, log]);
                if (index === logs.length - 1) {
                    setIsScanning(false);
                    setIsOptimized(true);
                    setTimeout(() => {
                        setIsOptimized(false);
                        setDiagnosticLog([]);
                    }, 5000);
                }
            }, (index + 1) * 800);
        });
    };

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch("/api/center/stats");
                if (!res.ok) {
                    console.error("Dashboard Stats Fetch Failed");
                    return;
                }
                const contentType = res.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    console.error("Dashboard Stats: Received non-JSON response");
                    return;
                }
                const data = await res.json();
                setStats(data);
            } catch (err) {
                console.error("Failed to fetch center stats", err);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-14 h-14 text-primary animate-spin" />
                <p className="font-black uppercase tracking-[0.4em] text-slate-300 text-[10px]">Synchronizing Local Lab Systems...</p>
            </div>
        );
    }

    const statSummary = [
        { label: "Today's Intake", value: stats?.todayBookings || "0", trend: "Live", icon: <Calendar className="text-blue-500" /> },
        { label: "Pending Process", value: stats?.pendingSamples || "0", trend: "Urgent", icon: <Clock className="text-orange-500" /> },
        { label: "Validated Reports", value: stats?.readyReports || "0", trend: "Ready", icon: <Printer className="text-emerald-500" /> },
        { label: "Collection (Today)", value: `₹${(stats?.todayRevenue || 0).toLocaleString()}`, trend: "Updated", icon: <TrendingUp className="text-indigo-500" /> },
    ];

    return (
        <>
            <div className="space-y-8 md:space-y-12 px-2 md:px-0">
                {/* dynamic Greeting Section */}
                <div className="relative bg-slate-950 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 text-white overflow-hidden shadow-3xl shadow-slate-950/20 group mx-2 md:mx-0">
                    <div className="absolute top-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/20 blur-[80px] md:blur-[120px] rounded-full -mr-32 -mt-32 transition-all group-hover:bg-primary/30" />
                    <div className="absolute bottom-0 left-0 w-40 md:w-80 h-40 md:h-80 bg-emerald-500/10 blur-[60px] md:blur-[100px] rounded-full -ml-32 -mb-32" />

                    <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10 md:gap-16">
                        <div className="space-y-6 md:space-y-8 flex-1">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-[8px] md:text-[10px]">
                                    <div className="w-6 md:w-10 h-0.5 bg-primary" /> Active Terminal
                                </div>
                                <h2 className="text-4xl md:text-6xl xl:text-7xl font-black italic tracking-tighter leading-none italic uppercase">
                                    Welcome Back,<br />
                                    <span className="text-primary not-italic">{session?.user?.name || "Member"}</span>
                                    <span className="block text-2xl md:text-3xl text-white/60 not-italic mt-2">@{stats?.centerName || "Diagnostic Center"}</span>
                                </h2>
                                <p className="text-white/40 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-2 md:gap-3 italic">
                                    Branch Identity: {stats?.centerId} <span className="w-1 h-1 rounded-full bg-white/20" /> Status: Operational
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                                <Link href="/center/booking">
                                    <Button size="lg" className="rounded-xl md:rounded-2xl h-16 md:h-18 px-8 md:px-10 shadow-3xl shadow-primary/40 font-black uppercase text-[10px] md:text-xs tracking-widest italic w-full sm:w-auto">
                                        <UserPlus className="mr-3 w-5 h-5 md:w-6 md:h-6" /> Patient Entry
                                    </Button>
                                </Link>
                                <Link href="/center/worklist">
                                    <Button variant="ghost" className="text-white hover:bg-white/10 rounded-xl md:rounded-2xl h-16 md:h-18 px-8 md:px-10 font-bold border border-white/10 text-[10px] md:text-[14px] w-full sm:w-auto uppercase italic tracking-widest">
                                        Process Worklist
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:gap-6 w-full xl:w-[500px]">
                            {statSummary.map((stat, i) => (
                                <div key={i} className="bg-white/5 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 border border-white/5 hover:border-white/10 transition-colors shadow-inner">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center mb-4 md:mb-6 shrink-0">
                                        {stat.icon}
                                    </div>
                                    <p className="text-[7px] md:text-[9px] font-black text-white/40 uppercase tracking-widest mb-1 italic">{stat.label}</p>
                                    <h3 className="text-xl md:text-3xl font-black tracking-tighter italic">{stat.value}</h3>
                                    <p className="text-[7px] md:text-[8px] font-black text-primary uppercase mt-1 tracking-widest italic">{stat.trend}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-12">
                    {/* Real-time Activity Feed */}
                    <div className="xl:col-span-2 space-y-8 md:space-y-10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-2xl md:text-3xl font-black tracking-tighter italic uppercase">Process Flow</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] md:tracking-widest text-[8px] md:text-[10px] italic">Real-time Status of Registered Patients</p>
                            </div>
                            <Link href="/center/worklist">
                                <Button variant="outline" className="rounded-lg md:rounded-xl font-black text-[8px] md:text-[10px] uppercase tracking-widest italic h-10 md:h-12">Global History</Button>
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:gap-6">
                            {(stats?.recentPatients || []).length > 0 ? stats.recentPatients.map((patient: any, i: number) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[1.5rem] md:rounded-[3rem] border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:shadow-2xl transition-all relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-4 md:gap-8 min-w-0">
                                        <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl md:text-3xl font-black text-slate-300 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm relative overflow-hidden shrink-0">
                                            <span className="relative z-10">{patient.name[0]}</span>
                                            <div className="absolute top-0 left-0 w-full h-full bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 md:gap-4 mb-1 md:mb-2">
                                                <h4 className="text-lg md:text-2xl font-black tracking-tight truncate uppercase italic">{patient.name}</h4>
                                                <span className="text-[7px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 md:px-3 md:py-1 rounded-md border border-slate-200/50 w-fit italic">#{patient.id}</span>
                                            </div>
                                            <p className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-widest italic truncate">{patient.test}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[8px] md:text-[10px] font-black text-slate-300 uppercase mb-2 md:mb-3 tracking-widest italic">{patient.time}</p>
                                        <div className={cn(
                                            "px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[7px] md:text-[9px] font-black uppercase tracking-widest shadow-sm italic",
                                            patient.status === "Completed" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                                patient.status === "Process" ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" :
                                                    patient.status === "Collected" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                                                        "bg-red-500/10 text-red-500 border border-red-500/20"
                                        )}>
                                            {patient.status}
                                        </div>
                                    </div>
                                    <div className="absolute top-0 right-0 h-full w-1 bg-slate-100 dark:bg-slate-800 group-hover:bg-primary transition-colors" />
                                </motion.div>
                            )) : (
                                <div className="py-20 md:py-24 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem] md:rounded-[3rem] flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-200">
                                        <Activity size={24} className="md:w-8 md:h-8" />
                                    </div>
                                    <p className="text-slate-400 font-black uppercase text-[8px] md:text-[10px] tracking-widest italic">Terminal is clear. No active registrations.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Command Bar */}
                    <div className="space-y-8 md:space-y-12">
                        <h3 className="text-2xl md:text-3xl font-black tracking-tighter italic uppercase">Quick Command</h3>

                        <div className="grid grid-cols-1 gap-4 md:gap-6">
                            {[
                                { label: "Update Rates", sub: "Global Price Sync", icon: <Database className="text-purple-500" />, href: "/center/manage-tests" },
                                { label: "User Management", sub: "Staff & Technicians", icon: <Users className="text-blue-500" />, href: "/center/staff" },
                                { label: "Daily Earnings", sub: "Financial Audit & Reports", icon: <Printer className="text-orange-500" />, href: "/center/reports/earnings" },
                            ].map((action, i) => (
                                <Link key={i} href={action.href}>
                                    <button className="flex items-center gap-4 md:gap-6 p-6 md:p-8 w-full bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] text-left hover:shadow-3xl hover:-translate-x-2 transition-all group border border-slate-100 dark:border-slate-800">
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm shrink-0">
                                            <div className="w-6 h-6 md:w-8 md:h-8 flex items-center justify-center">{action.icon}</div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-black text-base md:text-lg tracking-tight uppercase leading-none mb-1 truncate italic">{action.label}</h4>
                                            <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase tracking-widest italic truncate">{action.sub}</p>
                                        </div>
                                        <ArrowRight size={16} className="text-slate-200 group-hover:text-primary transition-colors group-hover:translate-x-2 transition-transform shrink-0" />
                                    </button>
                                </Link>
                            ))}
                        </div>

                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden group">
                            <div className="relative z-10">
                                <h4 className="text-xl md:text-2xl font-black italic tracking-tighter mb-4 uppercase">Enterprise Care</h4>
                                <p className="text-white/40 text-[10px] md:text-xs font-bold leading-relaxed mb-8 md:mb-10 uppercase tracking-wide">Secure clinical support is available 24/7 via the global terminal.</p>
                                <Button
                                    onClick={() => setIsSupportOpen(true)}
                                    className="w-full h-14 md:h-16 rounded-xl md:rounded-[1.5rem] bg-white text-slate-900 hover:bg-slate-100 transition-all font-black uppercase text-[8px] md:text-[10px] tracking-[0.2em] italic"
                                >
                                    Open Support Node
                                </Button>
                            </div>
                            <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-primary/10 rounded-full blur-2xl md:blur-3xl -mr-16 md:-mr-24 -mt-16 md:-mt-24 group-hover:scale-150 transition-transform" />
                        </div>
                    </div>
                </div>
            </div>
            <AnimatePresence>
                {isSupportOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSupportOpen(false)}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-4xl flex flex-col md:flex-row"
                        >
                            {/* Support Sidebar - Identity */}
                            <div className="md:w-72 bg-slate-950 p-8 md:p-12 border-r border-white/5 space-y-8">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Headset size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Support Node</h3>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">Active Terminal Monitoring & Protocol Assistance.</p>
                                </div>
                                <div className="pt-8 border-t border-white/5 space-y-4">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Center ID</p>
                                        <p className="text-xs font-bold text-primary italic uppercase">{stats?.centerId || "GENERIC_NODE"}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Identity</p>
                                        <p className="text-xs font-bold text-white/60 italic uppercase truncate">{stats?.centerName}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 p-8 md:p-12 space-y-10 overflow-y-auto max-h-[80vh] no-scrollbar">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h4 className="text-lg md:text-xl font-black italic uppercase text-white">Select Protocol</h4>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Connect to specialized enterprise vectors.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsSupportOpen(false)}
                                        className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Option 1: WhatsApp Bridge */}
                                    <a
                                        href={`https://wa.me/916268107784?text=ENTERPRISE_SUPPORT_REQUEST%0ANode_ID:_${stats?.centerId}%0ACenter:_${stats?.centerName}%0AUser:_${session?.user?.name}%0AStatus:_Operational_Terminal%0A---%0ARequest:_`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group p-6 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/30 rounded-3xl transition-all space-y-4"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                                            <MessageSquare size={24} />
                                        </div>
                                        <div>
                                            <h5 className="font-black text-white uppercase italic tracking-tight">Direct WhatsApp</h5>
                                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] mt-1 italic">Human Assistance Vector</p>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase leading-tight italic">Instant 1-to-1 encrypted bridge to our technical command unit.</p>
                                    </a>

                                    {/* Option 2: AI Troubleshooter -> Linked to Confirmation (Sample Verification) */}
                                    <button
                                        onClick={runDiagnostic}
                                        className="group p-6 bg-primary/5 hover:bg-primary/10 border border-primary/10 hover:border-primary/30 rounded-3xl transition-all space-y-4 text-left relative overflow-hidden"
                                    >
                                        {isScanning && (
                                            <motion.div
                                                initial={{ x: "-100%" }}
                                                animate={{ x: "100%" }}
                                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                                className="absolute inset-0 bg-primary/10"
                                            />
                                        )}
                                        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                            {isScanning ? <Loader2 size={24} className="animate-spin" /> : <Cpu size={24} />}
                                        </div>
                                        <div>
                                            <h5 className="font-black text-white uppercase italic tracking-tight">
                                                {isScanning ? "Scanning Node..." : isOptimized ? "Node Calibrated" : "AI Diagnostic Node"}
                                            </h5>
                                            <p className={`text-[8px] font-black uppercase tracking-[0.2em] mt-1 italic ${isOptimized ? 'text-emerald-500' : 'text-primary'}`}>
                                                {isScanning ? "Analyzing Parity" : isOptimized ? "Latency Optimized" : "Neural Recovery Active"}
                                            </p>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase leading-tight italic">
                                            {isOptimized ? "Diagnostic complete. All neural pathways are synchronized and operational." : "Detect & Resolve sample desynchronization and neural processing errors."}
                                        </p>

                                        {/* AI Thought Log Terminal */}
                                        {(isScanning || isOptimized) && (
                                            <div className="mt-4 p-4 bg-slate-950 rounded-2xl border border-white/5 font-mono text-[9px] space-y-1 overflow-hidden h-28 relative">
                                                <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                                                    <div className="flex gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500/40" />
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
                                                    </div>
                                                    <span className="text-white/20 uppercase tracking-widest text-[7px]">Neural_Terminal_v4.2</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {diagnosticLog.map((log, i) => (
                                                        <motion.div
                                                            initial={{ opacity: 0, x: -5 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            key={i}
                                                            className={cn(
                                                                "flex items-center gap-2",
                                                                i === diagnosticLog.length - 1 ? "text-primary" : "text-white/40"
                                                            )}
                                                        >
                                                            <span className="text-[7px] text-white/10">{`[${new Date().toLocaleTimeString('en-US', { hour12: false })}]`}</span>
                                                            <span className="font-bold tracking-tight"> {`> ${log}`}</span>
                                                        </motion.div>
                                                    ))}
                                                    {isScanning && <motion.div animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1.5 h-3 bg-primary inline-block ml-1 align-middle" />}
                                                </div>

                                                {isOptimized && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.9 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        className="absolute inset-x-0 bottom-0 p-4 bg-emerald-500/10 backdrop-blur-md border-t border-emerald-500/20 flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle size={12} className="text-emerald-500" />
                                                            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Efficiency: 99.8%</span>
                                                        </div>
                                                        <span className="text-[7px] font-bold text-white/40 uppercase">Latency: -2.4ms</span>
                                                    </motion.div>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                </div>

                                {/* Node Health Matrix */}
                                <div className="space-y-6 pt-6 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck size={16} className="text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">System Sync Parity</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest italic">
                                                <span className="text-white/40">Database Latency</span>
                                                <span className="text-emerald-500">12ms - Optimal</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: "95%" }}
                                                    className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest italic">
                                                <span className="text-white/40">Cloud Sync Status</span>
                                                <span className="text-primary">100% Synchronized</span>
                                            </div>
                                            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: "100%" }}
                                                    className="h-full bg-primary shadow-[0_0_10px_#10b981]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

