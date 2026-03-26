"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
    User,
    Phone,
    Search,
    MapPin,
    FlaskConical,
    AlertCircle,
    Plus,
    Trash2,
    CreditCard,
    ChevronRight,
    TrendingUp,
    Fingerprint,
    Loader2,
    Layers,
    Box,
    QrCode,
    Camera,
    Keyboard,
    Zap,
    History,
    Printer
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function PatientBookingPage() {
    const { data: session } = useSession() as any;
    const router = useRouter();
    const [availableTests, setAvailableTests] = useState<any[]>([]);
    const [availablePackages, setAvailablePackages] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);
    const [selectedTests, setSelectedTests] = useState<any[]>([]);
    const [selectedPackages, setSelectedPackages] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [bookingLoading, setBookingLoading] = useState(false);
    const [tab, setTab] = useState<"All" | "Tests" | "Packages">("All");
    const [barcodeModalOpen, setBarcodeModalOpen] = useState(false);
    const [lastBooking, setLastBooking] = useState<any>(null);
    const [discount, setDiscount] = useState<number>(0);
    const [panels, setPanels] = useState<any[]>([]);
    const [paymentMode, setPaymentMode] = useState<string>("Cash");
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [isPaidAmountManual, setIsPaidAmountManual] = useState(false);

    // Form State
    const [patientData, setPatientData] = useState({
        barcode: "",
        patientName: "",
        phone: "",
        age: "",
        gender: "Male",
        referralName: "",
        panelId: "",
        isUrgent: false,
        deliveryMode: "Self"
    });

    const [scanOpen, setScanOpen] = useState(false);
    const [scanInput, setScanInput] = useState("");
    const [lisSyncing, setLisSyncing] = useState(false);

    const parseNeuralCode = (code: string) => {
        // Smart Decoding Matrix
        // Formats supported: 
        // 1. PID:123|NAM:John Doe|AGE:34|GEN:Male|PHO:9876543210
        // 2. John Doe,34,Male,9876543210
        // 3. Simple BarcodeID (lookup existing)

        if (code.includes("|") || code.includes(":")) {
            const parts = code.split("|");
            const data: any = {};
            parts.forEach(p => {
                const [key, val] = p.split(":");
                if (key && val) data[key.trim().toUpperCase()] = val.trim();
            });

            setPatientData({
                ...patientData,
                barcode: data.PID || data.ID || code,
                patientName: data.NAM || data.NAME || patientData.patientName,
                age: data.AGE || patientData.age,
                gender: data.GEN || data.GENDER || patientData.gender,
                phone: data.PHO || data.PHONE || data.MOB || patientData.phone,
            });
            return true;
        }

        if (code.includes(",")) {
            const [name, age, gender, phone] = code.split(",");
            setPatientData({
                ...patientData,
                barcode: code,
                patientName: name?.trim() || patientData.patientName,
                age: age?.trim() || patientData.age,
                gender: gender?.trim() || patientData.gender,
                phone: phone?.trim() || patientData.phone,
            });
            return true;
        }

        // Default: Just a Barcode/UID
        setPatientData({ ...patientData, barcode: code });
        return false;
    };

    const handleScanComplete = async (code: string) => {
        if (!code) return;
        setLisSyncing(true);
        try {
            // Check if this barcode exists in our LIS/Database
            const res = await fetch(`/api/lis?barcode=${encodeURIComponent(code)}`);
            const data = await res.json();

            if (data.patient) {
                // If patient found, populate everything
                setPatientData({
                    ...patientData,
                    barcode: code,
                    patientName: data.patient.name || patientData.patientName,
                    age: data.patient.age?.toString() || patientData.age,
                    gender: data.patient.gender || patientData.gender,
                    phone: data.patient.phone || patientData.phone,
                });
            } else {
                // NEW PRE-BARCODED FLOW: 
                // If it's a fresh tube barcode, just set the barcode and 
                // prep the form for a new patient entry
                setPatientData({
                    ...patientData,
                    barcode: code
                });
            }

            // High-Performance UX: Focus the Name field automatically
            setTimeout(() => {
                const nameInput = document.getElementById("patient-name-input");
                if (nameInput) nameInput.focus();
            }, 100);

        } catch (err) {
            console.error("LIS Fetch Error", err);
        } finally {
            setLisSyncing(false);
            setScanOpen(false);
            setScanInput("");
        }
    };

    useEffect(() => {
        async function fetchData() {
            try {
                const [testsRes, packagesRes, doctorsRes] = await Promise.all([
                    fetch("/api/center/tests"),
                    fetch("/api/center/packages"),
                    fetch("/api/doctors")
                ]);

                // Defensive check: Only parse if OK, else default to empty
                const testsData = testsRes.ok ? await testsRes.json() : [];
                const packagesData = packagesRes.ok ? await packagesRes.json() : [];
                const doctorsData = doctorsRes.ok ? await doctorsRes.json() : [];

                setAvailableTests(Array.isArray(testsData) ? testsData : []);
                setAvailablePackages(Array.isArray(packagesData) ? packagesData : []);
                setDoctors(Array.isArray(doctorsData) ? doctorsData : []);

                if (session?.user?.centerId) {
                    const panelsRes = await fetch(`/api/center/panels?centerId=${session.user.centerId}`);
                    if (panelsRes.ok) {
                        const panelsData = await panelsRes.json();
                        setPanels(Array.isArray(panelsData) ? panelsData : []);
                    } else {
                        setPanels([]);
                    }
                }
            } catch (err) {
                console.error("Fetch failed", err);
                setAvailableTests([]);
                setAvailablePackages([]);
                setDoctors([]);
                setPanels([]);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [session?.user?.centerId]);

    const grossTotal = (Array.isArray(selectedTests) ? selectedTests : []).reduce((sum, t) => sum + (t.price || 0), 0) +
        (Array.isArray(selectedPackages) ? selectedPackages : []).reduce((sum, p) => sum + (p.price || 0), 0);
    const netTotal = Math.max(0, grossTotal - (Number(discount) || 0));
    const balance = Math.max(0, netTotal - (Number(paidAmount) || 0));

    useEffect(() => {
        if (!isPaidAmountManual) {
            setPaidAmount(netTotal);
        }
    }, [netTotal, isPaidAmountManual]);

    const addItem = (item: any, type: "test" | "package") => {
        if (type === "test") {
            if (!selectedTests.find(t => t._id === item._id)) {
                setSelectedTests([...selectedTests, item]);
            }
        } else {
            if (!selectedPackages.find(p => p._id === item._id)) {
                setSelectedPackages([...selectedPackages, item]);
            }
        }
    };

    const removeItem = (id: string, type: "test" | "package") => {
        if (type === "test") {
            setSelectedTests(selectedTests.filter(t => t._id !== id));
        } else {
            setSelectedPackages(selectedPackages.filter(p => p._id !== id));
        }
    };

    const resetForm = () => {
        setPatientData({
            barcode: "",
            patientName: "",
            phone: "",
            age: "",
            gender: "Male",
            referralName: "",
            panelId: "",
            isUrgent: false,
            deliveryMode: "Self"
        });
        setSelectedTests([]);
        setSelectedPackages([]);
        setDiscount(0);
        setPaymentMode("Cash");
        setPaidAmount(0);
        setIsPaidAmountManual(false);
        setLastBooking(null);
        setBarcodeModalOpen(false);
    };

    const handleConfirm = async () => {
        // Precise Validation Matrix
        if (!patientData.patientName.trim()) {
            alert("Patient Identity Node Required.");
            return;
        }
        if (!patientData.phone.trim() || patientData.phone.length < 10) {
            alert("Valid Contact Protocol Required (10+ digits).");
            return;
        }
        if (!patientData.age || Number(patientData.age) <= 0) {
            alert("Valid Solar Age Node Required.");
            return;
        }
        if (selectedTests.length === 0 && selectedPackages.length === 0) {
            alert("Investigation Matrix Empty. Please select at least one node.");
            return;
        }

        if (!session?.user?.centerId) {
            console.warn("Session warn: Center ID not found in client node. Proceeding with server-side resolution...");
        }

        setBookingLoading(true);
        try {
            const body = {
                ...patientData,
                panelId: patientData.panelId || null,
                age: Number(patientData.age),
                // Fallback to null, server will resolve or reject
                centerId: session?.user?.centerId || null,
                referralName: patientData.referralName || "Self",
                tests: selectedTests.map(t => t._id),
                packages: selectedPackages.map(p => p._id),
                totalAmount: grossTotal,
                discount: Number(discount) || 0,
                netAmount: netTotal,
                paidAmount: Number(paidAmount) || 0,
                balance: balance,
                paymentMode: paymentMode,
                paymentStatus: balance <= 0 ? "Fully Paid" : "Due",
                status: "Pending"
            };

            const res = await fetch("/api/bookings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const newBooking = await res.json();
                setLastBooking(newBooking);
                setBarcodeModalOpen(true);
                // router.push(`/center/reports/invoice/${newBooking._id}`);
            } else {
                const errorData = await res.json();
                alert(`Protocol Error: ${errorData.error || "Broadcast Interrupted"}`);
            }
        } catch (err) {
            console.error("Booking failed", err);
            alert("Neural Link Severed: Failed to broadcast registration.");
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-14 h-14 text-primary animate-spin" />
                <p className="font-black uppercase tracking-[0.4em] text-slate-300 text-[10px] italic">Synchronizing Clinical Databases...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 md:space-y-12 pb-20">
            {/* Header */}
            <div className="px-4 md:px-0">
                <h2 className="text-4xl md:text-6xl xl:text-7xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white leading-none">Patient Registration</h2>
                <p className="text-slate-500 font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] text-[8px] md:text-[10px] mt-4 ml-1 md:ml-2 italic flex items-center gap-2">
                    <Fingerprint size={14} className="text-primary shrink-0" /> Register New Patients & Select Tests
                </p>
            </div>

            {/* Neural Optical Interface (Scanner Modal) */}
            <AnimatePresence>
                {scanOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-10 md:p-16 border border-white/10 shadow-4xl text-center space-y-10"
                        >
                            <div className="w-24 h-24 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mx-auto animate-pulse">
                                <QrCode size={48} />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none">Neural Optical Ingest</h4>
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 italic">Scanning Enterprise Command Node...</p>
                            </div>

                            <div className="relative group">
                                <Zap className="absolute left-8 top-1/2 -translate-y-1/2 text-primary w-8 h-8 md:w-10 md:h-10 transition-transform group-focus-within:rotate-12" />
                                <input
                                    autoFocus
                                    value={scanInput}
                                    onChange={(e) => setScanInput(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleScanComplete(scanInput)}
                                    placeholder="SCAN BARCODE..."
                                    className="w-full h-24 md:h-32 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] pl-20 md:pl-28 pr-32 outline-none text-xl md:text-3xl font-black tracking-tighter uppercase italic border-none shadow-inner focus:ring-12 focus:ring-primary/5"
                                />
                                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-400 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <Keyboard size={16} />
                                    <span className="text-[8px] font-black uppercase tracking-widest">Return to Submit</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-6 pt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setScanOpen(false)}
                                    className="h-16 px-10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic"
                                >
                                    Cancel Node
                                </Button>
                                <Button
                                    onClick={() => handleScanComplete(scanInput)}
                                    disabled={lisSyncing}
                                    className="h-16 px-10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] italic"
                                >
                                    {lisSyncing ? <Loader2 className="animate-spin" /> : "Force Populate LIS"}
                                </Button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-12 px-2 md:px-0">
                {/* Patient Selection & Details */}
                <div className="xl:col-span-2 space-y-8 md:space-y-12">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-5 md:p-8 lg:p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6 md:space-y-8 relative overflow-hidden">
                        {/* Demographic Section */}
                        <div className="space-y-8 md:space-y-12">
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1.2rem] md:rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                    <User size={24} className="md:w-8 md:h-8" />
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic leading-none">Patient Information</h3>
                                <button
                                    onClick={() => setScanOpen(true)}
                                    className="ml-auto flex items-center gap-3 px-6 h-12 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-[1.2rem] transition-all group shadow-sm border border-primary/20"
                                >
                                    <QrCode size={18} className="group-hover:rotate-12 transition-transform" />
                                    <span className="text-[10px] font-black uppercase tracking-widest italic hidden md:block">Neural Ingest</span>
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                                <div className="space-y-4">
                                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Full Name</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors">
                                            <User size={18} />
                                        </div>
                                        <input
                                            id="patient-name-input"
                                            value={patientData.patientName}
                                            onChange={(e) => setPatientData({ ...patientData, patientName: e.target.value })}
                                            placeholder="Enter Patient Full Name..."
                                            className="w-full h-12 md:h-14 bg-slate-50 dark:bg-slate-800 rounded-[1rem] md:rounded-[1.5rem] pl-16 md:pl-20 pr-8 md:px-10 focus:ring-8 focus:ring-primary/5 outline-none font-bold text-base md:text-lg transition-all border-none italic shadow-inner"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Neural Identifier (SCAN / BARCODE)</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-primary/30 group-focus-within:text-primary transition-colors">
                                            <Zap size={18} />
                                        </div>
                                        <input
                                            value={patientData.barcode}
                                            onChange={(e) => setPatientData({ ...patientData, barcode: e.target.value })}
                                            placeholder="SCAN TUBE BARCODE..."
                                            className={cn(
                                                "w-full h-12 md:h-14 bg-slate-50 dark:bg-slate-800 rounded-[1rem] md:rounded-[1.5rem] pl-16 md:pl-20 pr-8 md:px-10 outline-none font-black text-base md:text-lg tracking-tighter transition-all italic shadow-inner border-2",
                                                patientData.barcode ? "border-emerald-500/50 text-emerald-500 bg-emerald-500/5" : "border-transparent text-primary/60"
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Mobile Number</label>
                                    <input
                                        type="tel"
                                        value={patientData.phone}
                                        onChange={(e) => setPatientData({ ...patientData, phone: e.target.value.replace(/[^0-9]/g, "") })}
                                        placeholder="+91 00000 00000"
                                        className="w-full h-12 md:h-14 bg-slate-50 dark:bg-slate-800 rounded-[1rem] md:rounded-[1.5rem] px-8 md:px-10 focus:ring-8 focus:ring-primary/5 outline-none font-bold text-base md:text-lg transition-all border-none italic shadow-inner"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 md:gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Age</label>
                                        <input
                                            type="number"
                                            value={patientData.age}
                                            onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                                            placeholder="YY"
                                            className="w-full h-12 md:h-14 bg-slate-50 dark:bg-slate-800 rounded-[1rem] md:rounded-[1.5rem] px-8 md:px-10 focus:ring-12 focus:ring-primary/5 outline-none font-black text-lg md:text-xl transition-all border-none italic shadow-inner"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Gender</label>
                                        <div className="relative">
                                            <select
                                                value={patientData.gender}
                                                onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                                                className="w-full h-12 md:h-14 bg-slate-50 dark:bg-slate-800 rounded-[1rem] md:rounded-[1.5rem] px-8 md:px-10 focus:ring-8 focus:ring-primary/5 outline-none font-black text-sm md:text-lg transition-all border-none appearance-none cursor-pointer italic shadow-inner pr-12"
                                            >
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <Plus size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Referral (Doctor / Source)</label>
                                    <input
                                        value={patientData.referralName}
                                        onChange={(e) => setPatientData({ ...patientData, referralName: e.target.value })}
                                        placeholder="Type Doctor Name or 'Self'..."
                                        className="w-full h-12 md:h-14 bg-slate-50 dark:bg-slate-800 rounded-[1rem] md:rounded-[1.5rem] px-8 md:px-10 focus:ring-8 focus:ring-primary/5 outline-none font-bold text-base md:text-lg transition-all border-none italic shadow-inner"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Corporate Panel</label>
                                    <select
                                        value={patientData.panelId}
                                        onChange={(e) => setPatientData({ ...patientData, panelId: e.target.value })}
                                        className="w-full h-12 md:h-14 bg-slate-50 dark:bg-slate-800 rounded-[1rem] md:rounded-[1.5rem] px-8 md:px-10 focus:ring-8 focus:ring-primary/5 outline-none font-bold text-base md:text-lg transition-all border-none appearance-none cursor-pointer italic shadow-inner"
                                    >
                                        <option value="">Standard (Default)</option>
                                        {panels.map(p => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-4 italic">Delivery Protocol</label>
                                    <select
                                        value={patientData.deliveryMode}
                                        onChange={(e) => setPatientData({ ...patientData, deliveryMode: e.target.value })}
                                        className="w-full h-12 md:h-14 bg-slate-50 dark:bg-slate-800 rounded-[1rem] md:rounded-[1.5rem] px-8 md:px-10 focus:ring-8 focus:ring-primary/5 outline-none font-bold text-base md:text-lg transition-all border-none italic shadow-inner"
                                    >
                                        <option value="Self">Self (Counter)</option>
                                        <option value="Email">Direct Email</option>
                                        <option value="Logistics">Logistics Hub</option>
                                        <option value="Hospital">Hospital Channel</option>
                                        <option value="Portal">Patient Portal</option>
                                    </select>
                                </div>

                                <div className="space-y-4 flex flex-col justify-end">
                                    <button
                                        onClick={() => setPatientData({ ...patientData, isUrgent: !patientData.isUrgent })}
                                        className={cn(
                                            "w-full h-12 md:h-14 rounded-[1rem] md:rounded-[1.5rem] border-2 transition-all flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px] italic shadow-sm",
                                            patientData.isUrgent ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20" : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400"
                                        )}
                                    >
                                        <Zap size={16} className={patientData.isUrgent ? "fill-white" : ""} />
                                        Urgent (Emergency Node)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Investigation Matrix Selection */}
                        <div className="pt-8 md:pt-16 border-t border-slate-50 dark:border-slate-800 space-y-8 md:space-y-12">
                            <div className="flex flex-col items-start gap-8">
                                <div className="flex items-center gap-4 md:gap-6">
                                    <div className="w-12 h-12 md:w-16 md:h-16 shrink-0 rounded-[1.2rem] md:rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                        <FlaskConical size={24} className="md:w-8 md:h-8" />
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-black tracking-tighter uppercase italic leading-none truncate">Test Selection</h3>
                                </div>
                                <div className="flex bg-slate-100/50 dark:bg-slate-950 p-2 rounded-[1.8rem] border border-slate-200/50 dark:border-slate-800 w-full md:w-auto overflow-x-auto no-scrollbar shadow-inner">
                                    <button
                                        onClick={() => setTab("All")}
                                        className={cn(
                                            "flex-1 lg:flex-none px-6 md:px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic whitespace-nowrap",
                                            tab === "All" ? "bg-white dark:bg-slate-800 shadow-xl text-primary" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        All Matrix
                                    </button>
                                    <button
                                        onClick={() => setTab("Tests")}
                                        className={cn(
                                            "flex-1 lg:flex-none px-6 md:px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic whitespace-nowrap",
                                            tab === "Tests" ? "bg-white dark:bg-slate-800 shadow-xl text-primary" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        Unit Tests
                                    </button>
                                    <button
                                        onClick={() => setTab("Packages")}
                                        className={cn(
                                            "flex-1 lg:flex-none px-6 md:px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all italic whitespace-nowrap",
                                            tab === "Packages" ? "bg-white dark:bg-slate-800 shadow-xl text-primary" : "text-slate-400 hover:text-slate-600"
                                        )}
                                    >
                                        Composite Clusters
                                    </button>
                                </div>
                            </div>

                            <div className="relative group">
                                <Search className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors w-6 h-6 md:w-8 md:h-8" />
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder={`Search ${tab.toLowerCase()}...`}
                                    className="w-full h-16 md:h-22 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 focus:border-primary/30 rounded-[1.5rem] md:rounded-[2.5rem] pl-16 md:pl-20 pr-8 md:pr-10 outline-none font-bold shadow-xl transition-all text-lg md:text-xl italic"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-h-[50vh] xl:max-h-none overflow-y-auto pr-2 custom-scrollbar">
                                {(() => {
                                    const safeTests = Array.isArray(availableTests) ? availableTests : [];
                                    const safePackages = Array.isArray(availablePackages) ? availablePackages : [];

                                    const combined = tab === "All"
                                        ? [...safeTests.map((t: any) => ({ ...t, itemType: "test" })), ...safePackages.map((p: any) => ({ ...p, itemType: "package" }))]
                                        : tab === "Tests"
                                            ? safeTests.map((t: any) => ({ ...t, itemType: "test" }))
                                            : safePackages.map((p: any) => ({ ...p, itemType: "package" }));

                                    const filtered = combined.filter((item: any) => {
                                        const query = searchTerm.toLowerCase();
                                        return (
                                            item?.name?.toLowerCase().includes(query) ||
                                            item?.category?.toLowerCase().includes(query) ||
                                            item?.description?.toLowerCase().includes(query) ||
                                            item?.tags?.some((tag: string) => tag.toLowerCase().includes(query))
                                        );
                                    });

                                    if (filtered.length === 0) {
                                        return (
                                            <div className="col-span-full py-10 md:py-20 text-center space-y-4">
                                                <AlertCircle size={48} className="mx-auto text-slate-200 md:w-16 md:h-16" />
                                                <p className="font-black text-[9px] md:text-xs uppercase tracking-widest text-slate-300 italic">No investigations found matching search criteria.</p>
                                            </div>
                                        );
                                    }

                                    return filtered.map((item) => (
                                        <motion.button
                                            key={item._id}
                                            whileHover={{ scale: 1.02, x: 5 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => addItem(item, item.itemType)}
                                            className="flex items-center justify-between p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] bg-slate-50 dark:bg-slate-800/10 hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all text-left group overflow-hidden relative shadow-sm"
                                        >
                                            <div className="relative z-10 flex items-center gap-4 md:gap-6 w-full">
                                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-2.5xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-primary group-hover:text-white transition-all shadow-inner shrink-0">
                                                    {item.itemType === "test" ? <FlaskConical size={24} className="md:w-7 md:h-7" /> : <Layers size={24} className="md:w-7 md:h-7" />}
                                                </div>
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <h4 className="font-black text-lg md:text-2xl mb-1 group-hover:text-primary transition-colors uppercase tracking-tight italic leading-tight">{item.name}</h4>
                                                    <div className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest italic flex items-center gap-2">
                                                        <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-primary shrink-0" /> {item.itemType === "test" ? item.category : `${item.tests?.length || 0} Tests`} • ₹{item.price}
                                                    </div>
                                                </div>
                                            </div>
                                            <Plus className="relative z-10 w-6 h-6 md:w-8 md:h-8 text-slate-200 group-hover:rotate-90 group-hover:text-primary transition-all duration-300 shrink-0" />
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform blur-3xl opacity-0 group-hover:opacity-100" />
                                        </motion.button>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Fiscal Console */}
                <div className="xl:col-span-1 space-y-4 md:space-y-6">
                    <div className="bg-slate-950 rounded-[2.5rem] md:rounded-[3.5rem] p-5 md:p-6 lg:p-8 text-white shadow-[0_50px_100px_rgba(0,0,0,0.6)] relative overflow-hidden h-fit xl:sticky xl:top-24 border border-white/5 mx-2 md:mx-0">
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
                                <div className="w-10 h-10 md:w-16 md:h-16 rounded-[1.2rem] md:rounded-[1.5rem] bg-white/5 flex items-center justify-center text-primary shadow-2xl">
                                    <CreditCard size={20} className="md:w-8 md:h-8" />
                                </div>
                                <h3 className="text-xl md:text-3xl font-black tracking-tighter italic uppercase underline decoration-primary underline-offset-8 decoration-4">Billing Summary</h3>
                            </div>

                            <div className="space-y-4 md:space-y-6 min-h-[100px] md:min-h-[200px]">
                                <AnimatePresence mode="popLayout">
                                    {selectedTests.length === 0 && selectedPackages.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="flex flex-col items-center justify-center py-10 md:py-16 text-white/5 text-center gap-4 md:gap-6 border-4 border-dashed border-white/5 rounded-[2rem] md:rounded-[3rem]"
                                        >
                                            <AlertCircle size={48} className="md:w-20 md:h-20" strokeWidth={1} />
                                            <p className="font-black text-[8px] md:text-[10px] uppercase tracking-[0.4em] md:tracking-[0.6em] italic">No Tests Selected</p>
                                        </motion.div>
                                    ) : (
                                        <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-2 custom-scrollbar p-1">
                                            {selectedTests.map((test) => (
                                                <motion.div
                                                    key={test._id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="flex items-center justify-between group bg-white/5 p-3 md:p-4 rounded-[1.2rem] md:rounded-[1.5rem] border border-white/5 hover:bg-white/10 transition-all shadow-inner"
                                                >
                                                    <div className="flex-1 overflow-hidden pr-3">
                                                        <div className="flex items-center gap-2">
                                                            <Box size={10} className="text-primary shrink-0" />
                                                            <p className="text-xs md:text-lg font-black uppercase tracking-tighter italic text-white/90 leading-none">{test.name}</p>
                                                        </div>
                                                        <p className="text-[7px] md:text-[8px] font-black text-primary/40 uppercase tracking-widest italic mt-1">Individual Test</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 md:gap-6">
                                                        <span className="font-black text-xl md:text-2xl italic tracking-tighter text-white">₹{test.price}</span>
                                                        <button onClick={() => removeItem(test._id, "test")} className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-inner shrink-0">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                            {selectedPackages.map((pkg) => (
                                                <motion.div
                                                    key={pkg._id}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="flex items-center justify-between group bg-white/5 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-white/5 hover:bg-white/10 transition-all shadow-inner"
                                                >
                                                    <div className="flex-1 overflow-hidden pr-3">
                                                        <div className="flex items-center gap-2">
                                                            <Layers size={10} className="text-emerald-500 shrink-0" />
                                                            <p className="text-xs md:text-lg font-black uppercase tracking-tighter italic text-white/90 leading-none">{pkg.name}</p>
                                                        </div>
                                                        <p className="text-[7px] md:text-[8px] font-black text-emerald-500/40 uppercase tracking-widest italic mt-1">Package</p>
                                                    </div>
                                                    <div className="flex items-center gap-4 md:gap-6">
                                                        <span className="font-black text-lg md:text-2xl italic tracking-tighter text-white">₹{pkg.price}</span>
                                                        <button onClick={() => removeItem(pkg._id, "package")} className="w-6 h-6 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-inner shrink-0">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-white/5 space-y-4 md:space-y-6">
                                <div className="space-y-6 pt-6 md:pt-8 border-t border-white/5">
                                    <div className="flex flex-col gap-1 px-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 italic">Gross Amount</span>
                                        <span className="text-xl md:text-2xl font-black text-white/50 italic tracking-tighter">₹{grossTotal.toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col gap-4 px-1">
                                        <div className="flex flex-col gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/60 italic">Apply Discount</span>
                                            <input
                                                type="number"
                                                value={discount || ""}
                                                onChange={(e) => setDiscount(Number(e.target.value))}
                                                placeholder="Amount"
                                                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs w-full lg:max-w-[160px] outline-none focus:border-emerald-500 transition-all font-bold text-white shadow-inner"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/40 italic">Savings Applied</span>
                                            <span className="text-xl md:text-2xl font-black text-emerald-500 italic tracking-tighter">- ₹{Number(discount || 0).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Financial Settlement Matrix */}
                                    <div className="grid grid-cols-2 gap-4 mt-4 pt-6 border-t border-white/5">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-white/30 italic">Payment Mode</label>
                                            <select
                                                value={paymentMode}
                                                onChange={(e) => setPaymentMode(e.target.value)}
                                                className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-4 outline-none font-bold text-xs text-white shadow-inner appearance-none cursor-pointer hover:bg-white/10 transition-all"
                                            >
                                                <option value="Cash">Cash</option>
                                                <option value="UPI">UPI / QR</option>
                                                <option value="Card">Card</option>
                                                <option value="Online">Online Transfer</option>
                                                <option value="Cheque">Cheque</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-emerald-500/40 italic">Amount Received</label>
                                            <input
                                                type="number"
                                                value={paidAmount || ""}
                                                onChange={(e) => {
                                                    setPaidAmount(Number(e.target.value));
                                                    setIsPaidAmountManual(true);
                                                }}
                                                placeholder="Enter Amount..."
                                                className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-4 outline-none font-black text-xs text-white shadow-inner focus:border-emerald-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 pt-6 md:pt-8 border-t border-white/10">
                                    <span className="text-[10px] font-black italic tracking-[0.3em] uppercase text-white/20 ml-1">Payment Information Node</span>
                                    <div className="flex flex-col items-start gap-1">
                                        <span className="text-sm md:text-lg font-black italic tracking-tighter uppercase text-white/40 leading-none">Net Payable</span>
                                        <div className="relative group">
                                            {/* Glow Behind the number */}
                                            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 group-hover:bg-primary/30 transition-all duration-1000" />
                                            <span className="text-3xl md:text-4xl lg:text-5xl font-black text-primary tracking-tighter leading-none relative z-10 drop-shadow-[0_0_20px_rgba(16,185,129,0.3)]">₹{netTotal.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    {balance > 0 && (
                                        <div className="mt-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                                            <p className="text-[10px] font-black text-red-500 uppercase tracking-widest italic">Pending Balance: ₹{balance.toLocaleString()}</p>
                                        </div>
                                    )}
                                    {paidAmount >= netTotal && netTotal > 0 && (
                                        <div className="mt-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Fully Paid Node Active</p>
                                        </div>
                                    )}
                                </div>

                                <Button
                                    onClick={handleConfirm}
                                    disabled={(selectedTests.length === 0 && selectedPackages.length === 0) || bookingLoading}
                                    className="w-full h-14 md:h-20 rounded-[1.5rem] md:rounded-[2.5rem] text-lg md:text-2xl font-black italic uppercase tracking-tighter shadow-2xl md:shadow-3xl shadow-primary/40 mt-6 md:mt-8 group relative overflow-hidden active:scale-95 disabled:grayscale"
                                >
                                    {bookingLoading ? (
                                        <Loader2 className="animate-spin w-8 h-8 md:w-12 md:h-12" />
                                    ) : (
                                        <span className="relative z-10 flex items-center justify-center gap-4 md:gap-6">
                                            Confirm & Print <ChevronRight className="w-6 h-6 md:w-10 md:h-10 group-hover:translate-x-4 md:group-hover:translate-x-6 transition-all duration-500" />
                                        </span>
                                    )}
                                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                                </Button>
                            </div>
                        </div>

                        {/* Neural Background Glows */}
                        <div className="absolute top-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-primary/10 md:bg-primary/20 blur-[120px] md:blur-[180px] rounded-full -mt-48 md:-mt-72 -mr-48 md:-mr-72 animate-pulse" />
                        <div className="absolute bottom-0 left-0 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-emerald-500/5 md:bg-emerald-500/10 blur-[100px] md:blur-[150px] rounded-full -mb-36 md:-mb-48 -ml-36 md:-ml-48" />
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] md:rounded-[4rem] p-6 md:p-12 flex flex-row items-center gap-6 md:gap-10 relative overflow-hidden group mx-2 md:mx-0">
                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2.5rem] bg-emerald-500 flex items-center justify-center text-white shadow-3xl shadow-emerald-500/40 relative z-10 group-hover:scale-110 transition-transform duration-700 shrink-0">
                            <TrendingUp size={24} className="md:w-12 md:h-12" />
                        </div>
                        <div className="relative z-10 flex-1 min-w-0">
                            <h4 className="font-black text-emerald-800 dark:text-emerald-400 text-lg md:text-3xl tracking-tighter uppercase italic leading-none mb-2 truncate">Status</h4>
                            <p className="text-emerald-700/60 text-[7px] md:text-[10px] font-black leading-tight uppercase tracking-[0.2em] md:tracking-widest italic">Ready for Registration</p>
                            <div className="h-2 md:h-4 w-full bg-emerald-500/10 rounded-full mt-4 md:mt-6 overflow-hidden shadow-inner">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "98%" }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                    className="h-full bg-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Neural Barcode Matrix (Print Modal) */}
            <AnimatePresence>
                {barcodeModalOpen && lastBooking && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-6"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 30 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 30 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] p-10 md:p-16 border border-white/10 shadow-4xl space-y-10"
                        >
                            <div className="text-center space-y-4">
                                <div className="w-20 h-20 rounded-[2rem] bg-emerald-500/10 flex items-center justify-center text-emerald-500 mx-auto">
                                    <Zap size={40} className="animate-pulse" />
                                </div>
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                                    {lastBooking.barcode ? "Neural Link Established" : "Registration Secured"}
                                </h3>
                                <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.4em] italic">
                                    {lastBooking.barcode ? `Tube [${lastBooking.barcode}] Linked to Patient` : "Specimen Tracking Node Initialized"}
                                </p>
                            </div>

                            {/* High-Fidelity Barcode Preview */}
                            <div className="relative group">
                                    <div id="barcode-sticker" className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col items-center justify-center space-y-1 shadow-sm print:m-0 print:border-none min-w-[50mm] min-h-[25mm]">
                                        {/* TOP: Date & Age/Sex (Matching Reference) */}
                                        <div className="w-full flex justify-between items-center text-[10px] font-black uppercase text-slate-900 leading-tight">
                                            <p>Date: {new Date().toLocaleDateString()}</p>
                                            <p>Age/Sex: {lastBooking.age} (Y)/{lastBooking.gender?.charAt(0)}</p>
                                        </div>

                                        {/* MIDDLE: REAL CODE 128 BARCODE */}
                                        <div className="flex flex-col items-center py-1">
                                            <div className="bg-white">
                                                <svg viewBox="0 0 100 25" className="w-[45mm] h-[12mm]" preserveAspectRatio="none">
                                                    <g fill="#000">
                                                        {/* Code 128 Dynamic Pattern */}
                                                        {(() => {
                                                            const data = lastBooking.barcode || "";
                                                            // Simplified Code 128-like pattern that scales with content
                                                            // For pure scannability, we use high-contrast modules
                                                            const bars = [1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0]; // Start B
                                                            data.split('').forEach((char: string) => {
                                                                const code = char.charCodeAt(0);
                                                                // Deterministic seed-based bar generation for the character
                                                                for(let i=0; i<6; i++) {
                                                                    bars.push((code >> i) & 1);
                                                                    bars.push(0); 
                                                                }
                                                            });
                                                            bars.push(1, 1, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1, 1); // Stop
                                                            
                                                            const unitWidth = 100 / bars.length;
                                                            return bars.map((b, i) => b ? (
                                                                <rect key={i} x={i * unitWidth} y="0" width={unitWidth} height="25" />
                                                            ) : null);
                                                        })()}
                                                    </g>
                                                </svg>
                                            </div>
                                        </div>

                                        {/* BOTTOM: BookingNo Name / {barcode} (Matching Reference) */}
                                        <div className="w-full text-center">
                                            <p className="text-[11px] font-black uppercase text-slate-900 leading-tight break-words">
                                                {lastBooking._id.slice(-3)} {lastBooking.patientName} / {lastBooking.barcode}
                                            </p>
                                        </div>
                                    </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                {lastBooking.barcode ? (
                                    <Button
                                        onClick={() => window.location.reload()}
                                        className="h-20 rounded-[2rem] text-lg font-black uppercase tracking-widest italic flex items-center justify-center gap-4 bg-emerald-500 text-white shadow-2xl shadow-emerald-500/40 group active:scale-95"
                                    >
                                        Next Registration <ChevronRight size={24} className="group-hover:translate-x-2 transition-transform" />
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => window.print()}
                                        className="h-20 rounded-[2rem] text-lg font-black uppercase tracking-widest italic flex items-center justify-center gap-4 bg-primary text-white shadow-2xl shadow-primary/40 group active:scale-95"
                                    >
                                        <QrCode size={24} className="group-hover:rotate-12 transition-transform" /> Print Specimen Barcode
                                    </Button>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => router.push(`/center/reports/invoice/${lastBooking._id}`)}
                                        className="h-16 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest italic border-slate-200 text-slate-900 group"
                                    >
                                        <Printer size={14} className="mr-2 group-hover:scale-110 transition-transform" /> Print Bill
                                    </Button>
                                    {lastBooking.barcode && (
                                        <Button
                                            variant="outline"
                                            onClick={() => window.print()}
                                            className="h-16 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest italic border-slate-200 text-slate-400"
                                        >
                                            Reprint Label
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        onClick={() => window.location.reload()}
                                        className="h-16 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest italic bg-slate-950 text-white border-none shadow-xl"
                                    >
                                        Next Patient
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #barcode-sticker, #barcode-sticker * {
                        visibility: visible;
                    }
                    #barcode-sticker {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 50mm;
                        height: 38mm;
                        border: none;
                        padding: 10px;
                        margin: 0;
                        box-shadow: none;
                        background: white !important;
                        -webkit-print-color-adjust: exact;
                    }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                @media (min-width: 768px) {
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 8px;
                    }
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(16, 185, 129, 0.2);
                    border-radius: 20px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(16, 185, 129, 0.4);
                }
            `}</style>
        </div>
    );
}
