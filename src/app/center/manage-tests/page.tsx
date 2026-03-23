"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
    FlaskConical,
    Search,
    Plus,
    Edit3,
    Trash2,
    DollarSign,
    Tags,
    AlertCircle,
    Loader2,
    X,
    Save,
    Layers,
    ListTree,
    ChevronRight,
    Microscope,
    Box,
    PlusCircle,
    Beaker,
    Zap,
    Globe,
    IndianRupee
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function InvestigationHubPage() {
    const [tests, setTests] = useState<any[]>([]);
    const [packages, setPackages] = useState<any[]>([]);
    const [globalTests, setGlobalTests] = useState<any[]>([]);
    const [globalPackages, setGlobalPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<"Tests" | "Packages">("Tests");
    const [search, setSearch] = useState("");

    // Modal State
    const [showTestModal, setShowTestModal] = useState(false);
    const [showPackageModal, setShowPackageModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const categories = ["All", "Hematology", "Biochemistry", "Serology", "Clinical Pathology", "Microbiology"];

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tRes, pRes, gRes, gpRes] = await Promise.all([
                fetch("/api/center/tests"),
                fetch("/api/center/packages"),
                fetch("/api/tests?global=true"),
                fetch("/api/packages?global=true")
            ]);

            const responses = [tRes, pRes, gRes, gpRes];
            const labels = ["Tests", "Packages", "GlobalTests", "GlobalPackages"];

            for (let i = 0; i < responses.length; i++) {
                if (!responses[i].ok) {
                    const text = await responses[i].text().catch(() => "N/A");
                    console.error(`API Error [${labels[i]}]:`, { status: responses[i].status, body: text.substring(0, 200) });
                }
            }

            const tData = tRes.ok ? await tRes.json() : [];
            const pData = pRes.ok ? await pRes.json() : [];
            const gData = gRes.ok ? await gRes.json() : [];
            const gpData = gpRes.ok ? await gpRes.json() : [];

            setTests(tData);
            setPackages(pData);
            setGlobalTests(gData);
            setGlobalPackages(gpData);
        } catch (err) {
            console.error("Fetch failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Lock body scroll when any modal is open
    useEffect(() => {
        if (showTestModal || showPackageModal || showImportModal) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showTestModal, showPackageModal, showImportModal]);

    const handleImportTemplate = (template: any) => {
        setEditingItem({
            ...template,
            _id: undefined, // Create as new
            price: "", // Force local price entry
        });
        setShowImportModal(false);
        setShowTestModal(true);
    };

    const handleImportPackage = (template: any) => {
        setEditingItem({
            ...template,
            _id: undefined,
            price: "",
            tests: template.tests?.map((t: any) => t._id || t)
        });
        setShowImportModal(false);
        setShowPackageModal(true);
    };

    const handleSaveTest = async (e: any) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data: any = Object.fromEntries(formData.entries());

        // Robust parameter extraction
        const parameters = [];
        const paramNames = formData.getAll("paramName");
        const paramUnits = formData.getAll("paramUnit");
        const paramRanges = formData.getAll("paramRange");

        console.log("SAVE TEST: Param Names found:", paramNames);

        for (let i = 0; i < paramNames.length; i++) {
            const name = paramNames[i]?.toString().trim();
            if (name) {
                parameters.push({
                    name: name,
                    unit: paramUnits[i]?.toString().trim() || "",
                    normalRange: paramRanges[i]?.toString().trim() || ""
                });
            }
        }

        data.parameters = parameters;
        // Remove top-level param inputs to avoid Mongoose schema pollution
        delete data.paramName;
        delete data.paramUnit;
        delete data.paramRange;

        console.log("SAVE TEST: Final Data:", JSON.stringify(data, null, 2));

        try {
            // Check if we are modifying a global template
            const isLocalizingGlobal = editingItem?.isGlobal;
            const method = (editingItem?._id && !isLocalizingGlobal) ? "PUT" : "POST";

            // If localizing global, don't send the _id so the server creates a new local document
            const resBody = (editingItem?._id && !isLocalizingGlobal)
                ? { ...data, _id: editingItem._id }
                : data;

            const res = await fetch("/api/center/tests", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(resBody),
            });
            const result = await res.json();
            if (res.ok) {
                alert("Test Committed Successfully!");
                setShowTestModal(false);
                setEditingItem(null);
                fetchData();
            } else {
                alert("Commit Failed: " + (result.error || "Unknown Error"));
                if (result.error === "Unauthorized") {
                    alert("Your session might be expired. Please log out and back in.");
                }
            }
        } catch (err: any) {
            console.error("SAVE TEST: Catch block error:", err);
            alert("System Error: " + err.message);
        }
    };

    const handleSavePackage = async (e: any) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data: any = Object.fromEntries(formData.entries());

        const selectedTests = formData.getAll("selectedTests");
        data.tests = selectedTests;

        try {
            const isLocalizingGlobal = editingItem?.isGlobal;
            const method = (editingItem?._id && !isLocalizingGlobal) ? "PUT" : "POST";

            const resBody = (editingItem?._id && !isLocalizingGlobal)
                ? { ...data, _id: editingItem._id }
                : data;

            const res = await fetch("/api/center/packages", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(resBody),
            });
            const result = await res.json();
            if (res.ok) {
                alert("Package Synced Successfully!");
                setShowPackageModal(false);
                setEditingItem(null);
                fetchData();
            } else {
                alert("Cluster Sync Failed: " + (result.error || "Unknown Error"));
            }
        } catch (err: any) {
            console.error(err);
            alert("System Error: " + err.message);
        }
    };

    const handleDelete = async (type: "tests" | "packages", id: string, name: string) => {
        const step1 = confirm(`⚠️ [STEP 1/3] WARNING: You are about to PERMANENTLY delete the diagnostic node: "${name.toUpperCase()}". This will remove it from all future bookings. Continue?`);
        if (!step1) return;

        const step2 = confirm(`🚨 [STEP 2/3] CRITICAL: Are you absolutely sure? Any existing reports already using this node will keep their data, but this investigation will no longer be available for new patients.`);
        if (!step2) return;

        const step3 = confirm(`☢️ [STEP 3/3] FINAL PROTOCOL: This action CANNOT be undone. Type 'CONFIRM' to execute removal of "${name}".`);
        // Wait, step3 check
        if (step3) {
            try {
                const res = await fetch(`/api/center/${type}?id=${id}`, { method: "DELETE" });
                if (res.ok) {
                    alert("NODE REMOVED: Inventory matrix updated successfully.");
                    fetchData();
                } else {
                    alert("REMOVAL FAILED: Connection to central repository severed.");
                }
            } catch (err) {
                console.error(err);
                alert("SYSTEM ERROR: Failed to execute termination protocol.");
            }
        } else {
            alert("TERMINATION ABORTED: Inventory integrity maintained.");
        }
    };

    const filteredItems = (Array.isArray(view === "Tests" ? tests : packages) ? (view === "Tests" ? tests : packages) : [])
        .filter(item => item?.name?.toLowerCase().includes(search.toLowerCase())
        );

    return (
        <div className="space-y-12 pb-20">
            {/* Massive Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-10">
                <div className="md:pt-4">
                    <h2 className="text-4xl md:text-5xl xl:text-6xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white leading-none">Investigation Hub</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.5em] text-[10px] mt-4 ml-2 italic flex items-center gap-3">
                        <Microscope size={14} className="text-primary" /> Matrix Inventory & Unit Composition Matrix
                    </p>
                </div>
                
                <div className="flex flex-col gap-6 items-center md:items-end">
                    {/* Network Size Horizontal Display */}
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="flex-1 md:flex-none px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm min-w-[140px]">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 italic">Atomic Tests</p>
                            <h4 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">{tests.length}</h4>
                        </div>
                        <div className="flex-1 md:flex-none px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm min-w-[140px]">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-1 italic">Clusters</p>
                            <h4 className="text-2xl font-black tracking-tighter text-primary">{packages.length}</h4>
                        </div>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-900 p-2 rounded-[2.5rem] border border-slate-200/50 w-full md:w-auto">
                        <button
                            onClick={() => setView("Tests")}
                            className={cn(
                                "flex-1 md:flex-none px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all italic",
                                view === "Tests" ? "bg-white dark:bg-slate-800 shadow-2xl text-primary" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Single Unit Tests
                        </button>
                        <button
                            onClick={() => setView("Packages")}
                            className={cn(
                                "flex-1 md:flex-none px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all italic",
                                view === "Packages" ? "bg-white dark:bg-slate-800 shadow-2xl text-primary" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            Cluster Packages
                        </button>
                    </div>
                </div>
            </div>

            {/* Enterprise Control Board */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
                <div className="xl:col-span-1 space-y-8">
                    <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-white/5">
                        <div className="relative z-10">
                            <Box className="text-primary w-12 h-12 mb-8 group-hover:rotate-12 transition-transform duration-700" />
                            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-2 leading-none">Initialize {view === "Tests" ? "Unit" : "Cluster"}</h3>
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-10 italic">Expand your laboratory's diagnostic reach with custom parameters.</p>
                            
                            <Button
                                onClick={() => {
                                    setEditingItem(null);
                                    if (view === "Tests") setShowTestModal(true);
                                    else setShowPackageModal(true);
                                }}
                                className="w-full h-16 rounded-2xl bg-primary text-white font-black uppercase text-[10px] tracking-[0.2em] italic hover:scale-105 transition-all shadow-4xl shadow-primary/30 group/btn"
                            >
                                <PlusCircle size={18} className="mr-3 group-hover/btn:rotate-90 transition-transform" /> Deploy Node
                            </Button>

                            <button
                                onClick={() => setShowImportModal(true)}
                                className="w-full mt-4 h-14 rounded-2xl border border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all text-[9px] font-black uppercase tracking-widest italic flex items-center justify-center gap-3"
                            >
                                <FlaskConical size={14} className="text-primary" /> Sync Catalog
                            </button>
                        </div>
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 blur-[100px] rounded-full -mr-24 -mt-24" />
                    </div>

                </div>

                <div className="xl:col-span-3 space-y-10">
                    <div className="relative group">
                        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors w-8 h-8" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={`Scan ${view.toLowerCase()} by name, code or category...`}
                            className="w-full h-24 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3.5rem] pl-20 pr-10 outline-none font-bold shadow-xl transition-all text-2xl focus:ring-8 focus:ring-primary/5 italic"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {loading ? (
                            <div className="col-span-full py-40 text-center">
                                <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-8" />
                                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-300 italic">Decrypting Inventory Matrix...</p>
                            </div>
                        ) : filteredItems.length > 0 ? filteredItems.map((item, i) => (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                               transition={{ delay: i * 0.05 }}
                                className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
                            >
                                <div className="flex flex-col items-start gap-3 mb-5 pb-5 border-b border-slate-50 dark:border-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 shrink-0 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-700 shadow-inner">
                                            {view === "Tests" ? <Microscope size={24} /> : <Layers size={24} />}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-lg md:text-xl font-black tracking-tighter uppercase italic leading-tight mb-0.5 truncate group-hover:whitespace-normal transition-all">{item.name}</h4>
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-1.5">
                                                <div className="w-1 h-1 rounded-full bg-primary" /> {view === "Tests" ? item.category : `${item.tests?.length || 0} Unified Nodes`}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-50 dark:bg-slate-800/80 p-2 px-4 rounded-lg border border-slate-100 dark:border-slate-800 shadow-inner">
                                        <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest mb-0.5 italic flex items-center gap-1.5">
                                            <IndianRupee size={8} className="text-primary" /> Active Rate
                                        </p>
                                        <h5 className="text-lg font-black italic tracking-tighter text-primary">₹{item.price}</h5>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4 min-h-[60px] bg-slate-50/50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-50/50 shadow-inner">
                                    <p className="text-[7.5px] font-black uppercase tracking-widest text-slate-400 italic mb-1.5 flex items-center gap-1.5">
                                        <ListTree size={10} /> Composition
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {view === "Tests" ? (
                                            item.parameters?.slice(0, 5).map((p: any) => (
                                                <span key={p.name} className="px-2 py-1 rounded-md bg-white dark:bg-slate-800 text-[8px] font-bold text-slate-500 border border-slate-100 shadow-sm">{p.name}</span>
                                            ))
                                        ) : (
                                            item.tests?.slice(0, 3).map((t: any) => (
                                                <span key={t._id} className="px-2 py-1 rounded-md bg-primary/5 text-[8px] font-black text-primary border border-primary/10 italic">{t.name}</span>
                                            ))
                                        )}
                                        {view === "Tests" ? (item.parameters?.length > 5 && <span className="text-[8px] font-black text-primary italic">+ {item.parameters.length - 5}</span>) : (item.tests?.length > 3 && <span className="text-[8px] font-black text-primary italic">+ {item.tests.length - 3}</span>)}
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setEditingItem(item);
                                            if (view === "Tests") setShowTestModal(true);
                                            else setShowPackageModal(true);
                                        }}
                                        className="flex-1 h-16 rounded-[1.5rem] border-slate-100 hover:border-primary/50 text-[10px] font-black uppercase tracking-widest italic transition-all group/edit"
                                    >
                                        <Edit3 size={18} className="mr-3 group-hover/edit:text-primary transition-colors" /> Modify Node
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleDelete(view === "Tests" ? "tests" : "packages", item._id, item.name)}
                                        className="w-16 h-16 p-0 rounded-[1.5rem] border-slate-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-all group/del"
                                    >
                                        <Trash2 size={24} className="group-hover/del:scale-110 transition-transform" />
                                    </Button>
                                </div>
                                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.div>
                        )) : (
                            <div className="col-span-full py-40 text-center">
                                <Box size={80} className="mx-auto text-slate-100 mb-8" strokeWidth={1} />
                                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300 italic">Investigation Matrix Empty for Selected Node</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Atomic Test Modal */}
            <AnimatePresence>
                {showTestModal && (
                    <div className="fixed inset-0 z-[200] flex justify-center items-start py-10 md:py-20 px-4 md:px-10 bg-slate-950/80 backdrop-blur-2xl overflow-y-auto">
                        <div className="absolute inset-0 z-0" onClick={() => setShowTestModal(false)} />
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[4rem] shadow-4xl border border-white/10 overflow-hidden relative"
                        >
                            <div className="p-16 relative">
                                <div className="flex items-center justify-between mb-16">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                            <Microscope size={36} />
                                        </div>
                                        <div>
                                            <h3 className="text-4xl font-black tracking-tighter italic uppercase underline decoration-primary underline-offset-8 decoration-4">Test Definition Matrix</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3 italic">Define Atomic Units & clinical parameters</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowTestModal(false)} className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm">
                                        <X size={28} />
                                    </button>
                                </div>

                                <form onSubmit={handleSaveTest} className="space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                        <div className="md:col-span-2 space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6 italic">Identity Name</label>
                                            <input name="name" required defaultValue={editingItem?.name} placeholder="e.g. Haemoglobin" className="w-full h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] px-10 outline-none font-bold text-2xl border-none shadow-inner transition-all focus:ring-8 focus:ring-primary/5 italic" />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6 italic">Market Rate (INR)</label>
                                            <input name="price" type="number" required defaultValue={editingItem?.price} placeholder="0.00" className="w-full h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] px-10 outline-none font-black text-2xl border-none shadow-inner transition-all focus:ring-8 focus:ring-primary/5 italic text-primary" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6 italic">Cluster Classification</label>
                                            <select name="category" defaultValue={editingItem?.category || "Hematology"} className="w-full h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] px-10 outline-none font-black text-xl border-none appearance-none cursor-pointer shadow-inner">
                                                {categories.slice(1).map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6 italic">Testing Methodology</label>
                                            <input name="method" defaultValue={editingItem?.method} placeholder="e.g. ELISA, HPLC, Microscopy" className="w-full h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] px-10 outline-none font-bold text-xl border-none shadow-inner transition-all focus:ring-8 focus:ring-primary/5 italic" />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6 italic">Default Clinical Interpretation Template</label>
                                        <textarea name="interpretation" defaultValue={editingItem?.interpretation} placeholder="Enter default interpretation or clinical notes for this investigation..." className="w-full min-h-[120px] bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-10 outline-none font-bold text-lg border-none shadow-inner transition-all focus:ring-8 focus:ring-primary/5 italic" />
                                    </div>

                                    <div className="pt-10 border-t border-slate-50 dark:border-slate-800">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h4 className="text-2xl font-black italic tracking-tighter uppercase leading-none">Parameter Matrix</h4>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">Define constituent clinical units</p>
                                            </div>
                                            <Button type="button" onClick={() => {
                                                const newParams = editingItem?.parameters ? [...editingItem.parameters, { name: "", unit: "", normalRange: "" }] : [{ name: "", unit: "", normalRange: "" }];
                                                setEditingItem({ ...editingItem, parameters: newParams });
                                            }} variant="outline" className="rounded-2xl h-14 border-primary/20 text-primary uppercase text-[10px] font-black tracking-widest italic">
                                                <Plus size={16} className="mr-2" /> Add Component
                                            </Button>
                                        </div>

                                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                                            {(editingItem?.parameters || [{ name: "", unit: "", normalRange: "" }]).map((p: any, idx: number) => (
                                                <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100">
                                                    <input name="paramName" placeholder="Unit Name" defaultValue={p.name} className="bg-white dark:bg-slate-900 rounded-2xl h-14 px-6 outline-none font-bold text-sm shadow-sm" />
                                                    <input name="paramUnit" placeholder="Unit (e.g. g/dL)" defaultValue={p.unit} className="bg-white dark:bg-slate-900 rounded-2xl h-14 px-6 outline-none font-bold text-sm shadow-sm" />
                                                    <input name="paramRange" placeholder="Ref Range" defaultValue={p.normalRange} className="bg-white dark:bg-slate-900 rounded-2xl h-14 px-6 outline-none font-bold text-sm shadow-sm md:col-span-1" />
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

                                    <Button type="submit" className="w-full h-24 rounded-[2.5rem] bg-slate-900 text-white dark:bg-primary text-2xl font-black italic uppercase tracking-tighter mt-12 group relative overflow-hidden active:scale-95 shadow-4xl shadow-primary/30">
                                        <span className="relative z-10 flex items-center gap-4">
                                            Commit Test Definition <ChevronRight className="w-8 h-8 group-hover:translate-x-4 transition-transform" />
                                        </span>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Cluster Package Modal */}
            <AnimatePresence>
                {showPackageModal && (
                    <div className="fixed inset-0 z-[200] flex justify-center items-start py-10 md:py-20 px-4 md:px-10 bg-slate-950/80 backdrop-blur-2xl overflow-y-auto">
                        <div className="absolute inset-0 z-0" onClick={() => setShowPackageModal(false)} />
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
                                            <h3 className="text-4xl font-black tracking-tighter italic uppercase underline decoration-emerald-500 underline-offset-8 decoration-4">Cluster Package Hub</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3 italic">Assemble Multi-Test Diagnostic Profiles</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowPackageModal(false)} className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm">
                                        <X size={28} />
                                    </button>
                                </div>

                                <form onSubmit={handleSavePackage} className="space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                        <div className="md:col-span-2 space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6 italic">Package Name</label>
                                            <input name="name" required defaultValue={editingItem?.name} placeholder="e.g. Master Full Body Profile" className="w-full h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] px-10 outline-none font-bold text-2xl border-none shadow-inner transition-all focus:ring-8 focus:ring-emerald-500/5 italic" />
                                        </div>
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6 italic">Cluster Rate (INR)</label>
                                            <input name="price" type="number" required defaultValue={editingItem?.price} placeholder="0.00" className="w-full h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] px-10 outline-none font-black text-2xl border-none shadow-inner transition-all focus:ring-8 focus:ring-emerald-500/5 italic text-emerald-500" />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6 italic">Select constituent Investigative Nodes</label>
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

                                    <Button type="submit" className="w-full h-24 rounded-[2.5rem] bg-slate-900 text-white dark:bg-emerald-500 text-2xl font-black italic uppercase tracking-tighter mt-12 group relative overflow-hidden active:scale-95 shadow-4xl shadow-emerald-500/30">
                                        <span className="relative z-10 flex items-center gap-4">
                                            Synchronize Cluster Package <ChevronRight className="w-8 h-8 group-hover:translate-x-4 transition-transform" />
                                        </span>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Global Template Library Modal */}
            <AnimatePresence>
                {showImportModal && (
                    <div className="fixed inset-0 z-[200] flex justify-center items-start py-10 md:py-20 px-4 md:px-10 bg-slate-950/80 backdrop-blur-2xl overflow-y-auto">
                        <div className="absolute inset-0 z-0" onClick={() => setShowImportModal(false)} />
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-[4rem] shadow-4xl border border-white/10 overflow-hidden"
                        >
                            <div className="p-12 relative">
                                <div className="flex items-center justify-between mb-12">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                            <Globe size={36} />
                                        </div>
                                        <div>
                                            <h3 className="text-4xl font-black tracking-tighter italic uppercase underline decoration-primary underline-offset-8 decoration-4">Global Matrix Scan</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-3 italic">Browse Standard Investigation Blueprints</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowImportModal(false)} className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-sm">
                                        <X size={28} />
                                    </button>
                                </div>

                                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-6 custom-scrollbar p-2">
                                    {(view === "Tests" ? globalTests : globalPackages).length > 0 ? (view === "Tests" ? globalTests : globalPackages).map((item: any) => (
                                        <div key={item._id} className="flex items-center justify-between p-8 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:border-primary/30 transition-all">
                                            <div className="flex items-center gap-8">
                                                <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-300 group-hover:text-primary transition-colors">
                                                    {view === "Tests" ? <Beaker size={28} /> : <Layers size={28} />}
                                                </div>
                                                <div>
                                                    <p className="font-black uppercase tracking-tight italic text-2xl leading-none mb-1">{item.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{view === "Tests" ? item.category : "Diagnostic Profile"}</span>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">
                                                            {view === "Tests" ? `${item.parameters?.length || 0} Params` : `${item.tests?.length || 0} Unified Nodes`}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    if (view === "Tests") handleImportTemplate(item);
                                                    else handleImportPackage(item);
                                                }}
                                                className="h-16 px-8 rounded-2xl bg-slate-900 text-white dark:bg-primary text-[10px] font-black uppercase tracking-widest italic hover:scale-105 transition-all shadow-xl"
                                            >
                                                Use Template
                                            </Button>
                                        </div>
                                    )) : (
                                        <div className="py-20 text-center text-slate-300">
                                            <Zap size={60} strokeWidth={1} className="mx-auto mb-6 opacity-20" />
                                            <p className="font-black uppercase tracking-widest text-xs italic">Catalog synchronization in progress...</p>
                                        </div>
                                    )}
                                </div>
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
