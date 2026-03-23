"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Globe,
    Camera,
    Save,
    CheckCircle2,
    Loader2,
    Type,
    Layout,
    ArrowRight,
    Trash2,
    PlusCircle,
    AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CenterSettingsPage() {
    const [center, setCenter] = useState<any>(null);
    const [signatories, setSignatories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showHeader, setShowHeader] = useState(true);
    const [showFooter, setShowFooter] = useState(true);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/center/profile", { cache: "no-store" });
            const data = await res.json();
            setCenter(data);
            setSignatories(data.signatories || []);
            setShowHeader(data.showHeader ?? true);
            setShowFooter(data.showFooter ?? true);
            if (data.logo) setLogoPreview(data.logo);
        } catch (err) {
            console.error("Failed to fetch center profile", err);
        } finally {
            setLoading(false);
        }
    };

    const addSignatory = () => {
        setSignatories([...signatories, { name: "", designation: "" }]);
    };

    const removeSignatory = (index: number) => {
        setSignatories(signatories.filter((_, i) => i !== index));
    };

    const updateSignatory = (index: number, field: string, value: string) => {
        setSignatories(prev => prev.map((sig, i) =>
            i === index ? { ...sig, [field]: value } : sig
        ));
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError("Image is too large. Please use a logo smaller than 2MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoPreview(reader.result as string);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        try {
            const formData = new FormData(e.target as HTMLFormElement);
            const data: any = Object.fromEntries(formData.entries());

            if (logoPreview) data.logo = logoPreview;
            data.signatories = signatories;
            data.showHeader = showHeader;
            data.showFooter = showFooter;

            console.log("SENDING DATA TO API:", JSON.stringify(data, null, 2));

            const res = await fetch("/api/center/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to save profile changes.");
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            console.error("Update failed", err);
            setError(err.message || "Connection error: Failed to update center identity.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                <p className="font-black uppercase tracking-[0.5em] text-slate-300 text-[10px] italic">Synchronizing Profile Matrix...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h2 className="text-6xl font-black tracking-tighter uppercase text-slate-900 leading-none">Node Branding</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-3 ml-1">Laboratory Identity & Report Customization</p>
                </div>
                <AnimatePresence>
                    {saved && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-4 text-emerald-600 font-black uppercase text-[10px] tracking-[0.2em] bg-emerald-50 px-10 py-5 rounded-[2rem] border border-emerald-200 shadow-xl italic"
                        >
                            <CheckCircle2 size={20} className="not-italic" /> Identity Synchronized
                        </motion.div>
                    )}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            className="flex items-center gap-4 text-red-600 font-black uppercase text-[10px] tracking-[0.2em] bg-red-50 px-10 py-5 rounded-[2rem] border border-red-200 shadow-xl italic"
                        >
                            <AlertCircle size={20} className="not-italic" /> {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Visual Identity Hub */}
                <div className="lg:col-span-1 space-y-12">
                    <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
                        <div
                            className="relative cursor-pointer mb-10 group/logo"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="w-56 h-56 rounded-[3.5rem] bg-slate-50 flex items-center justify-center border-4 border-dashed border-slate-200 overflow-hidden relative transition-all group-hover/logo:border-blue-400 group-hover/logo:scale-105 duration-700">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-8 animate-in fade-in zoom-in duration-700" />
                                ) : (
                                    <div className="flex flex-col items-center gap-4 text-slate-300 group-hover/logo:text-blue-500 transition-colors">
                                        <Camera size={64} strokeWidth={1} />
                                        <span className="text-[10px] font-black uppercase tracking-widest italic text-slate-400">Upload Logo</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="bg-white text-blue-600 px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest shadow-lg">Change Logo</div>
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                        <h3 className="font-black text-3xl uppercase tracking-tighter mb-2 text-slate-900 leading-none italic">{center?.name || "Initializing..."}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic bg-slate-100 px-4 py-1.5 rounded-lg border border-slate-200">{center?.email}</p>
                    </div>

                    <div className="bg-blue-50/50 p-12 rounded-[4rem] border border-blue-100 space-y-6">
                        <h4 className="font-black italic uppercase tracking-[0.3em] text-[10px] text-blue-600 flex items-center gap-3">
                            <Layout size={20} className="not-italic" /> Branding Guidelines
                        </h4>
                        <p className="text-[13px] font-bold text-slate-500 leading-relaxed italic uppercase tracking-wider">
                            Your logo, tagline, and contact information uploaded here will automatically appear on all clinical reports and invoices generated for your patients.
                        </p>
                    </div>
                </div>

                {/* Information Lattice */}
                <div className="lg:col-span-2 space-y-10">
                    <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-sm space-y-12 relative overflow-hidden">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-6 italic">Laboratory Name</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-8 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-blue-600 transition-colors w-6 h-6" />
                                    <input name="name" defaultValue={center?.name} required className="w-full h-20 bg-slate-50 rounded-[2rem] pl-20 pr-10 outline-none font-bold text-xl shadow-inner border-2 border-transparent focus:border-blue-100 transition-all text-slate-900" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-6 italic">Support Contact (Phone)</label>
                                <div className="relative group">
                                    <Phone className="absolute left-8 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-blue-600 transition-colors w-6 h-6" />
                                    <input name="phone" defaultValue={center?.phone} required className="w-full h-20 bg-slate-50 rounded-[2rem] pl-20 pr-10 outline-none font-bold text-xl shadow-inner border-2 border-transparent focus:border-blue-100 transition-all text-slate-900" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-6 italic">Full Address</label>
                            <div className="relative group">
                                <MapPin className="absolute left-8 top-8 text-blue-300 group-focus-within:text-blue-600 transition-colors w-6 h-6" />
                                <textarea name="address" defaultValue={center?.address} rows={3} required className="w-full bg-slate-50 rounded-[2.5rem] pl-20 pr-10 py-8 outline-none font-bold text-xl shadow-inner border-2 border-transparent focus:border-blue-100 transition-all text-slate-900" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-6 italic">Website URL</label>
                                <div className="relative group">
                                    <Globe className="absolute left-8 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-blue-600 transition-colors w-6 h-6" />
                                    <input name="website" defaultValue={center?.website} className="w-full h-20 bg-slate-50 rounded-[2rem] pl-20 pr-10 outline-none font-bold text-xl shadow-inner border-2 border-transparent focus:border-blue-100 transition-all text-slate-900" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-6 italic">Company Tagline</label>
                                <div className="relative group">
                                    <Type className="absolute left-8 top-1/2 -translate-y-1/2 text-blue-300 group-focus-within:text-blue-600 transition-colors w-6 h-6" />
                                    <input name="tagline" defaultValue={center?.tagline} className="w-full h-20 bg-slate-50 rounded-[2rem] pl-20 pr-10 outline-none font-bold text-xl shadow-inner border-2 border-transparent focus:border-blue-100 transition-all text-slate-900" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-sm space-y-12">
                        <div className="flex items-center gap-4 px-6">
                            <h4 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">Report Headers & Footers</h4>
                            <div className="h-0.5 flex-1 bg-slate-50 mt-2" />
                        </div>
                        <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <label className="relative flex items-center gap-6 p-8 bg-slate-50 rounded-[2rem] border-2 border-transparent hover:border-blue-100 transition-all cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-8 h-8 rounded-xl border-2 border-slate-300 text-blue-600 focus:ring-blue-500 transition-all"
                                        checked={showHeader}
                                        onChange={(e) => setShowHeader(e.target.checked)}
                                    />
                                    <div>
                                        <p className="font-black uppercase tracking-widest text-[11px] text-slate-900 leading-none mb-1">Print Lab Header</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase italic">Show logo & center info on reports</p>
                                    </div>
                                </label>

                                <label className="relative flex items-center gap-6 p-8 bg-slate-50 rounded-[2rem] border-2 border-transparent hover:border-blue-100 transition-all cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-8 h-8 rounded-xl border-2 border-slate-300 text-blue-600 focus:ring-blue-500 transition-all"
                                        checked={showFooter}
                                        onChange={(e) => setShowFooter(e.target.checked)}
                                    />
                                    <div>
                                        <p className="font-black uppercase tracking-widest text-[11px] text-slate-900 leading-none mb-1">Print Lab Footer</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase italic">Show legal disclaimer & center name</p>
                                    </div>
                                </label>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-6 italic">Accreditation Header (e.g. NABL/ISO)</label>
                                <input name="headerText" defaultValue={center?.headerText} placeholder="e.g. ISO 9001:2015 CERTIFIED FACILITY" className="w-full h-20 bg-slate-50 rounded-[2rem] px-10 outline-none font-bold text-lg shadow-inner border-2 border-transparent focus:border-blue-100 transition-all uppercase italic text-slate-900" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 ml-6 italic">Legal Disclaimer / Footer Text</label>
                                <textarea name="footerText" defaultValue={center?.footerText} rows={2} placeholder="e.g. COMPUTER GENERATED REPORT. VALIDATION ENABLED." className="w-full bg-slate-50 rounded-[2rem] px-10 py-8 outline-none font-bold text-lg shadow-inner border-2 border-transparent focus:border-blue-100 transition-all uppercase italic text-slate-900" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-sm space-y-12">
                        <div className="flex items-center gap-4 px-6">
                            <h4 className="text-3xl font-black italic tracking-tighter uppercase text-slate-900 leading-none">Authorized Signatories</h4>
                            <div className="h-0.5 flex-1 bg-slate-50 mt-2" />
                            <Button
                                type="button"
                                onClick={addSignatory}
                                className="rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all px-6 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2 h-12"
                            >
                                <PlusCircle size={16} /> Add Doctor/Staff
                            </Button>
                        </div>

                        <div className="space-y-6">
                            {signatories.map((sig, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-6 items-end p-8 bg-slate-50 rounded-3xl border border-slate-100"
                                >
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Full Name & Qualifications</label>
                                        <input
                                            value={sig.name}
                                            onChange={(e) => updateSignatory(idx, 'name', e.target.value)}
                                            placeholder="e.g. Dr. Amit Bhardwaj (MD Pathologist)"
                                            className="w-full h-16 bg-white rounded-2xl px-6 outline-none font-bold text-lg shadow-sm border-2 border-transparent focus:border-blue-100 transition-all text-slate-900"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Official Designation</label>
                                        <input
                                            value={sig.designation}
                                            onChange={(e) => updateSignatory(idx, 'designation', e.target.value)}
                                            placeholder="e.g. Consultant Pathologist"
                                            className="w-full h-16 bg-white rounded-2xl px-6 outline-none font-bold text-lg shadow-sm border-2 border-transparent focus:border-blue-100 transition-all text-slate-900"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() => removeSignatory(idx)}
                                        className="h-16 w-16 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all p-0 flex items-center justify-center border-none"
                                    >
                                        <Trash2 size={24} />
                                    </Button>
                                </motion.div>
                            ))}
                            {signatories.length === 0 && (
                                <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-[3rem]">
                                    <p className="text-slate-400 font-bold italic uppercase text-xs tracking-widest leading-relaxed">No signatories configured.<br />Authorized signatures will be blank on reports.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Button type="submit" disabled={saving} className="w-full h-28 rounded-[3.5rem] bg-[#0f172a] text-white shadow-2xl text-3xl font-black italic uppercase tracking-tighter group overflow-hidden relative active:scale-[0.98] transition-all">
                        {saving ? (
                            <Loader2 className="animate-spin w-12 h-12" />
                        ) : (
                            <div className="flex items-center gap-6 relative z-10">
                                <Save className="group-hover:rotate-12 transition-transform w-10 h-10" />
                                Commit Enterprise Identity
                                <ArrowRight className="w-10 h-10 opacity-0 group-hover:opacity-100 group-hover:translate-x-6 transition-all duration-500" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                    </Button>
                </div>
            </form>
        </div>
    );
}
