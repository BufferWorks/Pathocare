"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { Search, Bell, User, ChevronDown, Loader2, X, Command, Sparkles, Filter, Building2, TrendingUp, ShieldCheck, ArrowUpRight, UserPlus, Info, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session, status } = useSession() as any;

    const [searchOpen, setSearchOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const formatTimeAgo = (date: string) => {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.round(diffMs / 60000);
        const diffHours = Math.round(diffMins / 60);
        const diffDays = Math.round(diffHours / 24);

        if (diffMins < 1) return "just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const getIcon = (name: string) => {
        switch (name) {
            case "Building2": return <Building2 size={16} />;
            case "TrendingUp": return <TrendingUp size={16} />;
            case "ShieldCheck": return <ShieldCheck size={16} />;
            case "UserPlus": return <UserPlus size={16} />;
            case "AlertCircle": return <AlertCircle size={16} />;
            case "CheckCircle": return <CheckCircle size={16} />;
            default: return <Info size={16} />;
        }
    };

    // Define pages that SHOULD NOT have the sidebar
    const noSidebarPages = ["/", "/auth/login", "/auth/register"];
    const lastPathSegment = pathname.split('/').pop() || "";
    const isPrintPage = pathname.includes("/reports") && (pathname.includes("/BK") || lastPathSegment.length > 5);
    const isPublicPage = pathname.startsWith("/public");

    const showSidebar = !noSidebarPages.includes(pathname) && !isPrintPage && !isPublicPage;

    // Handle Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // 1. Security Pulse: Check center status on navigation
    useEffect(() => {
        const checkCenterStatus = async () => {
            if (status === "authenticated" && session?.user?.role !== "SUPER_ADMIN" && session?.user?.centerId) {
                try {
                    const res = await fetch(`/api/center/status`);
                    if (!res.ok) {
                        const contentType = res.headers.get("content-type");
                        if (contentType && contentType.includes("application/json")) {
                            const data = await res.json();
                            if (data.suspended || data.expired) {
                                signOut({ callbackUrl: `/auth/login?error=${encodeURIComponent(data.error)}` });
                            }
                        }
                    }
                } catch (err) {
                    console.error("Status verification failed", err);
                }
            }
        };

        checkCenterStatus();
    }, [pathname, status, session?.user?.centerId]);

    const fetchNotifications = async () => {
        if (status === "authenticated") {
            try {
                const res = await fetch("/api/notifications");
                if (!res.ok) {
                    console.warn("Notifications Fetch Failed:", res.status);
                    return;
                }
                const contentType = res.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    console.error("Notifications: Received non-JSON response");
                    return;
                }
                const data = await res.json();
                if (Array.isArray(data)) {
                    setNotifications(data);
                    setUnreadCount(data.filter((n: any) => !n.isRead).length);
                }
            } catch (err) {
                console.error("Failed to fetch notifications", err);
            }
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [status]);

    const markAsRead = async (id: string) => {
        try {
            await fetch("/api/notifications", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
            fetchNotifications();
        } catch (err) {
            console.error("Mark as read failed", err);
        }
    };

    // 2. Neural Search: Debounced system-wide search
    useEffect(() => {
        if (!searchQuery) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            if (searchQuery.length > 1) {
                setIsSearching(true);
                try {
                    const res = await fetch(`/api/search?q=${searchQuery}`);
                    if (!res.ok) throw new Error("Search Pulse Failed");
                    const contentType = res.headers.get("content-type");
                    if (!contentType || !contentType.includes("application/json")) throw new Error("Invalid Search Response");
                    
                    const data = await res.json();
                    setSearchResults(data);
                } catch (err) {
                    console.error("Search failed", err);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    if (!showSidebar) {
        return <>{children}</>;
    }

    if (status === "loading") {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-950 gap-6">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="font-black text-white uppercase tracking-[0.4em] text-[10px]">Initializing Enterprise System</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
            <Sidebar />

            <div className="flex-1 ml-80 flex flex-col min-w-0 relative">
                {/* Global Search Overlay */}
                <AnimatePresence>
                    {searchOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-start justify-center pt-32 px-10"
                            onClick={() => setSearchOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-4xl border border-white/10 overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="p-8 flex items-center gap-6 border-b border-slate-100 dark:border-slate-800">
                                    <Search className="text-primary w-8 h-8" />
                                    <input
                                        autoFocus
                                        placeholder="Search patients, centers, or reports..."
                                        className="bg-transparent border-none outline-none text-2xl font-black text-slate-900 dark:text-white w-full placeholder:text-slate-200 dark:placeholder:text-slate-800"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {isSearching && <Loader2 className="animate-spin text-primary w-6 h-6" />}
                                    <button onClick={() => setSearchOpen(false)} className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-10 max-h-[500px] overflow-y-auto">
                                    {searchQuery ? (
                                        <div className="space-y-4">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Results</p>
                                            {searchResults.length > 0 ? (
                                                <div className="space-y-2">
                                                    {searchResults.map((res, i) => (
                                                        <div key={i} onClick={() => { setSearchOpen(false); window.location.href = res.link; }} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer group flex items-center justify-between">
                                                            <div className="flex items-center gap-6">
                                                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                                    <Command size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-lg text-slate-900 dark:text-white tracking-tight">{res.title}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{res.type} • {res.sub}</p>
                                                                </div>
                                                            </div>
                                                            <ArrowUpRight size={20} className="text-slate-200 group-hover:text-primary transition-all" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
                                                    <Sparkles className="mx-auto mb-4 text-primary opacity-30" size={40} />
                                                    <p className="text-sm font-bold text-slate-400 italic">{isSearching ? "Scanning enterprise nodes..." : "No matching resources found in matrix."}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Neural Quicklinks</p>
                                                <div className="space-y-2">
                                                    {[
                                                        { l: "Global Test Registry", h: "/admin/tests" },
                                                        { l: "Active Lab Nodes", h: "/admin/centers" },
                                                        { l: "Referral Network", h: "/admin/doctors" }
                                                    ].map((item, i) => (
                                                        <div key={i} onClick={() => { setSearchOpen(false); window.location.href = item.h; }} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors font-bold text-sm">
                                                            <Command size={16} className="text-primary" /> {item.l}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Tags</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {["Centers", "Patients", "Revenue", "Staff", "Logs", "Docs"].map(tag => (
                                                        <span key={tag} className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-500 border border-slate-200 dark:border-slate-800">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navbar */}
                <header className="h-28 sticky top-0 z-[40] bg-white/70 dark:bg-slate-950/70 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-900 px-12 flex items-center justify-between transition-all">
                    <div className="flex items-center gap-12 flex-1">
                        <button
                            onClick={() => setSearchOpen(true)}
                            className="flex items-center gap-6 px-10 h-16 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-[2rem] w-full max-w-xl group relative overflow-hidden text-slate-300 hover:text-primary transition-all shadow-inner"
                        >
                            <Search size={22} className="group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-lg whitespace-nowrap">Search command matrix...</span>
                            <div className="ml-auto flex items-center gap-2 bg-white dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <Command size={12} />
                                <span className="text-[10px] font-black uppercase tracking-tight">K</span>
                            </div>
                        </button>
                    </div>

                    <div className="flex items-center gap-10">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => setNotifOpen(!notifOpen)}
                                className={cn(
                                    "relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all group",
                                    notifOpen ? "bg-primary text-white shadow-3xl shadow-primary/40 ring-4 ring-primary/10" : "bg-white dark:bg-slate-900 text-slate-400 hover:text-primary border border-slate-100 dark:border-slate-800 shadow-sm"
                                )}
                            >
                                <Bell size={24} className={cn(notifOpen ? "" : "group-hover:rotate-12 transition-transform")} />
                                {unreadCount > 0 && (
                                    <div className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
                                )}
                            </button>

                            <AnimatePresence>
                                {notifOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-20 right-0 w-[450px] bg-white dark:bg-slate-900 rounded-[3rem] shadow-4xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                                    >
                                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                            <h4 className="font-black text-xl italic uppercase tracking-tighter">System Alerts</h4>
                                            {unreadCount > 0 && (
                                                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase rounded-lg">{unreadCount} New</span>
                                            )}
                                        </div>
                                        <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                            {notifications.length > 0 ? notifications.map((n, i) => (
                                                <div
                                                    key={n._id}
                                                    onClick={() => markAsRead(n._id)}
                                                    className={cn(
                                                        "p-6 rounded-[2rem] transition-all cursor-pointer group relative",
                                                        n.isRead ? "opacity-60 grayscale-[0.5]" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                                    )}
                                                >
                                                    {!n.isRead && <div className="absolute left-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-glow" />}
                                                    <div className="flex items-center gap-4 mb-2">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center",
                                                            n.type === "success" ? "bg-emerald-500/10 text-emerald-500" :
                                                                n.type === "warning" ? "bg-orange-500/10 text-orange-500" :
                                                                    n.type === "error" ? "bg-red-500/10 text-red-500" :
                                                                        "bg-primary/10 text-primary"
                                                        )}>
                                                            {getIcon(n.icon)}
                                                        </div>
                                                        <h5 className="font-black text-sm uppercase tracking-tight">{n.title}</h5>
                                                        <span className="ml-auto text-[9px] font-black text-slate-300 uppercase italic">{formatTimeAgo(n.createdAt)}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 font-bold leading-relaxed">{n.description}</p>
                                                </div>
                                            )) : (
                                                <div className="p-10 text-center">
                                                    <Clock className="mx-auto mb-4 text-slate-200" size={32} />
                                                    <p className="text-sm font-bold text-slate-300 italic">No investigations log found.</p>
                                                </div>
                                            )}
                                        </div>
                                        <button className="w-full p-6 text-[10px] font-black uppercase tracking-[0.3em] text-primary border-t border-slate-50 dark:border-slate-800 hover:bg-primary hover:text-white transition-all italic">
                                            Enter Management Terminal
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="h-10 w-[1px] bg-slate-100 dark:bg-slate-800" />

                        {/* Profile Dropdown */}
                        <div className="relative">
                            <div
                                onClick={() => setProfileOpen(!profileOpen)}
                                className="flex items-center gap-4 group cursor-pointer p-2 pr-6 rounded-[2rem] hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all shadow-inner"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-slate-950 dark:bg-primary flex items-center justify-center text-white shadow-xl shadow-slate-900/20 group-hover:scale-105 transition-all relative overflow-hidden group/avatar">
                                    <User size={26} />
                                    <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover/avatar:opacity-100 transition-opacity" />
                                </div>
                                <div className="text-left hidden xl:block">
                                    <p className="text-sm font-black uppercase tracking-tighter text-slate-900 dark:text-white truncate max-w-[180px]">
                                        {session?.user?.name || "Access Hub"}
                                    </p>
                                    <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic flex items-center gap-1.5">
                                        <div className="w-1 h-1 rounded-full bg-primary" /> {session?.user?.role || "GLOBAL_ROOT"}
                                    </div>
                                </div>
                                <ChevronDown size={14} className={cn("text-slate-300 group-hover:text-primary transition-all", profileOpen && "rotate-180")} />
                            </div>

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-24 right-0 w-80 bg-white dark:bg-slate-900 rounded-[3rem] shadow-4xl border border-slate-100 dark:border-slate-800 p-4 space-y-1"
                                    >
                                        <div className="p-6 border-b border-slate-50 dark:border-slate-800 mb-2">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 italic">Authorized ID</p>
                                            <p className="font-mono text-[10px] text-slate-300 uppercase truncate">PC-{session?.user?.id?.slice(-12).toUpperCase() || "ROOT-X"}</p>
                                        </div>
                                        <Link href="/center/settings" className="flex items-center gap-4 px-6 py-4 w-full rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-all group">
                                            <Building2 size={18} className="text-slate-300 group-hover:text-primary" /> Laboratory Identity
                                        </Link>
                                        <div className="pt-2">
                                            <button
                                                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                                                className="flex items-center gap-4 px-6 py-5 w-full rounded-2xl bg-red-50 text-red-500 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-red-500 hover:text-white transition-all shadow-xl"
                                            >
                                                TERMINATE NODE SESSION
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-12 overflow-x-hidden relative">
                    {children}
                </main>
            </div>
        </div>
    );
}
