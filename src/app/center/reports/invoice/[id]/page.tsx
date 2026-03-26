"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
    Printer,
    Download,
    Mail,
    Phone,
    Globe,
    MapPin,
    CheckCircle2,
    Loader2,
    Activity,
    ChevronLeft,
    AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

export default function InvoicePage() {
    const { id } = useParams();
    const [booking, setBooking] = useState<any>(null);
    const [center, setCenter] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (booking) {
            const ptId = booking?._id?.toString().slice(-6).toUpperCase() || "NODE";
            document.title = `BILL_${booking.patientName?.replace(/\s+/g, '_').toUpperCase()}_${ptId}`;
        }
    }, [booking]);

    useEffect(() => {
        async function fetchData() {
            try {
                const bRes = await fetch(`/api/bookings/${id}`);
                if (!bRes.ok) {
                    const errBody = await bRes.json().catch(() => ({}));
                    setError(errBody.error || `Node Connection Error (${bRes.status})`);
                } else {
                    const bData = await bRes.json();
                    setBooking(bData);
                }

                // Fetch center profile separately so it doesn't block if booking succeeded
                try {
                    const cRes = await fetch(`/api/center/profile`);
                    if (cRes.ok) {
                        const cData = await cRes.json();
                        setCenter(cData);
                    }
                } catch (cErr) {
                    console.error("Center profile fetch failed", cErr);
                }
            } catch (err) {
                console.error("Fetch failed", err);
                setError("Terminal Link Severed: Failed to synchronize with clinical node cluster.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-14 h-14 text-primary animate-spin" />
                <p className="font-black uppercase tracking-[0.4em] text-slate-300 text-[10px]">Generating Financial Document...</p>
            </div>
        );
    }
    if (error || !booking) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-6">
                <AlertCircle className="w-14 h-14 text-red-500" />
                <h2 className="text-2xl font-black uppercase tracking-widest italic">Node Not Found</h2>
                <p className="text-slate-400 font-bold max-w-sm text-center italic uppercase tracking-wider text-xs">
                    {error || "The requested transaction matrix could not be retrieved from the central repository."}
                </p>
                <Link href="/center/booking">
                    <Button className="mt-8 rounded-2xl h-14 px-10">Return to Grid</Button>
                </Link>
            </div>
        );
    }
    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20 print:p-0 print:space-y-0 print:max-w-none print:mx-0">
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                    body {
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        font-family: 'Inter', sans-serif !important;
                    }
                    .print-hide { display: none !important; }
                    
                    /* The Table Print System */
                    .print-container-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }

                    .print-header-spacer { 
                        height: 0mm !important; 
                    }

                    .print-footer-spacer { 
                        height: ${center?.showFooter === false ? '65mm' : '0mm'}; 
                    }

                    /* Layout Normalization */
                    .shadow-4xl, .shadow-xl, .shadow-3xl { box-shadow: none !important; }
                    
                    /* Tables */
                    table { border-collapse: collapse !important; width: 100% !important; }
                    th { border-bottom: 2pt solid #000 !important; font-size: 8pt !important; padding: 6pt 4pt !important; text-transform: uppercase !important; }
                    td { padding: 8pt 4pt !important; font-size: 9pt !important; border-bottom: 0.5pt solid #eee !important; }
                }
            `}</style>

            {/* Action Bar - Hidden during print */}
            <div className="flex items-center justify-between print:hidden">
                <Link href="/center/booking">
                    <Button variant="ghost" className="rounded-2xl gap-3 font-bold text-slate-500">
                        <ChevronLeft size={20} /> New Registration
                    </Button>
                </Link>
                <div className="flex gap-4">
                    <Button onClick={handlePrint} variant="outline" className="rounded-2xl h-14 px-8 border-slate-200 font-black uppercase text-xs tracking-widest">
                        <Download className="mr-3 w-5 h-5" /> PDF
                    </Button>
                    <Button onClick={handlePrint} className="rounded-2xl h-14 px-10 shadow-3xl shadow-primary/30 font-black uppercase text-xs tracking-widest bg-primary text-white">
                        <Printer className="mr-3 w-6 h-6" /> Print Invoice
                    </Button>
                </div>
            </div>

            {/* Invoice Document */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-4xl border border-slate-100 dark:border-slate-800 overflow-hidden print:shadow-none print:border-none print:rounded-none"
                ref={printRef}
            >
                <table className="print-container-table w-full border-collapse">
                    <thead>
                        <tr>
                            <td>
                                <div className="print-header-spacer" />
                                {/* Clinical Identity Node (Barcode & QR) - Positioned at the very top for blank pages */}
                                <div className="hidden print:flex justify-between items-center px-4 py-2 absolute top-0 right-0 z-20 scale-75 origin-top-right">
                                    <div className="flex flex-col items-end mr-4">
                                        <img
                                            src={`https://bwipjs-api.metafloor.com/?bcid=code128&text=${booking?.barcode || booking?._id?.slice(-8).toUpperCase()}&scale=2&rotate=N&includetext`}
                                            alt="Barcode"
                                            className="h-8 object-contain mix-blend-multiply"
                                        />
                                        <span className="text-[7px] font-black uppercase text-slate-400 mt-0.5 whitespace-nowrap tracking-widest">Neural Identity Node</span>
                                    </div>
                                    <div className="border-l border-slate-200 pl-4">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${typeof window !== 'undefined' ? `${window.location.origin}/public/receipt/${id}` : id}`}
                                            alt="QR"
                                            className="w-10 h-10 opacity-70 grayscale"
                                        />
                                    </div>
                                </div>

                                {/* Header is ALWAYS shown for bills because they are on blank paper */}
                                {true && (
                                    <div className="p-16 border-b-4 border-slate-950 dark:border-primary bg-slate-50 dark:bg-slate-950/20 flex flex-col md:flex-row justify-between gap-12 md:print:flex print:p-0 print:pb-6 print:border-b-2 print:bg-transparent print:flex-row">
                                        <div className="space-y-6 print:space-y-2">
                                            <div className="flex items-center gap-6 print:gap-4">
                                                {center?.logo ? (
                                                    <img src={center.logo} alt="Logo" className="w-24 h-24 print:w-16 print:h-16 object-contain" />
                                                ) : (
                                                    <div className="w-20 h-20 rounded-2xl print:rounded-xl bg-primary flex items-center justify-center text-white shadow-xl">
                                                        <Activity size={40} className="print:w-6 print:h-6" />
                                                    </div>
                                                )}
                                                <div>
                                                    <h1 className="text-4xl print:text-2xl font-black tracking-tighter uppercase text-slate-900 dark:text-white leading-none mb-2 print:mb-1">{center?.name || "LifeCare Lab"}</h1>
                                                    <p className="text-primary font-black uppercase text-[10px] print:text-[8px] tracking-[0.3em] italic">{center?.tagline || "Advanced Diagnostics Cluster"}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 text-slate-500 font-bold text-sm print:text-[8px] max-w-sm print:space-y-0">
                                                <p className="flex items-start gap-3"><MapPin size={18} className="text-primary shrink-0 print:w-3 print:h-3" /> {center?.address}</p>
                                                <p className="flex items-center gap-3"><Phone size={18} className="text-primary shrink-0 print:w-3 print:h-3" /> {center?.phone}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col justify-end space-y-4 print:space-y-1">
                                            <div className="bg-slate-900 text-white px-8 py-3 print:px-4 print:py-1 rounded-2xl print:rounded-lg inline-block w-fit ml-auto">
                                                <p className="text-[10px] print:text-[7px] font-black uppercase tracking-[0.4em]">Invoice Type</p>
                                                <h2 className="text-2xl print:text-lg font-black italic tracking-tighter uppercase">Final Receipt</h2>
                                            </div>
                                            <div className="text-slate-400 font-black uppercase text-[10px] print:text-[7px] tracking-widest space-y-1">
                                                <p>Date: {booking?.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : "---"}</p>
                                                <p>{booking?.barcode ? `BARCODE: ${booking.barcode}` : `ID: ${booking?._id?.slice(-8).toUpperCase()}`}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>
                                {/* Patient Details */}
                                <div className="p-16 grid grid-cols-1 md:grid-cols-3 gap-12 border-b border-slate-50 dark:border-slate-800 print:p-0 print:py-8 print:grid-cols-3 print:gap-4 print:border-b">
                                    <div className="space-y-2 print:space-y-0">
                                        <p className="text-[10px] print:text-[7px] font-black text-slate-400 uppercase tracking-widest italic leading-none truncate mb-1">Patient Details</p>
                                        <h3 className="text-2xl print:text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase truncate leading-none mb-1">{booking?.patientName}</h3>
                                        <p className="text-sm print:text-[8px] font-bold text-slate-500 uppercase leading-none">{booking?.age} Years • {booking?.gender}</p>
                                    </div>
                                    <div className="space-y-2 print:space-y-0">
                                        <p className="text-[10px] print:text-[7px] font-black text-slate-400 uppercase tracking-widest italic leading-none truncate mb-1">Clinical Contact</p>
                                        <p className="text-lg print:text-sm font-black text-slate-900 dark:text-white leading-none mb-1">{booking?.phone || "---"}</p>
                                        <p className="text-sm print:text-[8px] font-bold text-slate-500 uppercase text-xs leading-none">Registered Mobile Node</p>
                                    </div>
                                    <div className="space-y-2 print:space-y-0">
                                        <p className="text-[10px] print:text-[7px] font-black text-slate-400 uppercase tracking-widest italic leading-none truncate mb-1">Referral Source</p>
                                        <p className="text-lg print:text-sm font-black text-slate-900 dark:text-white uppercase truncate leading-none mb-1">{booking?.referralName || "Self"}</p>
                                        <p className="text-sm print:text-[8px] font-bold text-slate-500 uppercase text-xs leading-none">Consultant Matrix</p>
                                    </div>
                                </div>

                                {/* Bill Items Matrix - Optimized for Upper-Half Efficiency */}
                                <div className="p-16 print:p-0 print:py-6">
                                    <div className="border-b border-slate-900 mb-6 pb-2 print:border-b print:mb-4">
                                        <div className="flex justify-between items-end">
                                            <h4 className="text-[11px] print:text-[8px] font-black uppercase tracking-[0.3em] text-slate-400 leading-none">Investigations Cluster</h4>
                                            <span className="text-[9px] print:text-[6px] font-bold text-slate-400 uppercase italic leading-none">Matrix Abstract</span>
                                        </div>
                                    </div>

                                    {/* Dual-Column Grid for Printing Beside Each Other */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-x-12 print:gap-x-10 gap-y-4 print:gap-y-2">
                                        {[...(booking?.tests || []), ...(booking?.packages || [])].map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center py-4 print:py-1 border-b border-slate-50 print:border-slate-100">
                                                <div className="min-w-0 pr-4">
                                                    <p className="text-lg print:text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none truncate">{item.name}</p>
                                                </div>
                                                <span className="shrink-0 font-black text-slate-900 dark:text-white text-lg print:text-[9px]">₹{item.price}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td>
                                {/* Totals Section - Compressed for Upper-Half Node */}
                                <div className="p-16 print:p-0 print:py-6 border-t-2 print:border-t border-slate-900 flex flex-col md:flex-row justify-between items-start gap-12 print:gap-4">
                                    <div className="space-y-4 print:space-y-1 max-w-sm">
                                        <div className="flex items-center gap-3">
                                            {booking?.paymentStatus === "Fully Paid" ? (
                                                <>
                                                    <CheckCircle2 size={24} className="print:w-3 print:h-3 text-emerald-500" />
                                                    <span className="font-black italic uppercase text-lg print:text-[8px] tracking-tighter text-emerald-500 leading-none">Payment Confirmed</span>
                                                </>
                                            ) : (
                                                <>
                                                    <AlertCircle size={24} className="print:w-3 print:h-3 text-red-500" />
                                                    <span className="font-black italic uppercase text-lg print:text-[8px] tracking-tighter text-red-500 leading-none">Payment Due</span>
                                                </>
                                            )}
                                        </div>
                                        {center?.showFooter !== false && (
                                            <p className="text-sm print:text-[6px] font-bold text-slate-400 italic leading-tight uppercase tracking-wide">
                                                {center?.footerText || "Computer generated invoice. No physical signature required per IT Act 2000."}
                                            </p>
                                        )}
                                    </div>

                                    <div className="w-full md:w-80 print:w-56 space-y-4 print:space-y-1">
                                        <div className="flex justify-between items-center text-sm print:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                            <span>Gross Amount</span>
                                            <span className="text-slate-900 dark:text-white">₹{booking?.totalAmount}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm print:text-[9px] font-bold text-red-500 uppercase tracking-widest leading-none">
                                            <span>Discount Applied</span>
                                            <span>- ₹{booking?.discount || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm print:text-[9px] font-bold text-slate-900 dark:text-white uppercase tracking-widest leading-none">
                                            <span>Net Payable</span>
                                            <span>₹{booking?.netAmount}</span>
                                        </div>
                                        <div className="h-[2px] bg-slate-100 dark:bg-slate-800 my-4 print:my-0.5" />
                                        <div className="flex justify-between items-end">
                                            <span className="text-2xl print:text-[10px] font-black italic tracking-tighter uppercase text-slate-900 dark:text-white leading-none">Amount Paid</span>
                                            <span className="text-5xl print:text-xl font-black text-emerald-500 tracking-tighter leading-none">₹{booking?.paidAmount || 0}</span>
                                        </div>
                                        {booking?.balance > 0 && (
                                            <div className="flex justify-between items-center text-sm print:text-[9px] font-black text-red-500 uppercase tracking-widest leading-none pt-2 mt-4 border-t border-slate-100">
                                                <span>Balance Due</span>
                                                <span>₹{booking.balance}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer Bar */}
                                {center?.showFooter !== false && (
                                    <div className="bg-slate-50 p-8 print:p-4 border-t border-slate-100 text-center">
                                        <p className="text-[10px] print:text-[8px] font-black text-slate-400 uppercase tracking-[0.5em] italic leading-none">Official Lab Copy • {center?.name}</p>
                                    </div>
                                )}
                                <div className="print-footer-spacer" />
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </motion.div>
        </div>
    );
}
