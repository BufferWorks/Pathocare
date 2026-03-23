"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FlaskConical, Plus, Search, Edit3, Trash2, Tag, Loader2, Beaker, Layers, Zap, ChevronRight, X, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalTestsPage() {
    const [tests, setTests] = useState<any[]>([]);
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"Tests" | "Packages">("Tests");
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [showPkgModal, setShowPkgModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    const categories = ["Hematology", "Biochemistry", "Serology", "Clinical Pathology", "Microbiology"];

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [tRes, pRes] = await Promise.all([
                fetch("/api/tests?global=true"),
                fetch("/api/packages?global=true")
            ]);

            if (!tRes.ok || !pRes.ok) {
                const tErr = !tRes.ok ? await tRes.text().catch(() => "N/A") : null;
                const pErr = !pRes.ok ? await pRes.text().catch(() => "N/A") : null;
                console.error("API Error Response:", { tStatus: tRes.status, tErr, pStatus: pRes.status, pErr });
                // Don't throw, just log and keep arrays empty to prevent crash
                setTests([]);
                setPackages([]);
                return;
            }

            const tData = await tRes.json();
            const pData = await pRes.json();

            setTests(Array.isArray(tData) ? tData : []);
            setPackages(Array.isArray(pData) ? pData : []);
        } catch (err) {
            console.error("Failed to fetch data", err);
            setTests([]);
            setPackages([]);
        } finally {
            setLoading(false);
        }
    }

    const handleSaveTest = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        const formData = new FormData(e.target);
        const data: any = Object.fromEntries(formData.entries());

        const parameters = [];
        const paramNames = formData.getAll("paramName");
        const paramUnits = formData.getAll("paramUnit");
        const paramRanges = formData.getAll("paramRange");

        for (let i = 0; i < paramNames.length; i++) {
            const name = paramNames[i]?.toString().trim();
            if (name) {
                parameters.push({
                    name,
                    unit: paramUnits[i]?.toString().trim() || "",
                    normalRange: paramRanges[i]?.toString().trim() || ""
                });
            }
        }
        data.parameters = parameters;
        delete data.paramName;
        delete data.paramUnit;
        delete data.paramRange;

        try {
            const method = editingItem?._id ? "PUT" : "POST";
            const res = await fetch("/api/tests", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingItem?._id ? { ...data, _id: editingItem._id } : data),
            });
            if (res.ok) {
                setShowModal(false);
                setEditingItem(null);
                fetchData();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleSavePackage = async (e: any) => {
        e.preventDefault();
        setSaving(true);
        const formData = new FormData(e.target);
        const data: any = Object.fromEntries(formData.entries());
        const selectedTests = formData.getAll("selectedTests");
        data.tests = selectedTests;

        try {
            const method = editingItem?._id ? "PUT" : "POST";
            const res = await fetch("/api/packages", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingItem?._id ? { ...data, _id: editingItem._id } : data),
            });
            if (res.ok) {
                setShowPkgModal(false);
                setEditingItem(null);
                fetchData();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, type: "tests" | "packages") => {
        if (!confirm(`Delete this global ${type.slice(0, -1)}?`)) return;
        try {
            const res = await fetch(`/api/${type}?id=${id}`, { method: "DELETE" });
            if (res.ok) fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const filteredItems = (view === "Tests" ? tests : packages).filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.category && t.category.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h2 className="text-5xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white">Global Catalog</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] mt-2 ml-1">Universal Investigation Templates & Matrix</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setView("Tests")}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "Tests" ? "bg-white dark:bg-slate-900 text-primary shadow-sm" : "text-slate-400"}`}
                        >
                            Tests
                        </button>
                        <button
                            onClick={() => setView("Packages")}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "Packages" ? "bg-white dark:bg-slate-900 text-primary shadow-sm" : "text-slate-400"}`}
                        >
                            Packages
                        </button>
                    </div>
                    <Button
                        onClick={() => {
                            setEditingItem(null);
                            if (view === "Tests") setShowModal(true);
                            else setShowPkgModal(true);
                        }}
                        className="rounded-2xl h-14 px-8 shadow-3xl shadow-primary/40 font-black text-xs uppercase tracking-widest group"
                    >
                        <Plus className="mr-3 w-5 h-5 group-hover:rotate-90 transition-transform" /> Define {view === "Tests" ? "Template" : "Cluster"}
                    </Button>
                </div>
            </div>

            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 w-6 h-6 group-focus-within:text-primary transition-all pr-5 border-r border-slate-100 dark:border-slate-800 box-content" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Lookup investigation by name, CPT code or category..."
                    className="w-full h-18 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] pl-20 pr-8 outline-none font-bold shadow-sm transition-all text-lg focus:ring-4 focus:ring-primary/10"
                />
            </div>

            {loading ? (
                <div className="h-64 flex flex-col items-center justify-center gap-6">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Synchronizing Global Catalog...</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-900 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950/50">
                                    <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{view === "Tests" ? "Template Logic" : "Cluster Profile"}</th>
                                    <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Classification</th>
                                    <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{view === "Tests" ? "Constituent Units" : "Unified Nodes"}</th>
                                    <th className="px-12 py-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-right italic">Sync Nodes</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                <AnimatePresence>
                                    {filteredItems.map((item, i) => (
                                        <motion.tr
                                            key={item._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="group hover:bg-primary/5 transition-all cursor-default"
                                        >
                                            <td className="px-12 py-8">
                                                <div className="flex items-center gap-8">
                                                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-inner overflow-hidden relative">
                                                        {view === "Tests" ? <Beaker size={28} className="relative z-10" /> : <Layers size={28} className="relative z-10" />}
                                                        <div className="absolute top-0 left-0 w-full h-full bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-2xl tracking-tighter text-slate-900 dark:text-white uppercase group-hover:translate-x-1 transition-transform">{item.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">CODE: {item.code || (view === "Tests" ? "T-X" : "P-X")}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-8">
                                                <span className="px-6 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                    {view === "Tests" ? item.category : "Diagnostic Profile"}
                                                </span>
                                            </td>
                                            <td className="px-12 py-8">
                                                <div className="flex flex-wrap gap-2 max-w-xs">
                                                    {view === "Tests" ? (
                                                        item.parameters?.slice(0, 3).map((p: any) => (
                                                            <span key={p.name} className="px-3 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 text-[9px] font-bold text-slate-400 border border-slate-100 dark:border-slate-800">
                                                                {p.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        item.tests?.slice(0, 2).map((t: any) => (
                                                            <span key={t._id} className="px-3 py-1 rounded-lg bg-primary/5 text-[9px] font-black text-primary border border-primary/10 uppercase italic">
                                                                {t.name}
                                                            </span>
                                                        ))
                                                    )}
                                                    {view === "Tests" ? (
                                                        item.parameters?.length > 3 && (
                                                            <span className="text-[9px] font-black text-primary italic">+{item.parameters.length - 3} More</span>
                                                        )
                                                    ) : (
                                                        item.tests?.length > 2 && (
                                                            <span className="text-[9px] font-black text-primary italic">+{item.tests.length - 2} More</span>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-12 py-8 text-right">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-300">
                                                    <Button onClick={() => {
                                                        setEditingItem(item);
                                                        if (view === "Tests") setShowModal(true);
                                                        else setShowPkgModal(true);
                                                    }} variant="outline" className="w-12 h-12 p-0 rounded-xl hover:bg-primary hover:text-white transition-all">
                                                        <Edit3 size={18} />
                                                    </Button>
                                                    <Button onClick={() => handleDelete(item._id, view === "Tests" ? "tests" : "packages")} variant="outline" className="w-12 h-12 p-0 rounded-xl bg-red-50 hover:bg-red-500 hover:text-white text-red-500 border-red-100 transition-all group/del">
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 text-slate-300">
                                                <FlaskConical size={80} strokeWidth={1} className="animate-pulse" />
                                                <p className="font-black uppercase tracking-[0.4em] text-[10px]">No {view.toLowerCase()} matching your query</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-8 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-900 flex items-center justify-between">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Total Catalog Nodes: {filteredItems.length}</p>
                        <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                            <Zap size={14} /> Matrix Integrity Verified
                        </div>
                    </div>
                </div>
            )}

            {/* Template Architect Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-10 bg-slate-950/80 backdrop-blur-2xl overflow-y-auto">
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[4rem] shadow-4xl border border-white/10 overflow-hidden relative"
                        >
                            <div className="p-16 relative">
                                <div className="flex items-center justify-between mb-16">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                            <Beaker size={36} />
                                        </div>
                                        <div>
                                            <h3 className="text-4xl font-black tracking-tighter italic uppercase underline decoration-primary underline-offset-8 decoration-4">Template Architect</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3 italic">Design clinical blueprints for all network nodes</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowModal(false)} className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm">
                                        <Plus className="rotate-45" size={28} />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveTest} className="space-y-12">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6 italic">Template Identity (Investigation Name)</label>
                                        <input name="name" required defaultValue={editingItem?.name} placeholder="e.g. Complete Blood Count" className="w-full h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] px-10 outline-none font-bold text-2xl border-none shadow-inner transition-all focus:ring-8 focus:ring-primary/5 italic" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6 italic">Internal System Code</label>
                                            <input name="code" defaultValue={editingItem?.code} placeholder="e.g. CBC-001" className="w-full h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] px-10 outline-none font-bold text-xl border-none shadow-inner transition-all focus:ring-8 focus:ring-primary/5" />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6 italic">Diagnostic Classification</label>
                                            <select name="category" defaultValue={editingItem?.category || "Hematology"} className="w-full h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] px-10 outline-none font-black text-xl border-none appearance-none cursor-pointer shadow-inner">
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-10 border-t border-slate-50 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none text-slate-900 dark:text-white">Constituent Parameter Matrix</h4>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Define the clinical output units for this template</p>
                                            </div>
                                            <Button type="button" onClick={() => {
                                                const newParams = editingItem?.parameters ? [...editingItem.parameters, { name: "", unit: "", normalRange: "" }] : [{ name: "", unit: "", normalRange: "" }];
                                                setEditingItem({ ...editingItem, parameters: newParams });
                                            }} variant="outline" className="rounded-2xl h-14 border-primary/20 text-primary uppercase text-[10px] font-black tracking-widest italic">
                                                <Plus size={16} className="mr-2" /> Insert Component
                                            </Button>
                                        </div>

                                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                                            {(editingItem?.parameters || [{ name: "", unit: "", normalRange: "" }]).map((p: any, idx: number) => (
                                                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100">
                                                    <input name="paramName" placeholder="Unit Name" defaultValue={p.name} className="bg-white dark:bg-slate-900 rounded-2xl h-14 px-6 outline-none font-bold text-sm shadow-sm" />
                                                    <input name="paramUnit" placeholder="Unit (e.g. g/dL)" defaultValue={p.unit} className="bg-white dark:bg-slate-900 rounded-2xl h-14 px-6 outline-none font-bold text-sm shadow-sm" />
                                                    <input name="paramRange" placeholder="Default Normal Range" defaultValue={p.normalRange} className="bg-white dark:bg-slate-900 rounded-2xl h-14 px-6 outline-none font-bold text-sm shadow-sm md:col-span-1" />
                                                    <Button type="button" variant="outline" onClick={() => {
                                                        const pCopy = [...editingItem.parameters];
                                                        pCopy.splice(idx, 1);
                                                        setEditingItem({ ...editingItem, parameters: pCopy });
                                                    }} className="h-14 rounded-2xl text-red-500 border-red-50">
                                                        <Trash2 size={18} />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Button type="submit" disabled={saving} className="w-full h-24 rounded-[2.5rem] bg-slate-900 text-white dark:bg-primary text-2xl font-black italic uppercase tracking-tighter mt-12 group relative overflow-hidden active:scale-95 shadow-4xl shadow-primary/30">
                                        <span className="relative z-10 flex items-center gap-4">
                                            {saving ? "Deploying Template..." : "Authorize Template Deployment"} <ChevronRight className="w-8 h-8 group-hover:translate-x-4 transition-transform" />
                                        </span>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Cluster Package Architect Modal */}
            <AnimatePresence>
                {showPkgModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-10 bg-slate-950/80 backdrop-blur-2xl">
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[4rem] shadow-4xl border border-white/10 overflow-hidden"
                        >
                            <div className="p-16 relative">
                                <div className="flex items-center justify-between mb-16">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                                            <Layers size={36} />
                                        </div>
                                        <div>
                                            <h3 className="text-4xl font-black tracking-tighter italic uppercase underline decoration-emerald-500 underline-offset-8 decoration-4">Cluster Architect</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3 italic">Assemble Multi-Test Diagnostic Profiles</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowPkgModal(false)} className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm">
                                        <X size={28} />
                                    </button>
                                </div>

                                <form onSubmit={handleSavePackage} className="space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6 italic">Package Name</label>
                                            <input name="name" required defaultValue={editingItem?.name} placeholder="e.g. Health Check Lite" className="w-full h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] px-10 outline-none font-bold text-2xl border-none shadow-inner transition-all focus:ring-8 focus:ring-emerald-500/5 italic" />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6 italic">System Profile Code</label>
                                            <input name="code" defaultValue={editingItem?.code} placeholder="e.g. PKG-001" className="w-full h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] px-10 outline-none font-black text-2xl border-none shadow-inner transition-all focus:ring-8 focus:ring-emerald-500/5 italic" />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6 italic">Select Constituent Templates</label>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-6 custom-scrollbar p-2">
                                            {tests.map(test => (
                                                <label key={test._id} className="flex items-center gap-6 p-6 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 cursor-pointer hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all group">
                                                    <input
                                                        type="checkbox"
                                                        name="selectedTests"
                                                        value={test._id}
                                                        defaultChecked={editingItem?.tests?.some((t: any) => t._id === test._id || t === test._id)}
                                                        className="w-8 h-8 rounded-xl border-2 border-slate-200 checked:bg-emerald-500 checked:border-emerald-500 transition-all outline-none"
                                                    />
                                                    <div>
                                                        <p className="font-black uppercase tracking-tight italic text-lg leading-none">{test.name}</p>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{test.category}</p>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <Button type="submit" disabled={saving} className="w-full h-24 rounded-[2.5rem] bg-slate-900 text-white dark:bg-emerald-500 text-2xl font-black italic uppercase tracking-tighter mt-12 group relative overflow-hidden active:scale-95 shadow-4xl shadow-emerald-500/30">
                                        <span className="relative z-10 flex items-center gap-4">
                                            {saving ? "Deploying Cluster..." : "Authorize Cluster Deployment"} <ChevronRight className="w-8 h-8 group-hover:translate-x-4 transition-transform" />
                                        </span>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .dark .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #1e293b;
                }
            `}</style>
        </div>
    );
}
