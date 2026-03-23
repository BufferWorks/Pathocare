"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Globe, Plus, Search, MapPin, Phone, Mail, Edit3, Trash2, ShieldCheck, Loader2, Building2, CreditCard, Calendar, X, AlertCircle, History, Receipt, ArrowRight, Wallet, CheckCircle2, Info, Star, Key, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function CenterMasterPage() {
    const [centers, setCenters] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCenter, setSelectedCenter] = useState<any>(null);
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [showRegModal, setShowRegModal] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState<"settings" | "history" | "new_payment" | "profile" | "credentials">("settings");
    const [payments, setPayments] = useState<any[]>([]);
    const [loadingPayments, setLoadingPayments] = useState(false);

    const fetchCenters = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/centers");
            const data = await res.json();
            setCenters(data);
        } catch (err) {
            console.error("Failed to fetch centers", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPayments = async (centerId: string) => {
        try {
            setLoadingPayments(true);
            const res = await fetch(`/api/centers/payments?centerId=${centerId}`);
            if (res.ok) {
                const data = await res.json();
                setPayments(data);
            }
        } catch (err) {
            console.error("Failed to fetch payments", err);
        } finally {
            setLoadingPayments(false);
        }
    };

    useEffect(() => {
        fetchCenters();
    }, []);

    useEffect(() => {
        if (selectedCenter && activeTab === "history") {
            fetchPayments(selectedCenter._id);
        }
    }, [selectedCenter, activeTab]);

    const handleUpdateCenter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCenter) return;
        setUpdating(true);
        try {
            const formData = new FormData(e.target as HTMLFormElement);
            const body: any = {};
            formData.forEach((value, key) => {
                if (key === "isActive") body[key] = value === "on";
                else if (key === "amount") body.subscriptionAmount = Number(value);
                else if (key === "expiry") body.expiryDate = new Date(value as string);
                else body[key] = value;
            });

            const res = await fetch(`/api/centers/${selectedCenter._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                await fetchCenters();
                const updated = await res.json();
                setSelectedCenter(updated);

                if (activeTab === "settings" || activeTab === "credentials") {
                    setIsSubModalOpen(false);
                    setSelectedCenter(null);
                }
            }
        } catch (err) {
            console.error("Failed to update center", err);
        } finally {
            setUpdating(false);
        }
    };

    const handleLogPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCenter) return;
        setUpdating(true);
        try {
            const formData = new FormData(e.target as HTMLFormElement);
            const body = {
                centerId: selectedCenter._id,
                amount: Number(formData.get("amount")),
                plan: formData.get("plan"),
                method: formData.get("method"),
                expiryDate: formData.get("expiry"),
                remarks: formData.get("remarks"),
            };

            const res = await fetch("/api/centers/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                await fetchCenters();
                setActiveTab("history");
                fetchPayments(selectedCenter._id);
            }
        } catch (err) {
            console.error("Failed to log payment", err);
        } finally {
            setUpdating(false);
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
                fetchCenters();
            }
        } catch (err) {
            console.error("Registration failed", err);
        } finally {
            setIsRegistering(false);
        }
    };

    const filteredCenters = centers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.address.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
    );

    const checkStatus = (center: any) => {
        if (!center.isActive) return { label: "Suspended", color: "bg-red-500/10 text-red-500 border-red-500/20" };
        if (center.expiryDate && new Date(center.expiryDate) < new Date()) {
            return { label: "Expired", color: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
        }
        return { label: "Operational", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
    };

    return (
        <div className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h2 className="text-5xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white">Center Master</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 ml-1">Enterprise Subscription & Node Control</p>
                </div>
                <Button onClick={() => setShowRegModal(true)} className="rounded-2xl h-16 px-10 shadow-3xl shadow-primary/30 font-black text-lg group">
                    <Plus className="mr-3 w-6 h-6 group-hover:rotate-90 transition-transform" /> Onboard New Center
                </Button>
            </div>

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

            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6 group-focus-within:text-primary transition-colors" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search centers by name, location or email..."
                    className="w-full h-18 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] pl-16 pr-8 outline-none font-bold shadow-sm transition-all text-lg focus:ring-4 focus:ring-primary/10"
                />
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Enterprise Network...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    <AnimatePresence mode="popLayout">
                        {filteredCenters.map((center, i) => {
                            const status = checkStatus(center);
                            return (
                                <motion.div
                                    key={center._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 hover:shadow-2xl transition-all group overflow-hidden relative"
                                >
                                    <div className="flex items-start justify-between mb-10">
                                        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                                            <Globe size={40} />
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={cn("px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border", status.color)}>
                                                {status.label === "Operational" ? <ShieldCheck size={14} /> : <AlertCircle size={14} />}
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>

                                    <h3 className="text-3xl font-black mb-2 tracking-tighter uppercase text-slate-900 dark:text-white group-hover:translate-x-1 transition-transform">{center.name}</h3>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-10 uppercase tracking-widest">
                                        <MapPin size={16} className="text-primary" /> {center.address}
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 mb-10 py-8 border-y border-slate-50 dark:border-slate-800">
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 italic flex items-center gap-2">
                                                <CreditCard size={10} /> Subscription Pulse
                                            </p>
                                            <p className="text-sm font-black text-slate-700 dark:text-slate-300">₹{center.subscriptionAmount || 0} / Cycle</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 italic flex items-center gap-2 justify-end">
                                                <Calendar size={10} /> Link Expiry
                                            </p>
                                            <p className="text-sm font-black text-slate-700 dark:text-slate-300 truncate">
                                                {center.expiryDate ? new Date(center.expiryDate).toLocaleDateString() : "NEVER"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            onClick={() => { setSelectedCenter(center); setIsSubModalOpen(true); setActiveTab("settings"); }}
                                            variant="outline"
                                            className="flex-1 rounded-2xl h-14 font-black text-[10px] uppercase tracking-widest hover:border-primary/50"
                                        >
                                            Manage Node
                                        </Button>
                                        <Button variant="outline" className="w-14 h-14 p-0 rounded-2xl flex items-center justify-center bg-red-50/50 hover:bg-red-50 text-red-500 border-red-100 group/del">
                                            <Trash2 size={24} className="group-hover/del:scale-110 transition-transform" />
                                        </Button>
                                    </div>

                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Comprehensive Node Management Modal */}
            <AnimatePresence>
                {isSubModalOpen && selectedCenter && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3.5rem] p-10 shadow-4xl border border-white/20 relative flex flex-col max-h-[90vh]"
                        >
                            <button onClick={() => setIsSubModalOpen(false)} className="absolute top-8 right-8 text-slate-300 hover:text-red-500 transition-all z-10">
                                <X size={32} />
                            </button>

                            <div className="mb-10">
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white mb-2">Node Management</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Target Cluster: {selectedCenter.name}</p>
                            </div>

                            {/* Multi-Tab Switcher */}
                            <div className="flex p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-8 gap-1 overflow-x-auto no-scrollbar">
                                {[
                                    { id: "profile", label: "Profile", icon: <Info size={14} /> },
                                    { id: "credentials", label: "Security", icon: <Key size={14} /> },
                                    { id: "settings", label: "Access", icon: <ShieldCheck size={14} /> },
                                    { id: "new_payment", label: "Payment", icon: <Wallet size={14} /> },
                                    { id: "history", label: "Ledger", icon: <History size={14} /> },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={cn(
                                            "flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                                            activeTab === tab.id ? "bg-primary text-white shadow-xl" : "text-slate-400 hover:bg-white dark:hover:bg-slate-800"
                                        )}
                                    >
                                        {tab.icon} {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                <AnimatePresence mode="wait">
                                    {activeTab === "profile" && (
                                        <motion.form
                                            key="profile"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            onSubmit={handleUpdateCenter}
                                            className="space-y-6"
                                        >
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Center Name</label>
                                                <input name="name" defaultValue={selectedCenter.name} required className="w-full h-16 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 outline-none font-black text-lg shadow-inner" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Contact Pulse (Phone)</label>
                                                    <input name="phone" defaultValue={selectedCenter.phone} required className="w-full h-16 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 outline-none font-black text-lg shadow-inner" />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Clinical Email</label>
                                                    <input name="email" defaultValue={selectedCenter.email} required className="w-full h-16 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 outline-none font-black text-lg shadow-inner" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Physical Location (Address)</label>
                                                <textarea name="address" defaultValue={selectedCenter.address} required className="w-full h-24 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-6 outline-none font-bold text-sm shadow-inner resize-none" />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Enterprise Tagline</label>
                                                <input name="tagline" defaultValue={selectedCenter.tagline} className="w-full h-16 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 outline-none font-black text-lg shadow-inner italic" />
                                            </div>
                                            <Button type="submit" disabled={updating} className="w-full h-18 rounded-3xl font-black text-lg uppercase italic tracking-tighter shadow-2xl shadow-primary/20">
                                                {updating ? <Loader2 className="animate-spin" /> : "Authorize Profile Calibration"}
                                            </Button>
                                        </motion.form>
                                    )}

                                    {activeTab === "credentials" && (
                                        <motion.form
                                            key="credentials"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            onSubmit={handleUpdateCenter}
                                            className="space-y-8"
                                        >
                                            <div className="p-6 bg-amber-500/5 rounded-2xl border border-amber-500/20 flex gap-4 items-start mb-4">
                                                <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                                <p className="text-[10px] font-bold text-amber-500 uppercase leading-relaxed italic">
                                                    CAUTION: You are calibrating master node credentials. Changing these will instantly terminate any active sessions for the center administrator.
                                                </p>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Administrative ID (Email)</label>
                                                <input
                                                    name="userEmail"
                                                    type="email"
                                                    defaultValue={selectedCenter.owner?.email}
                                                    required
                                                    className="w-full h-16 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 outline-none font-black text-lg shadow-inner"
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Set New Master Access Key (Password)</label>
                                                <div className="relative">
                                                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5" />
                                                    <input
                                                        name="password"
                                                        type="password"
                                                        placeholder="Leave blank to keep current"
                                                        className="w-full h-16 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-16 pr-6 outline-none font-black text-lg shadow-inner"
                                                    />
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-400 ml-2 uppercase tracking-tight italic">Key will be automatically encrypted during authorization.</p>
                                            </div>

                                            <Button type="submit" disabled={updating} className="w-full h-18 rounded-3xl font-black text-lg uppercase italic tracking-tighter shadow-2xl shadow-primary/20 bg-primary hover:bg-primary-hover">
                                                {updating ? <Loader2 className="animate-spin" /> : "Re-Authorize Credentials"}
                                            </Button>
                                        </motion.form>
                                    )}

                                    {activeTab === "settings" && (
                                        <motion.form
                                            key="settings"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            onSubmit={handleUpdateCenter}
                                            className="space-y-8"
                                        >
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Subscription Amount (₹)</label>
                                                <input
                                                    name="amount" type="number" required
                                                    defaultValue={selectedCenter.subscriptionAmount}
                                                    className="w-full h-16 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 outline-none font-black text-lg shadow-inner"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Access Expiry Pulse</label>
                                                <input
                                                    name="expiry" type="date" required
                                                    defaultValue={selectedCenter.expiryDate ? new Date(selectedCenter.expiryDate).toISOString().split('T')[0] : ''}
                                                    className="w-full h-16 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 outline-none font-black text-lg shadow-inner"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className="space-y-1">
                                                    <p className="font-black text-sm uppercase italic text-slate-900 dark:text-white">Active Node Status</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manual Override Control</p>
                                                </div>
                                                <input name="isActive" type="checkbox" defaultChecked={selectedCenter.isActive} className="w-8 h-8 rounded-lg accent-primary" />
                                            </div>
                                            <Button type="submit" disabled={updating} className="w-full h-18 rounded-3xl font-black text-lg uppercase italic tracking-tighter shadow-2xl shadow-primary/20">
                                                {updating ? <Loader2 className="animate-spin" /> : "Authorize Config Update"}
                                            </Button>
                                        </motion.form>
                                    )}

                                    {activeTab === "new_payment" && (
                                        <motion.form
                                            key="new_payment"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            onSubmit={handleLogPayment}
                                            className="space-y-6"
                                        >
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Amount Received (₹)</label>
                                                    <input name="amount" type="number" required className="w-full h-16 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 outline-none font-black text-lg shadow-inner" />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Billing Plan</label>
                                                    <select name="plan" className="w-full h-16 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 outline-none font-black text-sm shadow-inner uppercase">
                                                        <option value="Monthly">Monthly Cycle</option>
                                                        <option value="Yearly">Yearly Cycle</option>
                                                        <option value="Custom">Custom Node</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Payment Mode</label>
                                                    <select name="method" className="w-full h-16 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 outline-none font-black text-sm shadow-inner uppercase">
                                                        <option value="Online">Online Transfer</option>
                                                        <option value="Cash">Cash Liquidity</option>
                                                        <option value="Bank Transfer">Direct Bank Pulse</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Next Expiry Link</label>
                                                    <input name="expiry" type="date" required className="w-full h-16 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 outline-none font-black text-lg shadow-inner" />
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Internal Remarks (Details)</label>
                                                <textarea name="remarks" className="w-full h-24 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-6 outline-none font-bold text-sm shadow-inner resize-none" placeholder="e.g. Paid via UPI / GPay Ref #12345" />
                                            </div>
                                            <Button type="submit" disabled={updating} className="w-full h-18 rounded-3xl font-black text-lg uppercase italic tracking-tighter shadow-2xl shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600">
                                                {updating ? <Loader2 className="animate-spin" /> : "Authenticate Revenue Record"}
                                            </Button>
                                        </motion.form>
                                    )}

                                    {activeTab === "history" && (
                                        <motion.div
                                            key="history"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 20 }}
                                            className="space-y-4"
                                        >
                                            {loadingPayments ? (
                                                <div className="h-48 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
                                            ) : payments.length > 0 ? (
                                                payments.map((p, i) => (
                                                    <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 group hover:border-primary/20 transition-all space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-5">
                                                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm group-hover:bg-primary group-hover:text-white transition-all">
                                                                    <Receipt size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-lg text-slate-900 dark:text-white leading-none mb-1 flex items-center gap-2">₹{p.amount} <span className="text-[10px] text-primary">{p.plan}</span></p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{p.method} • {new Date(p.timestamp).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[9px] font-black uppercase text-slate-300 italic mb-1">Link Extension</p>
                                                                <p className="text-xs font-black text-slate-900 dark:text-white">{new Date(p.expiryDate).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                        {p.remarks && (
                                                            <div className="bg-white dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-1 italic flex items-center gap-2">
                                                                    <Star size={10} className="text-primary" /> Record Details
                                                                </p>
                                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                                                    "{p.remarks}"
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="h-48 flex flex-col items-center justify-center text-slate-300 gap-4 grayscale opacity-50">
                                                    <Receipt size={40} />
                                                    <p className="font-black uppercase text-[10px] tracking-widest text-center leading-relaxed">No revenue records found in<br />this cluster's ledger.</p>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
