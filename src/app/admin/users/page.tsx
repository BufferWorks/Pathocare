"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
    Users,
    ShieldAlert,
    Search,
    Edit3,
    Trash2,
    Loader2,
    Building2,
    Lock,
    Unlock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AccessControlPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const filteredUsers = (Array.isArray(users) ? users : []).filter(u =>
        u?.name?.toLowerCase().includes(search.toLowerCase()) ||
        u?.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-12 pb-20">
            <div>
                <h2 className="text-6xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white">Access Control</h2>
                <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-[10px] mt-2 ml-1">Enterprise Rights Management & Authority Matrix</p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-6">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors w-6 h-6" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Scan for User Identity or Privilege Level..."
                        className="w-full h-18 bg-slate-50 dark:bg-slate-800 rounded-[2rem] pl-16 pr-8 outline-none font-bold text-lg"
                    />
                </div>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="py-24 text-center">
                        <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 italic">Decrypting Permission Lattice...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {filteredUsers.map((user, i) => (
                            <motion.div
                                key={user._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-4xl transition-all group relative overflow-hidden"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-8">
                                        <div className="w-20 h-20 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary font-black text-3xl shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-700">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black italic tracking-tighter uppercase">{user.name}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border italic",
                                        user.role === "SUPER_ADMIN" ? "bg-red-500/10 text-red-500 border-red-500/10" : "bg-blue-500/10 text-blue-500 border-blue-500/10"
                                    )}>
                                        {user.role}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-8 border-t border-slate-50 dark:border-slate-800">
                                    <div className="flex items-center gap-4 text-slate-400 text-[10px] font-black uppercase tracking-widest italic">
                                        <Building2 size={16} /> {user.centerId?.name || "Global Enterprise"}
                                    </div>
                                    <div className="flex gap-4">
                                        <Button variant="outline" className="w-12 h-12 p-0 rounded-2xl border-slate-100 italic">
                                            <Edit3 size={18} />
                                        </Button>
                                        <Button variant="outline" className="w-12 h-12 p-0 rounded-2xl border-slate-100 text-red-500 hover:bg-red-50 italic">
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
