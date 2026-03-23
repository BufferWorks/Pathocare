"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
    FlaskConical,
    Plus,
    Search,
    MapPin,
    Phone,
    Mail,
    Globe,
    ArrowRight,
    Layers,
    Trash2,
    Edit3,
    ShieldCheck,
    Loader2,
    X,
    Save
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function OutsourcePage() {
    const [labs, setLabs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("labs directory");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingLab, setEditingLab] = useState<any>(null);

    const fetchLabs = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/center/outsource");
            const data = await res.json();
            setLabs(data);
        } catch (err) {
            console.error("Failed to fetch labs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLabs();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch("/api/center/outsource", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                setShowModal(false);
                fetchLabs();
            }
        } catch (err) {
            console.error("Save failed", err);
        }
    };

    const filteredLabs = labs.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.address?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h2 className="text-6xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white">Outsource Networks</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2 ml-1">External Laboratory Integration & Matrix Dispatch</p>
                </div>
                <Button onClick={() => setShowModal(true)} className="rounded-[1.5rem] h-18 px-10 shadow-3xl shadow-primary/30 font-black text-lg bg-primary text-white italic group">
                    <Plus className="mr-3 w-7 h-7 group-hover:rotate-90 transition-transform" /> Integrate New Node
                </Button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-4 p-3 bg-white dark:bg-slate-900 rounded-[2.5rem] w-fit border border-slate-100 dark:border-slate-800 shadow-sm">
                {["Labs Directory", "Pending Dispatch", "External Reports"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                        className={cn(
                            "px-10 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all italic",
                            activeTab === tab.toLowerCase() ? "bg-primary text-white shadow-2xl shadow-primary/30" : "text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-800"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                {/* Search & Intelligence */}
                <div className="lg:col-span-1 space-y-10">
                    <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] space-y-10 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Neural Scan</label>
                            <div className="relative group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors w-6 h-6" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Keyword Matrix..."
                                    className="w-full h-18 bg-slate-50 dark:bg-slate-800 border-none rounded-[1.5rem] pl-16 pr-6 font-bold outline-none text-lg shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Classification Nodes</p>
                            <div className="space-y-3">
                                {["A+ Accredited", "Specialized Genetics", "Histopathology Specialist", "Imaging Centers"].map((cat) => (
                                    <button key={cat} className="w-full text-left px-8 py-5 rounded-[1.2rem] text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-primary/5 hover:text-primary transition-all italic">
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-950 dark:bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden group border border-white/5">
                        <div className="relative z-10">
                            <ShieldCheck className="text-primary w-16 h-16 mb-10 group-hover:scale-110 transition-transform" />
                            <h4 className="font-black text-2xl mb-4 italic tracking-tighter uppercase">Automated Dispatch</h4>
                            <p className="text-white/40 text-sm font-bold leading-relaxed mb-10 italic">Securely transmit biological nodes via encrypted logistics protocols.</p>
                            <button className="text-primary font-black text-xs uppercase tracking-[0.2em] hover:tracking-[0.4em] transition-all flex items-center gap-3 italic">
                                Configure Matrix <ArrowRight size={16} />
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 blur-[80px] rounded-full -mr-24 -mt-24" />
                    </div>
                </div>

                {/* Lab Grid */}
                <div className="lg:col-span-3 grid grid-cols-1 xl:grid-cols-2 gap-10">
                    {loading ? (
                        <div className="col-span-full py-40 text-center space-y-6">
                            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
                            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">Syncing External Provider Lattice...</p>
                        </div>
                    ) : filteredLabs.length > 0 ? filteredLabs.map((lab, i) => (
                        <motion.div
                            key={lab._id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white dark:bg-slate-900 p-10 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-4xl transition-all duration-700 group relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between mb-10">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-700 shadow-inner overflow-hidden relative">
                                    <Globe size={48} />
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="bg-emerald-500/10 text-emerald-500 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-3 border border-emerald-500/10 italic italic">
                                        <ShieldCheck size={14} /> Verified Node
                                    </span>
                                </div>
                            </div>

                            <h3 className="text-3xl font-black mb-3 tracking-tighter uppercase italic text-slate-900 dark:text-white group-hover:translate-x-1 transition-transform">{lab.name}</h3>
                            <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black mb-10 uppercase tracking-[0.2em] italic">
                                <MapPin size={16} className="text-primary" /> {lab.address || "Global Network Node"}
                            </div>

                            <div className="grid grid-cols-2 gap-8 mb-10 py-10 border-y border-slate-50 dark:border-slate-800">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 mb-2 italic">Contact Link</p>
                                    <p className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-tight">{lab.phone}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 mb-2 italic">Neural Cipher</p>
                                    <p className="text-sm font-black text-slate-700 dark:text-slate-200 tracking-tight">LAB-IDX-{lab._id.slice(-6).toUpperCase()}</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button variant="outline" className="flex-1 rounded-2xl h-14 font-black text-[10px] uppercase tracking-[0.2em] border-slate-100 dark:border-slate-800 italic hover:border-primary/30">
                                    Node Rates
                                </Button>
                                <Button className="flex-1 rounded-2xl h-14 font-black text-[10px] uppercase tracking-[0.2em] bg-primary text-white shadow-3xl shadow-primary/20 italic hover:scale-105 active:scale-95 transition-all">
                                    Track Dispatch
                                </Button>
                            </div>
                        </motion.div>
                    )) : (
                        <div className="col-span-full py-40 border-4 border-dashed border-slate-50 dark:border-slate-900 rounded-[5rem] flex flex-col items-center justify-center text-slate-200 gap-8">
                            <Globe size={100} strokeWidth={1} className="opacity-10" />
                            <div className="text-center">
                                <h5 className="text-3xl font-black uppercase tracking-widest italic">External Space Empty</h5>
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] mt-4 opacity-50">Zero outsourced integrations detected in the current sector</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Integration Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-10">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
                            onClick={() => setShowModal(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[4rem] shadow-4xl border border-white/10 overflow-hidden"
                        >
                            <div className="p-12 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20">
                                <div>
                                    <h3 className="text-3xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white">New Hub Integration</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Onboard External Clinical Node</p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="w-14 h-14 rounded-[1.5rem] bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shadow-sm">
                                    <X size={24} />
                                </button>
                            </div>
                            <form onSubmit={handleSave} className="p-12 space-y-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Provider Identity</label>
                                    <input name="name" required placeholder="e.g. Metro Clinical Network..." className="w-full h-18 bg-slate-50 dark:bg-slate-800 rounded-3xl px-8 outline-none font-bold text-lg shadow-inner border-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Contact Protocol</label>
                                        <input name="phone" required placeholder="+91 0000 000000" className="w-full h-18 bg-slate-50 dark:bg-slate-800 rounded-3xl px-8 outline-none font-bold text-lg shadow-inner border-none" />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Email Interface</label>
                                        <input name="email" required placeholder="support@node.com" className="w-full h-18 bg-slate-50 dark:bg-slate-800 rounded-3xl px-8 outline-none font-bold text-lg shadow-inner border-none" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Hub Location Coordinates</label>
                                    <input name="address" required placeholder="Enter full physical address..." className="w-full h-18 bg-slate-50 dark:bg-slate-800 rounded-3xl px-8 outline-none font-bold text-lg shadow-inner border-none" />
                                </div>
                                <div className="pt-6">
                                    <Button type="submit" className="w-full h-20 rounded-[2rem] bg-slate-900 text-white dark:bg-primary text-xl font-black italic uppercase tracking-tighter shadow-3xl shadow-primary/30 group">
                                        <Save className="mr-3 w-7 h-7 group-hover:rotate-12 transition-transform" /> Commit Integration
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
