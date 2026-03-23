"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
    Stethoscope,
    UserPlus,
    Search,
    Phone,
    Mail,
    Award,
    Trash2,
    Edit3,
    Plus,
    Building2,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function DoctorMasterPage() {
    const [doctors, setDoctors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function fetchDoctors() {
            try {
                const res = await fetch("/api/doctors");
                const data = await res.json();
                setDoctors(data);
            } catch (err) {
                console.error("Failed to fetch doctors", err);
            } finally {
                setLoading(false);
            }
        }
        fetchDoctors();
    }, []);

    const filteredDoctors = doctors.filter(doc =>
        doc.name.toLowerCase().includes(search.toLowerCase()) ||
        doc.specialization?.toLowerCase().includes(search.toLowerCase()) ||
        doc.hospital?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h2 className="text-5xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white">Doctor Registry</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 ml-1">Referral Network & Consultant Master Matrix</p>
                </div>
                <Button className="rounded-2xl h-16 px-10 shadow-3xl shadow-primary/30 font-black text-lg group">
                    <Plus className="mr-3 w-6 h-6 group-hover:rotate-90 transition-transform" /> Onboard Consultant
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm flex flex-col md:flex-row gap-6 items-center border border-slate-100 dark:border-slate-800">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6 group-focus-within:text-primary transition-colors" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full h-18 bg-slate-50 dark:bg-slate-800 rounded-[2rem] pl-16 pr-8 outline-none font-bold text-lg focus:ring-4 focus:ring-primary/10 transition-all"
                        placeholder="Search clinicians by name, specialty or hospital..."
                    />
                </div>
                <div className="relative">
                    <select className="h-18 bg-slate-50 dark:bg-slate-800 rounded-[2rem] px-10 outline-none font-bold text-slate-500 appearance-none border border-transparent focus:border-primary/20 cursor-pointer min-w-[280px]">
                        <option>Global Network Filter</option>
                        <option>City Diagnostics Cluster</option>
                        <option>Star Hub Branch</option>
                    </select>
                    <Building2 className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 w-5 h-5 pointer-events-none" />
                </div>
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-6">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Decrypting CRM Nodes...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                    <AnimatePresence>
                        {filteredDoctors.map((doc, i) => (
                            <motion.div
                                key={doc._id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white dark:bg-slate-900 rounded-[4rem] p-10 border border-slate-100 dark:border-slate-800 hover:shadow-2xl transition-all group relative overflow-hidden"
                            >
                                <div className="flex items-start justify-between mb-10">
                                    <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner">
                                        <Stethoscope size={40} />
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all flex items-center justify-center border border-slate-100 dark:border-slate-800">
                                            <Edit3 size={20} />
                                        </button>
                                        <button className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-100 dark:border-red-500/10">
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-3xl font-black mb-1 tracking-tighter uppercase text-slate-900 dark:text-white group-hover:translate-x-1 transition-transform">{doc.name}</h3>
                                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.2em] mb-10 italic">
                                    <Award size={16} />
                                    {doc.specialization || "Senior Consultant"}
                                </div>

                                <div className="space-y-6 py-8 border-y border-slate-50 dark:border-slate-800">
                                    <div className="flex items-center gap-5 text-slate-500 dark:text-slate-400 text-sm font-bold group/info">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover/info:text-primary transition-colors">
                                            <Phone size={18} />
                                        </div>
                                        {doc.phone}
                                    </div>
                                    <div className="flex items-center gap-5 text-slate-500 dark:text-slate-400 text-sm font-bold group/info">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover/info:text-primary transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <span className="truncate">{doc.email}</span>
                                    </div>
                                    <div className="flex items-center gap-5 text-slate-500 dark:text-slate-400 text-sm font-bold group/info">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover/info:text-primary transition-colors">
                                            <Building2 size={18} />
                                        </div>
                                        {doc.hospital || "Independent Cluster"}
                                    </div>
                                </div>

                                <div className="mt-10 flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">Node: {doc._id.slice(-8).toUpperCase()}</span>
                                    <button className="text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:tracking-[0.4em] transition-all flex items-center gap-2">
                                        Intelligence Profile <Plus size={12} />
                                    </button>
                                </div>

                                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredDoctors.length === 0 && (
                        <div className="col-span-full py-32 bg-slate-50 dark:bg-slate-900 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400 gap-8">
                            <div className="w-24 h-24 rounded-full border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-950 shadow-inner">
                                <Stethoscope size={48} className="text-slate-200 dark:text-slate-800" strokeWidth={1} />
                            </div>
                            <div className="text-center">
                                <p className="font-black uppercase tracking-[0.4em] text-sm">No clinicians detected in current matrix</p>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-2">Adjust search parameters or initialize new node</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
