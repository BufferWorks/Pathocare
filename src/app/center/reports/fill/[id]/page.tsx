"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import {
    FlaskConical,
    User,
    ChevronLeft,
    Save,
    CheckCircle2,
    AlertCircle,
    Printer,
    Loader2,
    Database,
    QrCode,
    Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function FillInvestigationPage() {
    const { id } = useParams();
    const router = useRouter();
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [machineSyncing, setMachineSyncing] = useState(false);
    const [scanOpen, setScanOpen] = useState(false);
    const [scanInput, setScanInput] = useState("");
    
    const reportRef = useRef<any>(null);

    useEffect(() => {
        reportRef.current = report;
    }, [report]);

    const handleScanComplete = (code: string) => {
        setReport((prevValue: any) => ({
            ...prevValue,
            bookingId: { ...prevValue.bookingId, barcode: code }
        }));
        setScanOpen(false);
        setScanInput("");
    };

    const syncFromMachine = async () => {
        const barcode = reportRef.current?.bookingId?.barcode;
        if (!barcode) return;

        setMachineSyncing(true);
        try {
            const res = await fetch(`/api/machine?barcode=${barcode}`);
            const data = await res.json();

            if (Array.isArray(data.results)) {
                setReport((prev: any) => {
                    const newReport = JSON.parse(JSON.stringify(prev));
                    
                    // 🧠 INTELLIGENT SYNC: Map incoming machine results to the correct test containers
                    data.results.forEach((machineTest: any) => {
                        const targetTest = newReport.results.find((t: any) => 
                            (t.testId?._id || t.testId || "").toString() === 
                            (machineTest.testId?._id || machineTest.testId || "").toString()
                        );
                        if (targetTest) {
                            targetTest.parameterResults = machineTest.parameterResults;
                        }
                    });
                    
                    return newReport;
                });
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            console.error("Machine Sync Failed", err);
        } finally {
            setMachineSyncing(false);
        }
    };

    useEffect(() => {
        async function fetchReport() {
            try {
                const res = await fetch(`/api/reports/${id}`);
                const data = await res.json();
                setReport(data);
                reportRef.current = data;
                if (data?.bookingId?.barcode) {
                    setTimeout(() => syncFromMachine(), 1000);
                }
            } catch (err) {
                console.error("Fetch report failed", err);
            } finally {
                setLoading(false);
            }
        }
        fetchReport();
    }, [id]);

    const handleValueChange = (testIdx: number, paramIdx: number, val: string) => {
        setReport((prevValue: any) => {
            const next = JSON.parse(JSON.stringify(prevValue));
            next.results[testIdx].parameterResults[paramIdx].value = val;
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const currentReport = reportRef.current;
            const res = await fetch(`/api/reports/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    results: currentReport.results,
                    barcode: currentReport.bookingId.barcode,
                    sampleType: currentReport.bookingId.sampleType,
                    clientCode: currentReport.bookingId.clientCode,
                    sampleDrawnAt: currentReport.bookingId.sampleDrawnAt,
                    collectedAt: currentReport.bookingId.collectedAt
                }),
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (err) {
            console.error("Save failed", err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-14 h-14 text-primary animate-spin" />
                <p className="font-black uppercase tracking-[0.4em] text-slate-300 text-[10px]">Neural Data Ingest...</p>
            </div>
        );
    }

    const patient = report?.bookingId || {};

    // 🧪 THE VANISHING FILTER: Strictly hide any element without real clinical data
    const isValValid = (v: any) => v && v !== "" && v !== "---" && v !== "null";
    
    const visibleTests = report?.results?.filter((test: any) => 
        test.parameterResults?.some((p: any) => isValValid(p.value))
    ) || [];

    return (
        <div className="space-y-8 md:space-y-12 pb-20 px-4 md:px-0">
            {/* Header Matrix */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 md:gap-8 bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-4 md:gap-8">
                    <button onClick={() => router.back()} className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-inner group shrink-0">
                        <ChevronLeft size={24} className="md:w-8 md:h-8 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="min-w-0">
                        <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase text-slate-900 dark:text-white leading-none truncate">Investigation Matrix</h2>
                        <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-slate-400 mt-2 flex items-center gap-2 italic">
                            <Database size={10} className="text-primary md:w-3 md:h-3" /> Trace ID: {id ? String(id).slice(-8).toUpperCase() : "..."}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 relative z-10">
                    <div className="flex flex-col gap-2">
                        <Button
                            onClick={syncFromMachine}
                            disabled={machineSyncing || !report?.bookingId?.barcode}
                            className={cn(
                                "w-full md:w-auto rounded-[1.2rem] md:rounded-[1.5rem] h-14 md:h-18 px-6 md:px-10 font-black uppercase text-[10px] md:text-xs tracking-widest italic flex items-center gap-3 transition-all active:scale-95 group shadow-2xl",
                                report?.bookingId?.barcode ? "bg-slate-950 text-white border border-white/10 hover:bg-primary shadow-emerald-500/10" : "bg-slate-100 text-slate-300 pointer-events-none grayscale"
                            )}
                        >
                            {machineSyncing ? <Loader2 className="animate-spin" /> : <Zap size={18} className={cn(report?.bookingId?.barcode ? "text-primary group-hover:text-white" : "text-slate-200")} />}
                            {machineSyncing ? "Syncing All Nodes..." : "Sync from Multi-Machine Hub"}
                        </Button>
                        {report?.bookingId?.barcode && (
                            <p className="text-[7px] font-black uppercase tracking-[0.2em] text-center text-primary italic animate-pulse">4 Nodes Online: HEM • BIO • CLIA • ELEC</p>
                        )}
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full md:w-auto rounded-[1.2rem] md:rounded-[1.5rem] h-14 md:h-18 px-8 md:px-12 shadow-2xl shadow-primary/20 font-black uppercase text-[10px] md:text-xs tracking-[0.15em] md:tracking-[0.2em] bg-primary text-white italic group"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin md:w-6 md:h-6" /> : <Save className="mr-2 md:mr-3 w-5 h-5 md:w-6 md:h-6 group-hover:rotate-12 transition-transform" />}
                        Save Result Nodes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
                {/* Patient Information */}
                <div className="lg:col-span-1 space-y-8 md:space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-950 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-12 text-white relative overflow-hidden shadow-4xl group border border-white/5"
                    >
                        <div className="relative z-10">
                            <div className="w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2.5rem] bg-white/10 backdrop-blur-3xl flex items-center justify-center mb-6 md:mb-10 group-hover:scale-110 transition-transform shrink-0">
                                <User size={32} className="md:w-[48px] md:h-[48px] text-primary" />
                            </div>
                            <h3 className="text-2xl md:text-4xl font-black mb-2 tracking-tighter uppercase italic leading-none truncate">{patient.patientName}</h3>
                            <p className="text-white/40 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[8px] md:text-[10px] mb-8 md:mb-12 italic">{patient.age}Y • {patient.gender} Cluster</p>

                            <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-2xl space-y-3">
                                <p className="text-[7px] font-black uppercase tracking-widest text-primary italic">Specimen Identifier</p>
                                <div className="relative group/barcode">
                                    <input
                                        value={report?.bookingId?.barcode || ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setReport((prev: any) => ({
                                                ...prev,
                                                bookingId: { ...prev.bookingId, barcode: val }
                                            }));
                                        }}
                                        placeholder="ASSIGN BARCODE..."
                                        className="w-full bg-transparent border-none outline-none text-lg font-black tracking-tighter italic text-white placeholder:text-white/10 focus:ring-0 p-0"
                                    />
                                    <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/10 group-focus-within/barcode:bg-primary transition-colors" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-48 md:w-80 h-48 md:h-80 bg-primary/10 rounded-full -mr-24 md:-mr-40 -mt-24 md:-mt-40 blur-[80px] md:blur-[120px]" />
                    </motion.div>

                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className="bg-emerald-500 rounded-[2rem] md:rounded-[3.5rem] p-8 md:p-12 flex flex-col items-center text-center text-white shadow-3xl shadow-emerald-500/30"
                            >
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center mb-4 md:mb-6 shadow-2xl shrink-0">
                                    <CheckCircle2 size={32} />
                                </div>
                                <h4 className="font-black text-xl mb-2 tracking-tighter uppercase italic">Nodes Syncing!</h4>
                                <p className="text-white/80 text-[10px] font-bold mb-8 uppercase tracking-wider italic">Matrix Data Propagation Successful.</p>
                                <Link href={`/center/reports/${id}`} className="w-full">
                                    <Button variant="outline" className="w-full border-white/20 bg-white/10 hover:bg-white/20 text-white rounded-xl h-14 font-black uppercase text-[10px] tracking-widest italic">
                                        <Printer size={18} className="mr-2" /> View Report
                                    </Button>
                                </Link>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Technical Entry Grid */}
                <div className="lg:col-span-2 space-y-8 md:space-y-12">
                    {visibleTests.length > 0 ? visibleTests.map((test: any, testIdx: number) => (
                        <div key={testIdx} className="bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-12 border border-slate-100 dark:border-slate-800 shadow-sm space-y-8 md:space-y-12 group/test hover:border-primary/20 transition-all duration-700">
                            <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter italic flex items-center gap-4 md:gap-6 text-slate-900 dark:text-white leading-none">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover/test:bg-primary group-hover/test:text-white transition-all duration-700 shrink-0">
                                    <FlaskConical size={20} />
                                </div>
                                <span className="truncate">{test.testId?.name || "Investigation Group"}</span>
                            </h3>

                            <div className="space-y-6 md:space-y-8">
                                <div className="hidden md:grid grid-cols-12 gap-8 px-10 py-5 bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 italic">
                                    <div className="col-span-1">Seq.</div>
                                    <div className="col-span-4">Investigation Component</div>
                                    <div className="col-span-2 text-center">Observed Result</div>
                                    <div className="col-span-2 text-center">Status</div>
                                    <div className="col-span-3 text-right">Standard Range</div>
                                </div>

                                {test.parameterResults.filter((p: any) => isValValid(p.value)).map((res: any, paramIdx: number) => (
                                    <motion.div
                                        key={paramIdx}
                                        whileHover={{ x: 5 }}
                                        className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-center px-4 md:px-10 group/row border-b md:border-b-0 border-slate-50 dark:border-slate-800 pb-6 md:pb-0"
                                    >
                                        <div className="hidden md:block col-span-1 font-black text-slate-200 group-hover/row:text-primary transition-colors italic">0{paramIdx + 1}</div>
                                        <div className="col-span-1 md:col-span-4">
                                            <p className="font-black text-base md:text-lg text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none">{res.name}</p>
                                            <p className="text-[8px] md:text-[9px] font-black text-slate-400 italic uppercase mt-1">Metric: {res.unit || "N/A"}</p>
                                        </div>
                                        <div className="col-span-1 md:col-span-2 flex justify-center mt-2 md:mt-0 px-2">
                                            <div className={cn(
                                                "w-full min-h-[4rem] bg-slate-50 dark:bg-slate-950 border-2 border-transparent rounded-xl md:rounded-[1.2rem] flex items-center p-4 shadow-inner italic font-black text-slate-900 dark:text-white leading-tight transition-all",
                                                res.value?.length > 10 ? "text-[10px] md:text-xs text-left" : "text-xl md:text-2xl justify-center"
                                            )}>
                                                {res.value}
                                            </div>
                                        </div>
                                        <div className="col-span-1 md:col-span-2 flex justify-center mt-2 md:mt-0">
                                            <span className={cn(
                                                "px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest italic border",
                                                res.status === "HIGH" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                                                res.status === "LOW" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                                "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            )}>
                                                {res.status || "NORMAL"}
                                            </span>
                                        </div>
                                        <div className="col-span-1 md:col-span-3 text-left md:text-right mt-2 md:mt-0">
                                            <span className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic border border-slate-50 dark:border-slate-700/50">
                                                {res.normalRange}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[4rem] p-16 md:p-24 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center gap-6">
                            <AlertCircle size={48} className="text-slate-200" />
                            <div>
                                <h4 className="text-xl md:text-2xl font-black uppercase italic tracking-tighter text-slate-300">Waitng for machine transmission...</h4>
                                <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mt-2 italic px-4">Matrix is blank. Connection active. Awaiting forensic results.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
