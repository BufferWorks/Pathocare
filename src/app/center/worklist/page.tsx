"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
    Printer,
    Search,
    Clock,
    AlertCircle,
    User,
    FlaskConical,
    RotateCw,
    Eye,
    ChevronRight,
    ClipboardList,
    CheckCircle2,
    Loader2,
    History,
    ShieldCheck,
    QrCode,
    Zap,
    Share2,
    Pencil,
    X,
    Download
} from "lucide-react";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function WorklistPage() {
    const router = useRouter();
    const { data: session } = useSession() as any;
    const [bookings, setWorklist] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [paymentFilter, setPaymentFilter] = useState("all");
    const [deliveryFilter, setDeliveryFilter] = useState("all");
    const [urgentOnly, setUrgentOnly] = useState(false);
    const [paymentModeFilter, setPaymentModeFilter] = useState("all");
    const [panelFilter, setPanelFilter] = useState("all");
    const [sampleFilter, setSampleFilter] = useState("all");
    const [checkedFilter, setCheckedFilter] = useState("all");
    const [publishedFilter, setPublishedFilter] = useState("all");
    const [deliveredFilter, setDeliveredFilter] = useState("all");

    // Metadata for filters
    const [panels, setPanels] = useState<any[]>([]);

    // Audit Log State
    const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [editingBooking, setEditingBooking] = useState<any>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [printingBarcode, setPrintingBarcode] = useState<any>(null);

    const generateCode39 = (data: string) => {
        const patterns: any = {
            '0': '111221211', '1': '211211112', '2': '112211112', '3': '212211111',
            '4': '111221112', '5': '211221111', '6': '112221111', '7': '111211212',
            '8': '211211211', '9': '112211211', 'A': '211112112', 'B': '112112112',
            'C': '212112111', 'D': '111122112', 'E': '211122111', 'F': '112122111',
            'G': '111112212', 'H': '211112211', 'I': '112112211', 'J': '111122211',
            'K': '211111122', 'L': '112111122', 'M': '212111121', 'N': '111121122',
            'O': '211121121', 'P': '112121121', 'Q': '111111222', 'R': '211111221',
            'S': '112111221', 'T': '111121221', 'U': '221111112', 'V': '122111112',
            'W': '222111111', 'X': '121121112', 'Y': '221121111', 'Z': '122121111',
            '-': '121111212', '.': '221111211', ' ': '122111211', '*': '121121211'
        };
        const fullText = `*${(data || "LAB").toUpperCase()}*`;
        let x = 0;
        const narrow = 2;
        const wide = 5;

        return fullText.split('').map((char, charIdx) => {
            const pattern = patterns[char] || patterns['-'];
            const bars = pattern.split('').map((p: string, i: number) => {
                const isBar = i % 2 === 0;
                const width = p === '1' ? narrow : wide;
                const currentX = x;
                x += width;
                return isBar ? <rect key={`${charIdx}-${i}`} x={currentX} y="0" width={width} height="60" /> : null;
            });
            x += narrow;
            return <g key={charIdx}>{bars}</g>;
        });
    };

    const handleDownloadBarcode = async () => {
        const element = document.getElementById("barcode-download-area");
        if (!element) return;
        try {
            const canvas = await html2canvas(element, { scale: 3, backgroundColor: "#ffffff" });
            const link = document.createElement("a");
            link.download = `barcode-${printingBarcode.patientName}-${printingBarcode.barcode}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (err) {
            console.error("Download failed", err);
        }
    };

    const fetchAuditLogs = async (targetId: string) => {
        try {
            setAuditLoading(true);
            const res = await fetch(`/api/center/audit-logs?targetId=${targetId}`);
            if (res.ok) {
                const data = await res.json();
                setAuditLogs(data);
            }
        } catch (err) {
            console.error("Failed to fetch audit logs", err);
        } finally {
            setAuditLoading(false);
        }
    };

    useEffect(() => {
        if (selectedAuditId) {
            fetchAuditLogs(selectedAuditId);
        } else {
            setAuditLogs([]);
        }
    }, [selectedAuditId]);

    const handlePrint = () => {
        window.print();
    };

    const handlePrintBarcode = () => {
        window.print();
    };

    const fetchWorklist = async () => {
        try {
            if (!session?.user?.centerId) return;
            setLoading(true);
            const res = await fetch(`/api/bookings?centerId=${session.user.centerId}&from=${dateFrom}&to=${dateTo}`);
            if (res.ok) {
                const data = await res.json();
                setWorklist(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error("Failed to fetch worklist", err);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkPublish = async () => {
        if (selectedIds.length === 0) return;
        alert(`Initializing Bulk Protocol: Publishing ${selectedIds.length} clinical nodes.`);
        // Implementation for bulk API update would go here
    };

    const fetchPanels = async () => {
        try {
            if (!session?.user?.centerId) return;
            const res = await fetch(`/api/center/panels?centerId=${session.user.centerId}`);
            if (res.ok) {
                const data = await res.json();
                setPanels(data);
            }
        } catch (err) {
            console.error("Failed to fetch panels", err);
        }
    };

    useEffect(() => {
        if (session) {
            fetchWorklist();
            fetchPanels();
        }
    }, [session]);

    const statusMap: any = {
        "Collected": { icon: <Clock size={16} />, color: "bg-blue-500/10 text-blue-500 border-blue-500/20", label: "Sample Collected" },
        "Process": { icon: <RotateCw size={16} className="animate-spin" />, color: "bg-orange-500/10 text-orange-500 border-orange-500/20", label: "In Process" },
        "Completed": { icon: <CheckCircle2 size={16} />, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", label: "Validated Report" },
        "Pending": { icon: <AlertCircle size={16} />, color: "bg-red-500/10 text-red-500 border-red-500/20", label: "Awaiting Sample" },
        "Cancelled": { icon: <AlertCircle size={16} />, color: "bg-slate-500/10 text-slate-500 border-slate-500/20", label: "Cancelled Entry" },
    };

    const filteredWorklist = Array.isArray(bookings) ? bookings.filter(b => {
        const searchLower = (search || "").toLowerCase().trim();
        const filterLower = (filter || "all").toLowerCase();

        const matchesStatus = filterLower === "all" || (b.status || "").toLowerCase() === filterLower;
        const matchesPayment = paymentFilter === "all" || (b.paymentStatus || "").toLowerCase() === paymentFilter.toLowerCase();
        const matchesDelivery = deliveryFilter === "all" || (b.deliveryMode || "").toLowerCase() === deliveryFilter.toLowerCase();
        const matchesUrgent = !urgentOnly || b.isUrgent === true;
        const matchesPayMode = paymentModeFilter === "all" || (b.paymentMode || "").toLowerCase() === paymentModeFilter.toLowerCase();
        const matchesPanel = panelFilter === "all" || (b.panelId?._id || b.panelId) === panelFilter;

        const matchesSample = sampleFilter === "all" ||
            (sampleFilter === "collected" && b.status !== "Pending") ||
            (sampleFilter === "pending" && b.status === "Pending");

        const matchesChecked = checkedFilter === "all" || (b.isChecked ? "yes" : "no") === checkedFilter;
        const matchesPublished = publishedFilter === "all" || (b.isPublished ? "yes" : "no") === publishedFilter;
        const matchesDelivered = deliveredFilter === "all" || (b.isDelivered ? "yes" : "no") === deliveredFilter;

        if (!matchesStatus || !matchesPayment || !matchesDelivery || !matchesUrgent || !matchesPayMode || !matchesPanel || !matchesSample || !matchesChecked || !matchesPublished || !matchesDelivered) return false;

        if (!searchLower) return true;

        const matchesName = (b.patientName || "").toLowerCase().includes(searchLower);
        const matchesPhone = (b.phone || "").toLowerCase().includes(searchLower);
        const matchesBarcode = (b.barcode || "").toLowerCase().includes(searchLower);
        const matchesReferral = (b.referralName || "").toLowerCase().includes(searchLower);

        return (matchesName || matchesPhone || matchesBarcode || matchesReferral);
    }) : [];

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleShare = async (bookingId: string) => {
        try {
            const res = await fetch(`/api/reports/share/${bookingId}`, { method: "POST" });
            const data = await res.json();
            if (data.shareUrl) {
                await navigator.clipboard.writeText(data.shareUrl);
                alert("Ephemeral Link Generated & Copied: Protocol active for 24 hours.");
            } else {
                alert("Broadcast Error: Failed to generate shared node.");
            }
        } catch (err) {
            console.error("Sharing failed", err);
            alert("Neural Link Severed: Broadcast interrupted.");
        }
    };
    const handleUpdatePatient = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsUpdating(true);
            const res = await fetch(`/api/bookings/${editingBooking._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingBooking)
            });
            if (res.ok) {
                setWorklist(prev => prev.map(b => b._id === editingBooking._id ? { ...b, ...editingBooking } : b));
                setEditingBooking(null);
                alert("Patient record updated successfully.");
            } else {
                alert("Correction Error: Failed to update clinical node.");
            }
        } catch (err) {
            console.error("Update failed", err);
            alert("Neural Link Severed: Update interrupted.");
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="space-y-8 md:space-y-12 pb-20 px-4 md:px-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white leading-none">Lab Worklist</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] text-[8px] md:text-[10px] mt-4 ml-1 italic">Real-time Operational Flow & Matrix Performance</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-6 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-xl">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/40 italic">Worklist Value</span>
                            <span className="text-xl font-black italic tracking-tighter text-emerald-500">₹{filteredWorklist.reduce((acc, b) => acc + (b.netAmount || 0), 0)}</span>
                        </div>
                    </div>
                    <Button onClick={handlePrint} variant="outline" className="rounded-xl md:rounded-2xl h-14 md:h-16 px-6 md:px-8 font-black border-slate-200 dark:border-slate-800 uppercase text-[10px] md:text-xs tracking-widest italic hover:bg-slate-50 transition-all">
                        <Printer className="mr-2 md:mr-3 w-4 h-4 md:w-5 md:h-5" /> Print Stream
                    </Button>
                </div>
            </div>

            {/* Matrix Operational Controls */}
            <div className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-10">
                {/* Advanced Tactical Filters Row */}
                <div className="flex flex-wrap items-center gap-4 border-b border-slate-50 dark:border-slate-800 pb-8">
                    {/* Bulk Actions */}
                    <div className="flex items-center gap-2 pr-6 border-r border-slate-100 dark:border-slate-800">
                        <Button
                            onClick={() => setSelectedIds(filteredWorklist.map(b => b._id))}
                            size="sm"
                            className="bg-orange-500 text-white font-black uppercase text-[8px] tracking-widest rounded-lg h-10 italic"
                        >
                            Check All
                        </Button>
                        <Button
                            onClick={() => setSelectedIds([])}
                            variant="outline"
                            size="sm"
                            className="text-slate-400 font-black uppercase text-[8px] tracking-widest rounded-lg h-10 italic border-slate-100"
                        >
                            Uncheck
                        </Button>
                        {selectedIds.length > 0 && (
                            <Button
                                onClick={handleBulkPublish}
                                size="sm"
                                className="bg-emerald-500 text-white font-black uppercase text-[8px] tracking-widest rounded-lg h-10 italic animate-pulse"
                            >
                                Publish ({selectedIds.length})
                            </Button>
                        )}
                    </div>

                    {/* Operational Dropdowns */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Status Select */}
                        <div className="space-y-2">
                            <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Process Sector</label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 text-[9px] font-black uppercase italic tracking-widest outline-none shadow-sm focus:ring-2 ring-emerald-500/20"
                            >
                                <option value="all">All Sectors</option>
                                <option value="pending">Pending</option>
                                <option value="collected">Collected</option>
                                <option value="process">Processing</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        {/* Payment Select */}
                        <div className="space-y-2">
                            <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Accounting Node</label>
                            <select
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value)}
                                className="h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 text-[9px] font-black uppercase italic tracking-widest outline-none shadow-sm focus:ring-2 ring-blue-500/20"
                            >
                                <option value="all">Financial Flow: All</option>
                                <option value="fully paid">Fully Paid</option>
                                <option value="due">Audit Due</option>
                                <option value="refund">Refund Protocol</option>
                            </select>
                        </div>

                        {/* Delivery Mode */}
                        <div className="space-y-2">
                            <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Delivery Vector</label>
                            <select
                                value={deliveryFilter}
                                onChange={(e) => setDeliveryFilter(e.target.value)}
                                className="h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 text-[9px] font-black uppercase italic tracking-widest outline-none shadow-sm focus:ring-2 ring-purple-500/20"
                            >
                                <option value="all">Vector: All</option>
                                <option value="self">Self Pick-up</option>
                                <option value="email">Email Node</option>
                                <option value="delivery boy">Logistics Node</option>
                                <option value="hospital">Hospital Sync</option>
                                <option value="courier">External Courier</option>
                            </select>
                        </div>

                        {/* Pay Mode */}
                        <div className="space-y-2">
                            <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Payment Medium</label>
                            <select
                                value={paymentModeFilter}
                                onChange={(e) => setPaymentModeFilter(e.target.value)}
                                className="h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 text-[9px] font-black uppercase italic tracking-widest outline-none shadow-sm focus:ring-2 ring-amber-500/20"
                            >
                                <option value="all">Medium: All</option>
                                <option value="cash">Hard Cash</option>
                                <option value="card">Card Terminal</option>
                                <option value="cheque">Bank Cheque</option>
                                <option value="upi">UPI / Digital</option>
                            </select>
                        </div>

                        {/* Panel Select */}
                        <div className="space-y-2">
                            <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Corporate Panel</label>
                            <select
                                value={panelFilter}
                                onChange={(e) => setPanelFilter(e.target.value)}
                                className="h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 text-[9px] font-black uppercase italic tracking-widest outline-none shadow-sm focus:ring-2 ring-indigo-500/20"
                            >
                                <option value="all">Panel: All</option>
                                {panels.map(p => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sample Select */}
                        <div className="space-y-2">
                            <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Sample State</label>
                            <select
                                value={sampleFilter}
                                onChange={(e) => setSampleFilter(e.target.value)}
                                className="h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-4 text-[9px] font-black uppercase italic tracking-widest outline-none shadow-sm focus:ring-2 ring-rose-500/20"
                            >
                                <option value="all">Sample: All</option>
                                <option value="collected">Collected</option>
                                <option value="pending">Awaiting</option>
                            </select>
                        </div>

                        {/* Validation Grid Filters */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                                <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Chkd</label>
                                <select
                                    value={checkedFilter}
                                    onChange={(e) => setCheckedFilter(e.target.value)}
                                    className="h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2 text-[9px] font-black uppercase italic tracking-widest"
                                >
                                    <option value="all">All</option>
                                    <option value="yes">Y</option>
                                    <option value="no">N</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Publ</label>
                                <select
                                    value={publishedFilter}
                                    onChange={(e) => setPublishedFilter(e.target.value)}
                                    className="h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2 text-[9px] font-black uppercase italic tracking-widest"
                                >
                                    <option value="all">All</option>
                                    <option value="yes">Y</option>
                                    <option value="no">N</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1 italic">Dliv</label>
                                <select
                                    value={deliveredFilter}
                                    onChange={(e) => setDeliveredFilter(e.target.value)}
                                    className="h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2 text-[9px] font-black uppercase italic tracking-widest"
                                >
                                    <option value="all">All</option>
                                    <option value="yes">Y</option>
                                    <option value="no">N</option>
                                </select>
                            </div>
                        </div>

                        {/* Urgent Toggle */}
                        <button
                            onClick={() => setUrgentOnly(!urgentOnly)}
                            className={cn(
                                "flex items-center gap-2 h-10 px-4 rounded-lg text-[9px] font-black uppercase tracking-widest italic transition-all border mt-4",
                                urgentOnly ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400"
                            )}
                        >
                            <Zap size={14} className={urgentOnly ? "fill-white" : ""} /> Urgent Only
                        </button>
                    </div>
                </div>

                <div className="flex flex-col xl:flex-row gap-6 md:gap-8 items-end">
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Period Start</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="w-full h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 outline-none font-bold italic shadow-inner border-none"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Period End</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="w-full h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl px-6 outline-none font-bold italic shadow-inner border-none"
                            />
                        </div>
                    </div>
                    <Button onClick={fetchWorklist} className="h-16 px-10 rounded-2xl bg-slate-950 text-white font-black uppercase tracking-widest italic hover:scale-105 active:scale-95 transition-all">
                        Update Segment
                    </Button>
                </div>

                <div className="flex flex-col xl:flex-row gap-6 md:gap-8 items-center border-t border-slate-50 dark:border-slate-800 pt-8">
                    <div className="flex-1 w-full flex items-center gap-4 bg-slate-50 dark:bg-slate-800 p-2 rounded-[2rem] shadow-inner">
                        {/* Integrated Tactical Search */}
                        <div className="flex-1 relative group min-w-[300px]">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        const val = (e.target as HTMLInputElement).value.trim();
                                        const exactMatch = bookings.find(b =>
                                            (b.barcode || "").toLowerCase() === val.toLowerCase() ||
                                            (b._id || "").toString().toLowerCase() === val.toLowerCase() ||
                                            (b.patientName || "").toLowerCase() === val.toLowerCase() ||
                                            (b.phone || "").toLowerCase() === val.toLowerCase()
                                        );
                                        if (exactMatch) {
                                            router.push(`/center/reports/fill/${exactMatch._id}`);
                                        }
                                    }
                                }}
                                placeholder="Search by Name or Mobile No..."
                                className="w-full h-14 bg-transparent border-none pl-14 pr-6 outline-none font-bold text-lg italic text-slate-900 dark:text-white placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                </div>
            </div>

                    {/* Mobile Filter Grid (Shown only on small screens) */}
                    <div className="flex md:hidden gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] w-full overflow-x-auto no-scrollbar shadow-inner">
                        {["All", "Pending", "Collected", "Process", "Completed"].map((f) => (
                            <button key={f} onClick={() => setFilter(f.toLowerCase())} className={cn(
                                "whitespace-nowrap px-6 py-3 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all italic shrink-0",
                                filter === f.toLowerCase() ? "bg-emerald-500 text-white" : "text-slate-400"
                            )}>
                                {f}
                            </button>
                        ))}
                    </div>

            {/* Worklist Stream */}
            <div className="space-y-8">
                {loading ? (
                    <div className="py-24 text-center space-y-4 text-emerald-500/20" >
                        <Loader2 className="w-16 h-16 animate-spin mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] italic">Synchronizing Operation Matrix...</p>
                    </div>
                ) : filteredWorklist.length > 0 ? (
                    filteredWorklist.map((booking, i) => (
                        <motion.div
                            key={booking._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 border border-slate-100 dark:border-slate-800 hover:border-emerald-500/30 hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
                        >
                            <div className="grid grid-cols-1 lg:grid-cols-[40px_180px_1fr_280px] items-center gap-6 md:gap-8 relative">
                                {/* TOP-RIGHT QUICK ACTIONS TOOLBAR */}
                                <div className="absolute top-4 right-6 flex items-center gap-2 z-10">
                                    <Button
                                        onClick={() => setSelectedAuditId(booking._id)}
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all p-0 flex items-center justify-center"
                                        title="View Audit Trace"
                                    >
                                        <History size={16} />
                                    </Button>

                                    <Link href={`/center/reports/invoice/${booking._id}`}>
                                        <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/5 transition-all flex items-center gap-2 group/bill" title="Print Invoice">
                                            <Printer size={16} />
                                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-300 group-hover/bill:text-blue-500 transition-colors">Bill</span>
                                        </Button>
                                    </Link>
                                </div>
                                {/* SELECTION NODE */}
                                <div className="flex items-center justify-center">
                                    <button
                                        onClick={() => toggleSelect(booking._id)}
                                        className={cn(
                                            "w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center shadow-sm",
                                            selectedIds.includes(booking._id) ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500"
                                        )}
                                    >
                                        {selectedIds.includes(booking._id) && <CheckCircle2 size={16} strokeWidth={3} />}
                                    </button>
                                </div>

                                {/* BLOCK 1: PATIENT IDENTITY */}
                                <div className="flex items-center gap-4 shrink-0 min-w-0">
                                    <div className="relative">
                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-700 shadow-inner shrink-0">
                                            <User size={24} />
                                        </div>
                                        {booking.isUrgent && (
                                            <div className="absolute -top-1 -right-1 bg-red-500 text-white p-1.5 rounded-lg shadow-xl animate-bounce">
                                                <Zap size={12} className="fill-white" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <div className="flex flex-col gap-1">
                                            {/* ACTION HUB: ABOVE NAME */}
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => setEditingBooking(booking)}
                                                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/5 transition-all group/edit"
                                                >
                                                    <Pencil size={10} className="group-hover/edit:rotate-12 transition-transform" />
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => setPrintingBarcode(booking)}
                                                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-500 hover:bg-blue-500/5 transition-all group/barcode"
                                                >
                                                    <Download size={10} className="group-hover/barcode:-translate-y-0.5 transition-transform" />
                                                    Barcode
                                                </button>
                                            </div>
                                            <h4 className="text-base md:text-lg font-black tracking-tighter uppercase text-slate-950 dark:text-white truncate">{booking.patientName}</h4>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-400 border border-slate-100 dark:border-slate-700/50 italic shrink-0">#{booking._id.slice(-6).toUpperCase()}</span>
                                            <div className="flex gap-2 text-[9px] font-black text-slate-400 uppercase italic">
                                                <span>{booking.age}Y</span>
                                                <span className="opacity-30">/</span>
                                                <span>{booking.gender}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-emerald-500 text-[9px] font-black uppercase underline decoration-emerald-500/20 truncate italic">
                                                {booking.referralName || "Self-Referral"}
                                            </span>
                                            {booking.panelId && (
                                                <span className="text-blue-500 text-[9px] font-black uppercase italic border-l border-slate-200 pl-2">
                                                    [{booking.panelId.name || "Corporate"}]
                                                </span>
                                            )}
                                            <span className="text-[8px] font-black uppercase bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-400 italic">
                                                {booking.deliveryMode || "Self"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* BLOCK 2: CLINICAL & FINANCIAL INTELLIGENCE */}
                                <div className="py-4 lg:py-0 border-y lg:border-y-0 lg:border-x border-slate-100 dark:border-slate-800 lg:px-8 grid grid-cols-1 xl:grid-cols-[1fr_220px] gap-6 min-w-0">
                                    {/* Matrix Nodes */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500">
                                                <FlaskConical size={14} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Investigation Matrix</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto no-scrollbar scroll-smooth">
                                            {booking.tests?.map((test: any, idx: number) => (
                                                <div key={`test-${idx}`} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-[9px] font-bold uppercase border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 transition-colors cursor-default">
                                                    {test.name}
                                                </div>
                                            ))}
                                            {booking.packages?.map((pkg: any, idx: number) => (
                                                <div key={`pkg-${idx}`} className="px-3 py-1.5 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 rounded-xl text-[9px] font-bold uppercase border border-emerald-500/20 flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {pkg.name}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Financial Summary Node */}
                                    <div className="space-y-4 border-l border-slate-50 dark:border-slate-800/50 pl-10 hidden xl:block">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-500">
                                                <Zap size={14} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">Settlement</span>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center group/fin">
                                                <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider">Net Payable</span>
                                                <span className="text-xs font-black text-slate-900 dark:text-white">₹{booking.netAmount}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[7px] font-black text-emerald-500/70 uppercase tracking-wider">Received</span>
                                                <span className="text-xs font-black text-emerald-500">₹{booking.paidAmount}</span>
                                            </div>
                                            <div className="pt-2 border-t border-slate-50 dark:border-slate-800">
                                                <div className="flex justify-between items-center">
                                                    <span className={cn(
                                                        "text-[8px] font-black uppercase px-2 py-0.5 rounded-md",
                                                        booking.balance > 0 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                                                    )}>
                                                        Balance
                                                    </span>
                                                    <span className={cn("text-xs font-black tracking-tighter", booking.balance > 0 ? "text-red-500" : "text-slate-900 dark:text-white")}>
                                                        ₹{booking.balance}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* BLOCK 3: ACTION PORTAL */}
                                <div className="flex flex-col items-center lg:items-end gap-6 shrink-0">
                                    <div className="flex flex-col items-center lg:items-end gap-3 w-full">
                                        <div className="flex flex-col items-center lg:items-end">
                                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{new Date(booking.bookingDate).toLocaleDateString()}</span>
                                            <span className="text-sm font-black text-slate-500 tracking-tighter">{new Date(booking.bookingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-sm border whitespace-nowrap",
                                            statusMap[booking.status]?.color || "bg-slate-50 text-slate-400 border-slate-100"
                                        )}>
                                            <span className="shrink-0 scale-90">{statusMap[booking.status]?.icon}</span>
                                            {statusMap[booking.status]?.label}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center lg:justify-end gap-2 w-full">

                                        {/* Combined Action Group to prevent wrapping */}
                                        <div className="flex items-center gap-2">
                                            {booking.status === "Completed" && (
                                                <>
                                                    <Link href={`/center/reports/${booking._id}`}>
                                                        <Button size="sm" className="h-9 px-3 rounded-xl bg-slate-900 text-white font-black uppercase text-[8px] tracking-widest shadow-xl hover:bg-primary transition-all">
                                                            Report
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        onClick={() => handleShare(booking._id)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-9 w-9 rounded-xl border-slate-100 dark:border-slate-800 text-slate-400 hover:text-emerald-500 transition-all p-0 flex items-center justify-center shrink-0"
                                                    >
                                                        <Share2 size={14} />
                                                    </Button>
                                                </>
                                            )}
                                            <Link href={`/center/reports/fill/${booking._id}`}>
                                                <Button size="sm" className={cn(
                                                    "h-9 px-4 rounded-xl font-black uppercase text-[8px] tracking-widest transition-all shadow-xl",
                                                    booking.status === "Completed"
                                                        ? "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700"
                                                        : "bg-emerald-500 text-white hover:bg-emerald-600"
                                                )}>
                                                    {booking.status === "Completed" ? "Re-Edit" : "Entry"}
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 w-0 group-hover:w-full transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-[4rem] p-32 text-center border border-slate-100 dark:border-slate-800 border-dashed">
                        <ClipboardList size={48} className="mx-auto mb-8 text-slate-100" strokeWidth={1} />
                        <h5 className="text-2xl font-black text-slate-200 uppercase tracking-widest italic">Matrix Cluster Empty</h5>
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.5em] mt-4 italic">No active operations detected in current search sector</p>
                    </div>
                )}
            </div>

            {/* Audit Logs Sidebar / Modal */}
            <AnimatePresence>
                {
                    selectedAuditId && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md flex justify-end p-4 md:p-8"
                            onClick={() => setSelectedAuditId(null)}
                        >
                            <motion.div
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[3rem] shadow-4xl flex flex-col overflow-hidden border border-white/20"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-10 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                    <div>
                                        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">Operation History</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-2 flex items-center gap-2">
                                            <ShieldCheck size={14} /> Trace Log Synchronization
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedAuditId(null)}
                                        className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 shadow-xl transition-all"
                                    >
                                        <ChevronRight size={24} />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                                    {auditLoading ? (
                                        <div className="h-full flex flex-col items-center justify-center gap-4 py-20 grayscale opacity-40">
                                            <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
                                            <p className="text-[10px] font-black uppercase tracking-widest italic">Synchronizing Logs...</p>
                                        </div>
                                    ) : auditLogs.length > 0 ? (
                                        <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-12 pb-10">
                                            {auditLogs.map((log: any, idx: number) => (
                                                <div key={log._id} className="relative pl-10">
                                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                                    <div className="space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 italic">
                                                                {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            <span className={cn(
                                                                "text-[8px] font-black uppercase px-3 py-1 rounded-lg border italic",
                                                                log.action === "PATIENT_REGISTRATION" && "bg-blue-500/10 text-blue-500 border-blue-500/20",
                                                                log.action === "STATUS_UPDATE" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                                                log.action === "RESULT_ENTRY" && "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
                                                                log.action === "RESULT_CORRECTION" && "bg-amber-500/10 text-amber-500 border-amber-500/20",
                                                                (!["PATIENT_REGISTRATION", "STATUS_UPDATE", "RESULT_ENTRY", "RESULT_CORRECTION"].includes(log.action)) && "bg-slate-500/10 text-slate-500 border-slate-500/20"
                                                            )}>
                                                                {log.action === "PATIENT_REGISTRATION" ? "Registration" :
                                                                    log.action === "STATUS_UPDATE" ? "Status Update" :
                                                                        log.action === "RESULT_ENTRY" ? "Result Entry" :
                                                                            log.action === "RESULT_CORRECTION" ? "Correction" :
                                                                                log.action.replace(/_/g, " ")}
                                                            </span>
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white text-xs font-bold">
                                                                    {log.userId?.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase italic leading-none">{log.userId?.name}</p>
                                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{log.userId?.role}</p>
                                                                </div>
                                                            </div>
                                                            {log.details && (
                                                                <div className="text-[10px] font-bold text-slate-500 uppercase italic leading-relaxed mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                                                                    {log.action === "PATIENT_REGISTRATION" && (
                                                                        <p>Initial Registration: <span className="text-slate-900 dark:text-white font-black">{log.details.patientName}</span></p>
                                                                    )}
                                                                    {log.action === "STATUS_UPDATE" && (
                                                                        <p>Status Transition: <span className="text-emerald-500 font-black">{log.details.newStatus}</span></p>
                                                                    )}
                                                                    {log.action === "RESULT_ENTRY" && (
                                                                        <p className="text-emerald-500">Clinical Results Successfully Authenticated</p>
                                                                    )}
                                                                    {log.action === "RESULT_CORRECTION" && (
                                                                        <p className="text-amber-500">Clinical Results Node Recalibrated (Correction)</p>
                                                                    )}
                                                                    {(!["PATIENT_REGISTRATION", "STATUS_UPDATE", "RESULT_ENTRY", "RESULT_CORRECTION"].includes(log.action)) && (
                                                                        <p>Clinical Record Update: ID <span className="text-slate-900 dark:text-white font-black">#{(log.details.bookingId || log.targetId)?.slice(-6).toUpperCase()}</span></p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-20 text-center space-y-4 opacity-20 grayscale">
                                            <AlertCircle className="w-16 h-16 mx-auto" strokeWidth={1} />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No operation traces detected</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }

                {
                    editingBooking && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[110] bg-slate-950/60 backdrop-blur-xl flex items-center justify-center p-4 md:p-8"
                            onClick={() => setEditingBooking(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-4xl overflow-hidden border border-white/20"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                    <div>
                                        <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">Edit Clinical Identity</h3>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-2 flex items-center gap-2">
                                            <Zap size={14} className="fill-emerald-500" /> Recalibrating Patient Node
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setEditingBooking(null)}
                                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all shadow-lg"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleUpdatePatient} className="p-8 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">Full Name</label>
                                            <input
                                                type="text"
                                                value={editingBooking.patientName}
                                                onChange={(e) => setEditingBooking({ ...editingBooking, patientName: e.target.value })}
                                                className="w-full h-14 bg-slate-50 dark:bg-slate-800 rounded-xl px-5 outline-none font-bold italic focus:ring-2 ring-emerald-500/20 transition-all border-none text-slate-900 dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">Age (Years)</label>
                                            <input
                                                type="number"
                                                value={editingBooking.age}
                                                onChange={(e) => setEditingBooking({ ...editingBooking, age: Number(e.target.value) })}
                                                className="w-full h-14 bg-slate-50 dark:bg-slate-800 rounded-xl px-5 outline-none font-bold italic focus:ring-2 ring-emerald-500/20 transition-all border-none text-slate-900 dark:text-white"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">Gender</label>
                                            <select
                                                value={editingBooking.gender}
                                                onChange={(e) => setEditingBooking({ ...editingBooking, gender: e.target.value })}
                                                className="w-full h-14 bg-slate-50 dark:bg-slate-800 rounded-xl px-5 outline-none font-bold italic focus:ring-2 ring-emerald-500/20 transition-all border-none text-slate-900 dark:text-white"
                                                required
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2 italic">Mobile Number</label>
                                            <input
                                                type="tel"
                                                value={editingBooking.phone}
                                                onChange={(e) => setEditingBooking({ ...editingBooking, phone: e.target.value })}
                                                className="w-full h-14 bg-slate-50 dark:bg-slate-800 rounded-xl px-5 outline-none font-bold italic focus:ring-2 ring-emerald-500/20 transition-all border-none text-slate-900 dark:text-white"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEditingBooking(null)}
                                            className="flex-1 h-14 rounded-xl font-black uppercase tracking-widest italic"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isUpdating}
                                            className="flex-1 h-14 rounded-xl bg-slate-950 text-white font-black uppercase tracking-widest italic flex items-center justify-center gap-2 hover:scale-105 transition-all"
                                        >
                                            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Commit Changes"}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )
                }

                {
                    printingBarcode && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-2xl flex items-center justify-center p-6"
                            onClick={() => setPrintingBarcode(null)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 30 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 30 }}
                                className="bg-white dark:bg-slate-900 w-full max-w-sm md:max-w-md rounded-[3rem] p-8 md:p-12 border border-white/10 shadow-4xl space-y-8"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="text-center space-y-2">
                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">Barcode Export</h3>
                                    <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest italic">Industrial Standard Code 39 Node</p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[2rem] flex flex-col items-center justify-center shadow-inner">
                                    <div id="barcode-download-area" className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-3 min-w-[55mm] min-h-[35mm]">
                                        {/* TOP: DATE & AGE/SEX */}
                                        <div className="w-full flex justify-between items-center text-[10px] font-black uppercase text-slate-900 tracking-tight leading-none px-1">
                                            <p>Date: {new Date(printingBarcode.bookingDate).toLocaleDateString('en-GB')}</p>
                                            <p>{printingBarcode.age}Y/{printingBarcode.gender?.charAt(0)}</p>
                                        </div>

                                        {/* MIDDLE: BARCODE */}
                                        <div className="w-full flex flex-col items-center">
                                            <svg viewBox="0 0 400 60" className="w-[45mm] h-[12mm]" preserveAspectRatio="none" shapeRendering="crispEdges">
                                                <g fill="#000">
                                                    {generateCode39(printingBarcode.barcode || "LAB")}
                                                </g>
                                            </svg>
                                        </div>

                                        {/* BOTTOM: BookingNo Name / barcode */}
                                        <div className="w-full text-center px-1">
                                            <p className="text-[10px] font-black uppercase text-slate-950 leading-none tracking-tight">
                                                {printingBarcode._id.slice(-3).toUpperCase()} {printingBarcode.patientName} / {printingBarcode.barcode}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <Button
                                        onClick={() => setPrintingBarcode(null)}
                                        variant="outline"
                                        className="h-14 rounded-2xl font-black uppercase tracking-widest italic"
                                    >
                                        Close
                                    </Button>
                                    <Button
                                        onClick={handlePrintBarcode}
                                        className="h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest italic flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl"
                                    >
                                        <Printer size={18} /> Print
                                    </Button>
                                    <Button
                                        onClick={handleDownloadBarcode}
                                        className="h-14 rounded-2xl bg-emerald-500 text-white font-black uppercase tracking-widest italic flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-xl shadow-emerald-500/20"
                                    >
                                        <Download size={18} /> Download
                                    </Button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }

                {/* PRINT-ONLY BARCODE CONTAINER (Hidden in UI) */}
                <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
                    {printingBarcode && (
                        <div className="flex items-center justify-center h-full">
                            <div className="bg-white p-2 flex flex-col items-center justify-center space-y-1 w-[50mm] h-[25mm]">
                                <div className="w-full flex justify-between items-center text-[8px] font-black uppercase text-black leading-none">
                                    <p>Date: {new Date(printingBarcode.bookingDate).toLocaleDateString('en-GB')}</p>
                                    <p>{printingBarcode.age}Y/{printingBarcode.gender?.charAt(0)}</p>
                                </div>
                                <svg viewBox="0 0 400 60" className="w-[45mm] h-[12mm]" preserveAspectRatio="none" shapeRendering="crispEdges">
                                    <g fill="#000">
                                        {generateCode39(printingBarcode.barcode || "LAB")}
                                    </g>
                                </svg>
                                <div className="w-full text-center">
                                    <p className="text-[10px] font-black uppercase text-black leading-none">
                                        {printingBarcode._id.slice(-3).toUpperCase()} {printingBarcode.patientName} / {printingBarcode.barcode}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <style jsx global>{`
                    @media print {
                        body * {
                            visibility: hidden !important;
                        }
                        .print\\:block, .print\\:block * {
                            visibility: visible !important;
                            position: fixed !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            height: 100% !important;
                            background: white !important;
                            display: flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                        }
                    }
                `}</style>
            </AnimatePresence >
        </div >
    );
}
