"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Activity,
    LayoutDashboard,
    Users,
    FlaskConical,
    UserPlus,
    FileText,
    Stethoscope,
    Globe,
    Wallet,
    ClipboardCheck,
    Package,
    LogOut,
    ChevronRight,
    ShieldAlert,
    Settings,
    Bell
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession() as any;

    const userRole = session?.user?.role || "STAFF";
    const userName = session?.user?.name || "System User";
    const userEmail = session?.user?.email || "user@pathocare.com";

    const adminLinks = [
        { label: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/admin" },
        { label: "Center Registry", icon: <Globe size={20} />, href: "/admin/centers" },
        { label: "Global Catalog", icon: <FlaskConical size={20} />, href: "/admin/tests" },
        { label: "Doctor Master", icon: <Stethoscope size={20} />, href: "/admin/doctors" },
        { label: "Enterprise accounts", icon: <Wallet size={20} />, href: "/admin/accounts" },
        { label: "Access Control", icon: <ShieldAlert size={20} />, href: "/admin/users" },
    ];

    const centerLinks = [
        { label: "Lab Overview", icon: <LayoutDashboard size={20} />, href: "/center/dashboard" },
        { label: "Patient Booking", icon: <UserPlus size={20} />, href: "/center/booking" },
        { label: "Lab Worklist", icon: <ClipboardCheck size={20} />, href: "/center/worklist" },
        { label: "Diagnostics Rates", icon: <Package size={20} />, href: "/center/manage-tests", adminOnly: true },
        { label: "Staff Directory", icon: <Users size={20} />, href: "/center/staff", adminOnly: true },
        { label: "Outsource Logistics", icon: <Globe size={20} />, href: "/center/outsource" },
        { label: "Sample Verification", icon: <FileText size={20} />, href: "/center/sample-verification" },
    ];

    const isSuper = userRole === "SUPER_ADMIN";
    const rawLinks = isSuper ? adminLinks : centerLinks;

    const links = rawLinks.filter(link => {
        if (userRole === "STAFF" && (link as any).adminOnly) return false;
        return true;
    });

    return (
        <aside className="fixed left-0 top-0 h-screen w-80 bg-slate-950 text-slate-400 flex flex-col z-50 p-8 border-r border-white/5">
            {/* Brand Header */}
            <div className="flex items-center gap-4 mb-16 px-4">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/40">
                    <Activity size={28} />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tighter leading-tight flex items-center">
                        PathoCare<span className="text-primary">.</span>
                    </h1>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">Enterprise SaaS</p>
                </div>
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-center justify-between mb-8 px-4">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Operational</p>
                    <button className="text-slate-700 hover:text-white transition-colors">
                        <Bell size={14} />
                    </button>
                </div>

                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={cn(
                            "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-sm group",
                            pathname === link.href
                                ? "bg-primary text-white shadow-2xl shadow-primary/20"
                                : "hover:text-white hover:bg-white/5"
                        )}
                    >
                        <span className={cn(
                            "transition-colors",
                            pathname === link.href ? "text-white" : "text-slate-600 group-hover:text-primary"
                        )}>
                            {link.icon}
                        </span>
                        <span className="flex-1 tracking-tight">{link.label}</span>
                        {pathname === link.href && <div className="w-1.5 h-1.5 rounded-full bg-white shadow-glow" />}
                    </Link>
                ))}

                {(userRole === "CENTER_ADMIN" || userRole === "SUPER_ADMIN") && (
                    <div className="pt-8 px-4">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">System</p>
                        <Link
                            href="/center/settings/integrations"
                            className={cn(
                                "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-sm mb-2",
                                pathname === "/center/settings/integrations"
                                    ? "bg-primary/20 text-white border border-primary/30"
                                    : "text-slate-600 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Activity size={20} className="text-primary" />
                            <span>Diagnostic Hardware</span>
                        </Link>
                        <Link
                            href={userRole === "SUPER_ADMIN" ? "/admin" : "/center/settings"}
                            className={cn(
                                "flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-sm",
                                pathname === "/settings" || pathname === "/center/settings"
                                    ? "bg-white/10 text-white"
                                    : "text-slate-600 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Settings size={20} />
                            <span>Admin Settings</span>
                        </Link>
                    </div>
                )}
            </nav>

            {/* User Footer Profile */}
            <div className="mt-auto pt-8 border-t border-white/5">
                <div className="bg-white/5 rounded-3xl p-5 mb-4 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black uppercase shadow-inner">
                            {userName.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-xs font-black text-white truncate uppercase tracking-tighter">{userName}</p>
                            <p className="text-[9px] font-bold text-slate-600 uppercase truncate tracking-widest">{userRole.replace("_", " ")}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: "/auth/login" })}
                        className="flex items-center gap-3 w-full py-2 text-red-400 hover:text-red-300 transition-colors font-black uppercase text-[10px] tracking-widest"
                    >
                        <LogOut size={16} />
                        Terminate Session
                    </button>
                </div>
            </div>
        </aside>
    );
}
