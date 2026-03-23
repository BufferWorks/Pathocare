"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
    Users,
    UserPlus,
    Search,
    Phone,
    Mail,
    ShieldCheck,
    Key,
    Trash2,
    Edit3,
    Plus,
    Fingerprint,
    Loader2,
    Lock,
    X,
    Shield,
    AtSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function StaffRegistrationPage() {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchStaff = async () => {
        try {
            const res = await fetch("/api/center/staff");
            const data = await res.json();
            setStaff(data);
        } catch (err) {
            console.error("Failed to fetch staff", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        if (editingStaff) {
            (data as any)._id = editingStaff._id;
        }

        try {
            const res = await fetch("/api/center/staff", {
                method: editingStaff ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                setShowModal(false);
                setEditingStaff(null);
                fetchStaff();
            }
        } catch (err) {
            console.error("Submission failed", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to permanently revoke this access protocol?")) return;
        try {
            await fetch(`/api/center/staff?id=${id}`, { method: "DELETE" });
            fetchStaff();
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: staff.length,
        active: staff.filter(s => s.status !== "Inactive").length,
        admins: staff.filter(s => s.role === "CENTER_ADMIN" || s.role === "SUPER_ADMIN").length
    };

    return (
        <div className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h2 className="text-5xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white">Personnel Registry</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2 ml-1">Laboratory Staff & Role-Based Access Control</p>
                </div>
                <Button onClick={() => { setEditingStaff(null); setShowModal(true); }} className="rounded-2xl h-16 px-10 shadow-3xl shadow-primary/30 font-black text-lg tracking-tight group overflow-hidden relative">
                    <span className="relative z-10 flex items-center gap-3">
                        <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" /> Onboard Employee
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
                {/* Stats Control Center */}
                <div className="xl:col-span-1 space-y-8">
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] space-y-10 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10 space-y-10">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-6 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Network Population
                                </p>
                                <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 shadow-inner group-hover:bg-primary/10 transition-colors">
                                    <h3 className="text-6xl font-black tracking-tighter text-primary">{stats.total}</h3>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Active Profiles</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-emerald-500/5 p-6 rounded-[1.5rem] border border-emerald-500/10 shadow-sm transition-transform hover:scale-105">
                                    <h4 className="text-2xl font-black text-emerald-500 leading-none">{stats.active}</h4>
                                    <p className="text-[9px] font-black uppercase text-slate-400 mt-2 tracking-widest">Online</p>
                                </div>
                                <div className="bg-blue-500/5 p-6 rounded-[1.5rem] border border-blue-500/10 shadow-sm transition-transform hover:scale-105">
                                    <h4 className="text-2xl font-black text-blue-500 leading-none">{stats.admins}</h4>
                                    <p className="text-[9px] font-black uppercase text-slate-400 mt-2 tracking-widest">Admin</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50 group-hover:opacity-100 transition-opacity" />
                    </div>

                    <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-white/5">
                        <div className="relative z-10">
                            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-500/20 flex items-center justify-center mb-8 border border-indigo-500/20 shadow-inner group-hover:bg-indigo-500 group-hover:text-white transition-all text-indigo-400">
                                <ShieldCheck size={32} />
                            </div>
                            <h4 className="text-2xl font-black mb-2 tracking-tight uppercase">Security Logs</h4>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.1em] leading-relaxed mb-8">Auditing access protocols across your network cluster.</p>
                            <Button className="w-full h-14 rounded-2xl bg-white/10 hover:bg-white text-white hover:text-slate-900 border-none font-black uppercase text-xs tracking-widest transition-all">
                                View Audit Trail
                            </Button>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -mr-32 -mt-32" />
                    </div>
                </div>

                {/* Live Staff Grid */}
                <div className="xl:col-span-3 space-y-10">
                    <div className="relative group">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors w-6 h-6" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Lookup personnel by identity, role cluster or enterprise communication..."
                            className="w-full h-20 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] pl-20 pr-8 outline-none font-bold shadow-sm transition-all focus:ring-4 focus:ring-primary/10"
                        />
                    </div>

                    {loading ? (
                        <div className="h-[50vh] flex flex-col items-center justify-center gap-6">
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading Registry Matrix...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <AnimatePresence>
                                {filteredStaff.length > 0 ? filteredStaff.map((member, i) => (
                                    <motion.div
                                        key={member._id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-8">
                                            <div className={cn(
                                                "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border",
                                                member.status !== "Inactive" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                            )}>
                                                <Fingerprint size={12} /> {member.status || "Auth: Valid"}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 mb-10">
                                            <div className="w-20 h-20 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center font-black text-3xl text-slate-300 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                                {member.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="text-2xl font-black tracking-tight uppercase group-hover:text-primary transition-colors text-slate-900 dark:text-white mb-2">{member.name}</h4>
                                                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
                                                    <Lock size={10} /> {member.role.replace("_", " ")}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-10 py-8 border-y border-slate-50 dark:border-slate-800">
                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors uppercase tracking-widest">
                                                <Phone size={16} className="text-primary/40 group-hover:text-primary transition-colors" /> {member.phone || "No Pulse Comm"}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs font-bold text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors uppercase tracking-widest">
                                                <Mail size={16} className="text-primary/40 group-hover:text-primary transition-colors" /> <span className="truncate">{member.email}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <Button onClick={() => { setEditingStaff(member); setShowModal(true); }} variant="outline" className="flex-1 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest border-slate-200 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all">
                                                <Edit3 size={16} className="mr-2" /> Adjust Rights
                                            </Button>
                                            <Button onClick={() => handleDelete(member._id)} variant="outline" className="w-14 h-14 p-0 rounded-2xl bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border-red-100 group/del transition-all">
                                                <Trash2 size={20} className="group-hover/del:scale-110 transition-transform" />
                                            </Button>
                                        </div>

                                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.div>
                                )) : (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="col-span-1 lg:col-span-2 py-24 bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center shadow-sm"
                                    >
                                        <div className="w-20 h-20 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-6 shadow-inner">
                                            <Users size={32} />
                                        </div>
                                        <h4 className="text-2xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white mb-2">No Profiles Found</h4>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Try adjusting your search protocol.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* Registration Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6"
                        onClick={() => setShowModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 30 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3.5rem] shadow-4xl border border-white/10 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />

                                <div className="relative z-10 flex items-center justify-between mb-12">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                            <ShieldCheck size={32} />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
                                                {editingStaff ? "Adjust Profile" : "Register Node Access"}
                                            </h3>
                                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Personnel Authorization Matrix</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all hover:rotate-90">
                                        <X size={24} />
                                    </button>
                                </div>

                                <form onSubmit={handleSubmit} className="relative z-10 space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Full Legal Name</label>
                                        <div className="relative group">
                                            <Users className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                                            <input name="name" required defaultValue={editingStaff?.name} placeholder="e.g. Dr. Emily Chen" className="w-full h-16 bg-slate-50 dark:bg-slate-800 rounded-[2rem] pl-16 outline-none font-bold text-lg border-2 border-transparent focus:border-primary/20 shadow-inner transition-all" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Enterprise Email</label>
                                            <div className="relative group">
                                                <AtSign className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                                                <input name="email" type="email" required defaultValue={editingStaff?.email} placeholder="name@clinic.com" className="w-full h-16 bg-slate-50 dark:bg-slate-800 rounded-[2rem] pl-16 outline-none font-bold text-lg border-2 border-transparent focus:border-primary/20 shadow-inner transition-all" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Contact Phone</label>
                                            <div className="relative group">
                                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                                                <input name="phone" defaultValue={editingStaff?.phone} placeholder="+91 XXXXX XXXXX" className="w-full h-16 bg-slate-50 dark:bg-slate-800 rounded-[2rem] pl-16 outline-none font-bold text-lg border-2 border-transparent focus:border-primary/20 shadow-inner transition-all" />
                                            </div>
                                        </div>
                                    </div>

                                    {!editingStaff && (
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Initial Network Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5" />
                                                <input name="password" type="password" required placeholder="••••••••" className="w-full h-16 bg-slate-50 dark:bg-slate-800 rounded-[2rem] pl-16 outline-none font-bold text-lg border-2 border-transparent focus:border-primary/20 shadow-inner transition-all" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Access Hierarchy</label>
                                        <div className="relative group">
                                            <Shield className="absolute left-6 top-1/2 -translate-y-1/2 text-primary w-5 h-5 pointer-events-none z-10" />
                                            <select name="role" required defaultValue={editingStaff?.role || "STAFF"} className="w-full h-16 bg-slate-50 dark:bg-slate-800 rounded-[2rem] pl-16 pr-8 outline-none font-bold text-lg border-2 border-transparent focus:border-primary/20 shadow-inner appearance-none relative z-0 cursor-pointer transition-all">
                                                <option value="STAFF">Standard Laboratory Technician</option>
                                                <option value="CENTER_ADMIN">Full Administrative Authority</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-6">
                                        <Button type="submit" disabled={isSubmitting} className="w-full h-18 rounded-[2rem] bg-primary hover:bg-primary-hover shadow-3xl shadow-primary/30 text-lg font-black uppercase tracking-widest flex items-center justify-center gap-3">
                                            {isSubmitting ? (
                                                <Loader2 className="animate-spin w-6 h-6" />
                                            ) : (
                                                <>{editingStaff ? "Push Node Update" : "Authorize Record"} <ChevronRight className="w-5 h-5 inline" /></>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function ChevronRight({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m9 18 6-6-6-6" />
        </svg>
    );
}
