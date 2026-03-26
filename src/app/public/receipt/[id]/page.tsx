"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import {
    Activity,
    MapPin,
    Phone,
    CheckCircle2,
    Loader2,
    AlertCircle,
    Download,
    Share2
} from "lucide-react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";

export default function PublicReceiptPage() {
    const { id } = useParams();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchReceipt() {
            try {
                const res = await fetch(`/api/public/receipt/${id}`);
                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    setError(err.error || "Receipt not found");
                } else {
                    const d = await res.json();
                    setData(d);
                    document.title = `RECEIPT_${d.booking.patientName?.split(' ')[0].toUpperCase()}`;
                }
            } catch (err) {
                setError("Terminal Connection Error");
            } finally {
                setLoading(false);
            }
        }
        fetchReceipt();
    }, [id]);

    const handleSaveImage = async () => {
        if (!receiptRef.current) return;
        setSaving(true);
        try {
            const element = receiptRef.current;
            const canvas = await html2canvas(element, {
                scale: 2, // High quality
                useCORS: true,
                backgroundColor: "#ffffff",
                logging: false,
                onclone: (documentClone) => {
                    // Force white background and hide elements if needed
                    const el = documentClone.querySelector(".receipt-wrapper") as HTMLElement;
                    if (el) el.style.borderRadius = "0";
                }
            });

            const link = document.createElement("a");
            link.download = `RECEIPT_${data?.booking?.patientName?.replace(/\s+/g, '_').toUpperCase()}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        } catch (err) {
            console.error("Save failed", err);
            // Fallback to print
            window.print();
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-6 bg-slate-950 text-white">
                <Loader2 className="w-14 h-14 text-primary animate-spin" />
                <p className="font-black uppercase tracking-[0.4em] text-slate-500 text-[10px]">Retrieving Clinical Record...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-6 bg-slate-950 text-white p-8">
                <AlertCircle className="w-16 h-16 text-red-500" />
                <h2 className="text-2xl font-black uppercase tracking-widest italic">Node Not Found</h2>
                <p className="text-slate-400 font-bold max-w-sm text-center italic uppercase tracking-wider text-xs">
                    {error || "The requested bill could not be retrieved from the clinical cluster."}
                </p>
            </div>
        );
    }

    const { booking, center } = data;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-12">
            <style jsx global>{`
                @media print {
                    @page { size: A4; margin: 10mm; }
                    .print-hide { display: none !important; }
                    body { background: white !important; font-family: 'Inter', sans-serif !important; }
                }
            `}</style>

            <motion.div
                ref={receiptRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 print:shadow-none print:border-none print:rounded-none receipt-wrapper"
            >
                {/* Public Header */}
                <div className="p-10 md:p-16 border-b-4 border-slate-950 dark:border-primary bg-slate-50 dark:bg-slate-950/20 flex flex-col md:flex-row justify-between gap-10 print:flex-row print:p-0 print:pb-6 print:bg-transparent">
                    <div className="space-y-6 print:space-y-2">
                        <div className="flex items-center gap-6 print:gap-4">
                            {center?.logo ? (
                                <img src={center.logo} alt="Logo" className="w-20 h-20 print:w-16 print:h-16 object-contain" />
                            ) : (
                                <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white">
                                    <Activity size={32} />
                                </div>
                            )}
                            <div>
                                <h1 className="text-3xl print:text-xl font-black tracking-tighter uppercase text-slate-900 dark:text-white leading-none mb-2">{center?.name || "Laboratory"}</h1>
                                <p className="text-primary font-black uppercase text-[10px] tracking-[0.3em] italic">{center?.tagline || "Diagnostics Center"}</p>
                            </div>
                        </div>
                        <div className="space-y-1 text-slate-500 font-bold text-xs print:text-[8px] print:space-y-0">
                            <p className="flex items-start gap-3"><MapPin size={14} className="text-primary shrink-0" /> {center?.address}</p>
                            <p className="flex items-center gap-3"><Phone size={14} className="text-primary shrink-0" /> {center?.phone}</p>
                        </div>
                    </div>
                    <div className="text-left md:text-right flex flex-col justify-end space-y-4 print:space-y-1">
                        <div className="bg-slate-900 text-white px-6 py-3 print:px-4 print:py-1 rounded-2xl print:rounded-lg inline-block w-fit md:ml-auto">
                            <p className="text-[9px] print:text-[7px] font-black uppercase tracking-[0.4em]">Receipt Type</p>
                            <h2 className="text-xl print:text-lg font-black italic tracking-tighter uppercase">Final Invoice</h2>
                        </div>
                        <div className="text-slate-400 font-black uppercase text-[10px] print:text-[7px] tracking-widest">
                            <p>Date: {new Date(booking.bookingDate).toLocaleDateString()}</p>
                            <p>ID: {booking.barcode || booking._id.slice(-8).toUpperCase()}</p>
                        </div>
                    </div>
                </div>

                {/* Patient / Details */}
                <div className="p-10 md:p-16 grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-slate-50 dark:border-slate-800 print:p-0 print:py-8 print:grid-cols-3 print:gap-4 print:border-b">
                    <div>
                        <p className="text-[10px] print:text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Patient</p>
                        <h3 className="text-xl print:text-sm font-black text-slate-900 dark:text-white uppercase leading-none">{booking.patientName}</h3>
                        <p className="text-xs print:text-[8px] font-bold text-slate-500 uppercase mt-1">{booking.age}Y • {booking.gender}</p>
                    </div>
                    <div>
                        <p className="text-[10px] print:text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Contact</p>
                        <p className="text-lg print:text-sm font-black text-slate-900 dark:text-white leading-none">{booking.phone || "---"}</p>
                    </div>
                    <div>
                        <p className="text-[10px] print:text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Status</p>
                        <div className="flex items-center gap-2">
                             <CheckCircle2 size={16} className="text-emerald-500" />
                             <span className="text-sm print:text-[8px] font-black uppercase italic text-emerald-500">Confirmed Record</span>
                        </div>
                    </div>
                </div>

                {/* Bill Matrix */}
                <div className="p-10 md:p-16 print:p-0 print:py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-12 print:gap-x-10 gap-y-4">
                        {[...(booking.tests || []), ...(booking.packages || [])].map((item: any, i: number) => (
                            <div key={i} className="flex justify-between items-center py-4 print:py-1 border-b border-slate-50 print:border-slate-100">
                                <p className="text-base md:text-lg print:text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate">{item.name}</p>
                                <span className="font-black text-slate-900 dark:text-white text-base md:text-lg print:text-[9px]">₹{item.price}</span>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="mt-12 md:mt-16 pt-8 md:pt-12 border-t-2 border-slate-900 print:mt-6 print:pt-4 print:border-t">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
                             <div className="space-y-2 max-w-sm print:hidden">
                                <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase italic">Secure Digital Protocol</p>
                                <p className="text-[9px] font-bold text-slate-400 leading-tight uppercase font-mono italic">Document verified on clinical node cluster.</p>
                             </div>
                             <div className="w-full md:w-80 print:w-56 space-y-3 print:space-y-1">
                                 <div className="flex justify-between items-center text-xs print:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                     <span>Billing Amount</span>
                                     <span>₹{booking.totalAmount}</span>
                                 </div>
                                 <div className="flex justify-between items-center text-xs print:text-[9px] font-bold text-red-500 uppercase tracking-widest leading-none">
                                     <span>Discount</span>
                                     <span>- ₹{booking.discount || 0}</span>
                                 </div>
                                 <div className="h-[1px] bg-slate-100 dark:bg-slate-800 my-2 print:my-0.5" />
                                 <div className="flex justify-between items-end">
                                     <span className="text-xl print:text-[10px] font-black italic tracking-tighter uppercase text-slate-900 dark:text-white leading-none">Total Paid</span>
                                     <span className="text-4xl print:text-xl font-black text-emerald-500 tracking-tighter leading-none">₹{booking.paidAmount || 0}</span>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Footer Message */}
                <div className="bg-slate-50 dark:bg-slate-950/50 p-8 text-center print:p-4 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] italic mb-4 print:mb-0">Secure Node Verification • {center.name}</p>
                    <button 
                        onClick={handleSaveImage}
                        disabled={saving}
                        className="print:hidden bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary transition-colors flex items-center gap-3 mx-auto mt-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Download size={16} />
                        )}
                        {saving ? "Processing..." : "Save Receipt"}
                    </button>
                    <p className="print:hidden text-[8px] font-bold text-slate-400 uppercase mt-4 tracking-wider">Tap to save high-quality image</p>
                </div>
            </motion.div>
        </div>
    );
}
