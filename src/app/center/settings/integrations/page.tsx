"use client";

import { useState, useEffect, useRef } from "react";
import {
    Cpu,
    Activity,
    Wifi,
    CheckCircle2,
    AlertCircle,
    Settings,
    RefreshCcw,
    Zap,
    FlaskConical,
    Dna,
    Thermometer,
    Network,
    ShieldCheck,
    Building2,
    ChevronLeft,
    Loader2,
    ArrowRight,
    Search,
    Terminal,
    Power,
    Usb,
    Radio,
    ZapOff,
    Database,
    X,
    Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function IntegrationSettingsPage() {
    const { data: session, status } = useSession() as any;
    const [view, setView] = useState<"centers" | "machines">("centers");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [centers, setCenters] = useState<any[]>([]);
    const [myCenter, setMyCenter] = useState<any>(null);
    const [selectedCenter, setSelectedCenter] = useState<any>(null);
    const [nodes, setNodes] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [provisioningType, setProvisioningType] = useState("HEMATOLOGY");
    const [customMachineName, setCustomMachineName] = useState("");
    const [customProtocol, setCustomProtocol] = useState("ASTM");
    const [isEditingNode, setIsEditingNode] = useState(false);
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
    const [globalKillSwitch, setGlobalKillSwitch] = useState(false);
    const [isProvisioningLoading, setIsProvisioningLoading] = useState(false);
    
    // --- WEB SERIAL STATE ---
    const [activePort, setActivePort] = useState<any>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
    const [terminalInput, setTerminalInput] = useState("");
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [liveData, setLiveData] = useState<any>(null);
    const [selectedMachineForLive, setSelectedMachineForLive] = useState<any>(null);
    const [hostIP, setHostIP] = useState<string>("");
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [baudRate, setBaudRate] = useState(9600);
    const [currentSampleId, setCurrentSampleId] = useState<string>("");
    const [sessionResults, setSessionResults] = useState<any[]>([]);
    const [syncPulse, setSyncPulse] = useState(false);
    const [connectionMode, setConnectionMode] = useState<"SERIAL" | "NETWORK">("SERIAL");
    const [isExecuting, setIsExecuting] = useState(false);
    const [lastLogSync, setLastLogSync] = useState<string[]>([]);
    const activeReader = useRef<any>(null);
    const disconnectLock = useRef(false);
    const terminalEndRef = useRef<HTMLDivElement>(null);

    // Dynamic Scrolling for Terminal
    const scrollToBottom = () => {
        terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (terminalLogs.length > 0) scrollToBottom();
    }, [terminalLogs]);

    useEffect(() => {
        let interval: any;
        if (isTerminalOpen && connectionMode === "NETWORK" && selectedMachineForLive) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/center/machines`);
                    const data = await res.json();
                    if (data.type === "machines") {
                        if (data.hostIP) setHostIP(data.hostIP);
                        const updated = data.data.find((m: any) => m._id === selectedMachineForLive?._id);
                        if (updated) {
                            setSelectedMachineForLive(updated);
                            // Merge Cloud Logs into Terminal at high velocity
                            if (updated.terminalLogs && updated.terminalLogs.length > 0) {
                                const newLogs = updated.terminalLogs.filter((l: string) => !terminalLogs.includes(l));
                                if (newLogs.length > 0) {
                                    setTerminalLogs(prev => [...newLogs, ...prev].slice(0, 150));
                                }
                            }
                        }
                    }
                } catch (err) {}
            }, 500); // Ultra-high frequency for real-time shell experience
        }
        return () => clearInterval(interval);
    }, [isTerminalOpen, connectionMode, selectedMachineForLive?._id, terminalLogs]);

    const renderAnsiLog = (text: string) => {
        // Clinical ANSI Decoder: Translates hardware stdout colors to web-safe CSS
        const parts = text.split(/(\x1b\[\d+m)/g);
        return parts.map((part, i) => {
            if (part === "\x1b[32m") return <span key={i} className="text-emerald-400 font-black">pathocore@node ~ % </span>;
            if (part === "\x1b[31m") return <span key={i} className="text-red-500 font-bold">error: </span>;
            if (part === "\x1b[33m") return <span key={i} className="text-amber-400 italic">SYSTEM: </span>;
            if (part === "\x1b[35m") return <span key={i} className="text-purple-400 font-black">HANDSHAKE: </span>;
            if (part === "\x1b[36m") return <span key={i} className="text-indigo-400">STATUS: </span>;
            if (part === "\x1b[0m") return null;
            return <span key={i}>{part.replace(/\x1b\[\d+m/g, '')}</span>;
        });
    };

    const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

    const fetchCenterProfile = async () => {
        try {
            const res = await fetch("/api/center/profile");
            const data = await res.json();
            if (!data.error) {
                setMyCenter(data);
                if (!session?.user?.role || session.user.role !== "SUPER_ADMIN") {
                    setSelectedCenter(data);
                }
            }
        } catch (err) {}
    };

    useEffect(() => {
        if (status === "unauthenticated") {
            redirect("/auth/login");
        }
        if (status === "authenticated") {
            if (isSuperAdmin) {
                fetchCenters();
            } else {
                fetchMachines(session.user.centerId);
                fetchCenterProfile();
                setView("machines");
            }
        }
    }, [status, isSuperAdmin]);

    const fetchCenters = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/center/machines");
            const data = await res.json();
            if (data.type === "centers") {
                setCenters(data.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMachines = async (centerId: string) => {
        setRefreshing(true);
        try {
            const res = await fetch(`/api/center/machines?centerId=${centerId}`);
            const data = await res.json();
            setNodes(data.data);
            if (data.hostIP) setHostIP(data.hostIP);
            if (isSuperAdmin) {
                setSelectedCenter(centers.find(c => c._id === centerId) || { name: data.centerName, _id: centerId });
                setView("machines");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setRefreshing(false);
            setLoading(false);
        }
    };

    const toggleNode = async (machineId: string, currentStatus: boolean) => {
        if (!isSuperAdmin) return;
        try {
            const res = await fetch("/api/center/machines", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ machineId, isPaused: !currentStatus })
            });
            if (res.ok) {
                setNodes(nodes.map(n => n._id === machineId ? { ...n, isPaused: !currentStatus } : n));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const nodeGlobalKill = async () => {
        if (!isSuperAdmin) return;
        try {
            const res = await fetch("/api/center/machines", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ globalKill: true, centerId: selectedCenter?._id || session?.user?.centerId })
            });
            if (res.ok) {
                setNodes(nodes.map(n => ({ ...n, isPaused: true })));
                setGlobalKillSwitch(true);
                setTimeout(() => setGlobalKillSwitch(false), 3000);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const deleteNode = async (machineId: string) => {
        if (!isSuperAdmin) return;
        try {
            const res = await fetch(`/api/center/machines?machineId=${machineId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setNodes(nodes.filter(n => n._id !== machineId));
                alert("NODE DECOMMISSIONED: Provisioning terminated successfully.");
            } else {
                const errData = await res.json();
                alert(`TERMINATION FAILED: ${errData.error || "Unknown Error"}`);
            }
        } catch (err: any) {
            console.error(err);
            alert(`CRITICAL ERROR: ${err.message}`);
        }
    };

    const connectToMachine = async (machine: any) => {
        setSelectedMachineForLive(machine);
        setIsTerminalOpen(true);
        setTerminalLogs([]);
        
        // If it's a network connection, we don't trigger the Serial API at all
        if (connectionMode === "NETWORK" || machine.port === "ETHERNET") {
            addLog(`HANDSHAKE: Network Node identified. Use LAN bridge to proceed.`);
            return;
        }

        // Only trigger Serial if explicitly requested or in Serial mode
        // For now, we only open the modal. The user can click 'Connect' inside.
    };

    const establishSerialLink = async () => {
        if (!selectedMachineForLive) return;
        setIsConnecting(true);
        try {
            if (!("serial" in navigator)) {
                alert("VECTOR_REFUSED: Your browser does not support Web Serial API. Please use Chrome or Edge.");
                setIsConnecting(false);
                return;
            }

            if (activePort) {
                await disconnectMachine();
            }

            const port = await (navigator as any).serial.requestPort();
            await port.open({ baudRate });
            setActivePort(port);
            addLog(`NODE_LINKED: Port authorized at ${baudRate} BAUD.`);
            readData(port, selectedMachineForLive);
        } catch (err: any) {
            console.error("Link Error:", err);
            addLog(`LINK_ABORTED: ${err.message}`);
            if (err.name === 'NotFoundError') return; // User cancelled port selection
        } finally {
            setIsConnecting(false);
        }
    };

    // --- NEURAL PERSISTENCE (AUTO-RESUME) ---
    useEffect(() => {
        const autoResume = async () => {
            if ("serial" in navigator && !isSuperAdmin && nodes.length > 0) {
                try {
                    const authorizedPorts = await (navigator as any).serial.getPorts();
                    if (authorizedPorts.length > 0) {
                        addLog("PERSISTENCE_DETECTED: Attempting automated handshake...");
                        // We take the first active node as the target
                        connectToMachine(nodes[0]);
                    }
                } catch (err) {
                    console.log("AUTO_RESUME_SKIPPED");
                }
            }
        };
        
        if (nodes.length > 0) {
            autoResume();
        }
    }, [nodes.length, isSuperAdmin]);

    const disconnectMachine = async () => {
        if (disconnectLock.current) return;
        disconnectLock.current = true;
        
        try {
            addLog("TERMINATION_ENGAGED: Initiating atomic teardown sequence...");

            if (activeReader.current) {
                const reader = activeReader.current;
                activeReader.current = null;
                await reader.cancel().catch(() => {});
                // Note: releaseLock is handled by the finally block in readData
                addLog("READER_CANCELLED: Neural scan signaled to stop.");
            }

            if (activePort) {
                const port = activePort;
                setActivePort(null);
                
                // Allow a small grace period for the reader loop to exit finally block
                await new Promise(resolve => setTimeout(resolve, 100));
                
                await port.close().catch((err: any) => {
                    if (err.name !== 'InvalidStateError') throw err;
                });
                addLog("BRIDGE_TERMINATED: Physical connection severed.");
            }
        } catch (err: any) {
            console.error("DISCONNECT_ERROR:", err);
            addLog(`FAULT: ${err.message}`);
        } finally {
            disconnectLock.current = false;
        }
    };

    const terminateDiagnosticProcess = async () => {
        try {
            const res = await fetch("/api/terminal/run", { method: "DELETE" });
            const data = await res.json();
            addLog(`\x1b[31mHALT:\x1b[0m ${data.status}`);
            setIsExecuting(false);
        } catch (e) {
            addLog("ERROR: Shutdown sequence failed.");
        }
    };

    const handleCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        const cmd = terminalInput.trim();
        if (!cmd) return;

        addLog(`\x1b[32mpathocore@node ~ % \x1b[0m ${cmd}`);
        setCommandHistory(prev => [cmd, ...prev]);
        setTerminalInput("");
        setHistoryIndex(-1);

        const lowerCmd = cmd.toLowerCase();

        // 🟢 Phase 1: Local Switchboard UI Commands
        if (lowerCmd === "help") {
            addLog("DIAGNOSTIC SHELL v3.0 (Full System Access)");
            addLog("Available commands:");
            addLog("  npm run relay   - Link Hardware Bridge");
            addLog("  status          - Query device telemetry");
            addLog("  clear           - Wipe terminal buffer");
            addLog("  ifconfig / ip   - Check network addresses");
            addLog("  ls / dir        - Inspect local artifacts");
            return;
        }

        if (lowerCmd === "clear") {
            setTerminalLogs([]);
            return;
        }

        // 🔵 Phase 2: Transparent Shell Execution (Real Shell)
        setIsExecuting(true);
        try {
            const res = await fetch("/api/terminal/run", {
                method: "POST",
                body: JSON.stringify({
                    command: cmd,
                    secretKey: selectedMachineForLive?.secretKey
                })
            });
            const data = await res.json();
            
            if (data.error) {
                addLog(`\x1b[31mFAULT:\x1b[0m ${data.error}`);
                setIsExecuting(false);
            } else {
                // Display Initial Shell Handshake Output (stdout/stderr)
                if (data.output) {
                    const outputLines = data.output.split('\n');
                    outputLines.forEach((line: string) => {
                        if (line.trim()) addLog(line);
                    });
                }
                
                if (cmd.includes('relay')) {
                    addLog(`\x1b[32mPULSE:\x1b[0m Relay starting (PID: ${data.pid}). Awaiting hardware heartbeat...`);
                } else {
                    setIsExecuting(false); // Short-lived command finished
                }
            }
        } catch (err) {
            addLog(`\x1b[31mEXEC_ERROR:\x1b[0m Shell Bridge Timeout.`);
            setIsExecuting(false);
        }
    };

    const addLog = (msg: string) => {
        setTerminalLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
    };

    const readData = async (port: any, machine: any) => {
        if (!port.readable || port.readable.locked) {
            addLog("VECTOR_BUSY: Stream is currently locked by another process.");
            return;
        }

        const reader = port.readable.getReader();
        activeReader.current = reader;
        const decoder = new TextDecoder();
        let buffer = "";

        addLog("LISTENING: Neural gate open for incoming data streams...");

        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    addLog("STREAM_CLOSED: Reader signaled termination.");
                    break;
                }
                
                const chunk = decoder.decode(value);
                buffer += chunk;

                // Process buffer if we see a frame-end (ASTM/HL7 standard)
                if (buffer.includes('\r') || buffer.includes('\n')) {
                    const lines = buffer.split(/[\r\n]+/);
                    buffer = lines.pop() || ""; // Keep the last incomplete line

                    for (const line of lines) {
                        if (line.trim()) {
                            addLog(`RAW_STREAM: ${line}`);
                            processMachineMessage(line, machine);
                        }
                    }
                }
            }
        } catch (err: any) {
            addLog(`PACKET_CORRUPTION: ${err.message}`);
        } finally {
            reader.releaseLock();
            activeReader.current = null;
        }
    };

    const processMachineMessage = async (msg: string, machine: any) => {
        // --- HL7 v2.x PARSER ---
        if (msg.startsWith('MSH|')) {
            addLog("HL7_VECTOR: Protocol detected [v2.x]");
            return;
        }
        
        const parts = msg.split('|');
        const type = parts[0];

        // HL7 Observation Request (OBR) or ASTM Order (O)
        if (type === 'O' || type === 'OBR') {
            const barcode = (type === 'O' ? parts[2] : parts[3])?.trim();
            if (barcode) {
                setCurrentSampleId(barcode);
                setLiveData((prev: any) => ({ ...prev, barcode }));
                addLog(`IDENTIFIER_MATCHED: Sample ID [${barcode}]`);
            }
        } 
        // HL7 Observation (OBX) or ASTM Result (R)
        else if (type === 'R' || type === 'OBX') {
            const param = (type === 'R' ? parts[2]?.replace(/\^/g, '') : parts[3]?.split('^')?.[1] || parts[3])?.trim();
            const val = type === 'R' ? parts[3] : parts[5];
            const barcode = currentSampleId || "NO_ID";
            
            setLiveData({ param, val, barcode });
            setSessionResults(prev => [{ param, val, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 5));
            addLog(`VECTOR_IDENTIFIED: ${param} -> ${val}`);
            
            if (activePort && machine.secretKey) {
                await syncToCloud(machine.secretKey, param, val, barcode);
            }
        }
    };


    const syncToCloud = async (secretKey: string, param: string, val: string, barcode: string) => {
        setSyncPulse(true);
        try {
            const res = await fetch("/api/machine/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    secretKey,
                    barcode: barcode || "MANUAL_ENTRY_REQ",
                    results: { [param]: val }
                })
            });
            if (res.ok) {
                addLog(`CLOUD_SYNC_SUCCESS: Data packet ingested for ID [${barcode}].`);
                setTimeout(() => setSyncPulse(false), 1000);
            }
        } catch (err) {
            addLog(`UNSYNCED: Cloud handshake failure.`);
            setSyncPulse(false);
        }
    };

    const CONFIG_PORT_MAPPING: any = {};

    const provisionNode = async () => {
        if (!isSuperAdmin || !selectedCenter?._id) return;
        setIsProvisioningLoading(true);
        try {
            const nodePresets: any = {
                HEMATOLOGY: { name: "Erba Mannheim H 560", protocol: "HL7 v2.5", port: "USB_SERIAL" },
                BIOCHEMISTRY: { name: "Erba Mannheim EM 200", protocol: "ASTM", port: "USB_SERIAL" },
                CLIA: { name: "Snibe Maglumi 800", protocol: "HL7", port: "USB_SERIAL" },
                DIABETES: { name: "Arkray HA-8380V", protocol: "ASTM", port: "USB_SERIAL" }
            };

            const preset = nodePresets[provisioningType];
            const finalName = customMachineName || preset.name;
            const finalProtocol = customProtocol || preset.protocol;

            const res = await fetch("/api/center/machines", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: finalName,
                    type: provisioningType,
                    protocol: finalProtocol,
                    port: preset.port,
                    centerId: selectedCenter._id
                })
            });

            if (res.ok) {
                const newNode = await res.json();
                setNodes([newNode, ...nodes]);
                setIsProvisioning(false);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsProvisioningLoading(false);
        }
    };

    const updateNode = async () => {
        if (!isSuperAdmin || !editingNodeId) return;
        setIsProvisioningLoading(true);
        try {
            const res = await fetch("/api/center/machines", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    machineId: editingNodeId,
                    name: customMachineName,
                    protocol: customProtocol
                })
            });
            if (res.ok) {
                const updated = await res.json();
                setNodes(nodes.map(n => n._id === editingNodeId ? updated : n));
                setIsEditingNode(false);
                setIsProvisioning(false);
                setEditingNodeId(null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsProvisioningLoading(false);
        }
    };

    const startEditing = (node: any) => {
        setEditingNodeId(node._id);
        setCustomMachineName(node.name);
        setCustomProtocol(node.protocol);
        setProvisioningType(node.type);
        setIsEditingNode(true);
        setIsProvisioning(true);
    };

    const tripleLockedDelete = (node: any) => {
        const step1 = confirm(`⚠️ [STEP 1/3] WARNING: You are initiating a TERMINATION SEQUENCE for ${node.name}. This will break the digital link between the machine and Pathocore. Continue?`);
        if (!step1) return;

        const step2 = confirm(`🚨 [STEP 2/3] CRITICAL ACTION: Deleting this node will STOP all automated result transfers for this analyzer. Technicians will have to enter results manually. Are you absolutely sure?`);
        if (!step2) return;

        const step3 = confirm(`☢️ [STEP 3/3] FINAL PROTOCOL: This action is PERMANENT and irreversible. System logs and calibration for this node will be purged. Do you want to EXECUTE termination?`);
        if (step3) {
            deleteNode(node._id);
        } else {
            alert("TERMINATION ABORTED: Neural Integrity maintained.");
        }
    };

    const filteredCenters = centers.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 italic">Synchronizing Neural Matrix...</p>
        </div>
    );

    return (
        <div className="space-y-12 pb-20 px-4 md:px-0">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        {view === "machines" && isSuperAdmin && (
                            <button
                                onClick={() => setView("centers")}
                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-primary transition-all"
                            >
                                <ChevronLeft size={20} />
                            </button>
                        )}
                        <h2 className="text-4xl md:text-6xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white leading-none">
                            {view === "centers" ? "Hardware Matrix" : "Center Terminal"}
                        </h2>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[8px] md:text-[10px] italic flex items-center gap-2">
                            <Network size={14} className="text-primary shrink-0" />
                            {view === "centers" ? "Enterprise Network Command" : `Node Control: ${selectedCenter?.name}`}
                        </p>
                    </div>
                </div>

                {view === "centers" && (
                    <div className="relative w-full md:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            placeholder="SEARCH DIAGNOSTICS HUB..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl pl-12 pr-6 outline-none border-2 border-transparent focus:border-primary/20 text-xs font-black uppercase tracking-widest transition-all"
                        />
                    </div>
                )}
            </div>

            <AnimatePresence mode="wait">
                {view === "centers" ? (
                    <motion.div
                        key="centers-grid"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredCenters.map((center, i) => (
                            <motion.div
                                key={center._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => fetchMachines(center._id)}
                                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm group hover:shadow-2xl hover:shadow-primary/10 transition-all cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all" />

                                <div className="space-y-6 relative z-10">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-inner">
                                        <Building2 size={28} />
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-black italic uppercase leading-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors">{center.name}</h3>
                                        <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.3em] mt-2 italic">{center.email}</p>
                                    </div>

                                    <div className="pt-6 border-t border-slate-50 dark:border-slate-800 flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-slate-400 text-[7px] font-black uppercase tracking-[0.4em] italic leading-none">Node Network</p>
                                            <p className="text-slate-900 dark:text-white text-[10px] font-black italic">
                                                {center.nodes?.filter((n: any) => !n.isPaused).length || 0} / {center.nodes?.length || 0} ACTIVE
                                            </p>
                                        </div>
                                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(center.nodes?.filter((n:any) => !n.isPaused).length / (center.nodes?.length || 1)) * 100}%` }}
                                                className="h-full bg-primary"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-slate-400 text-[7px] font-black uppercase tracking-[0.4em] italic leading-none">Hardware Health</p>
                                                <p className={cn(
                                                    "text-xs font-black italic uppercase",
                                                    (center.nodes?.filter((n:any) => !n.isPaused).length || 0) > 0 ? "text-emerald-500" : "text-slate-400"
                                                )}>
                                                    {(center.nodes?.filter((n:any) => !n.isPaused).length || 0) > 0 ? "Synchronized" : "Offline"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-900 dark:text-white text-xs font-black italic">Enter Terminal</span>
                                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary group-hover:text-white transition-all">
                                                    <ArrowRight size={14} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        key="machines-view"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-12"
                    >
                        {/* Neural Middleware Status Pin */}
                        <div className="bg-slate-950 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-primary/30 transition-all" />
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary relative">
                                        <Cpu size={32} className="animate-pulse" />
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-slate-950 rounded-full" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic uppercase text-white leading-none">Neural Bridge v2.0</h3>
                                        <p className="text-primary text-[8px] font-black uppercase tracking-[0.4em] mt-2 italic">Active Center: {selectedCenter?.name}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 w-full md:w-auto">
                                    {[
                                        { label: "Active Nodes", val: `${nodes.filter(n => !n.isPaused).length}/${nodes.length}` },
                                        { label: "Throughput", val: "1.2s/Res" },
                                        { label: "Data Uptime", val: "99.9%" },
                                        { label: "Control", val: isSuperAdmin ? "MASTER" : "RESTRICT" }
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                            <p className="text-white/40 text-[7px] font-black uppercase tracking-widest mb-1 italic">{stat.label}</p>
                                            <p className="text-white text-sm font-black italic">{stat.val}</p>
                                        </div>
                                    ))}
                                    {isSuperAdmin && (
                                        <div
                                            onClick={nodeGlobalKill}
                                            className={cn(
                                                "rounded-2xl p-4 text-center cursor-pointer transition-all border group",
                                                globalKillSwitch
                                                    ? "bg-red-500 text-white border-red-400 animate-pulse"
                                                    : "bg-white/5 border-white/10 hover:border-red-500/50"
                                            )}
                                        >
                                            <p className={cn("text-[7px] font-black uppercase tracking-widest mb-1 italic", globalKillSwitch ? "text-white" : "text-white/40")}>Global Kill</p>
                                            <p className="text-sm font-black italic">{globalKillSwitch ? "TERMINATED" : "ACTIVE"}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Integrated AI Liaison Hub: Explanation for Customers */}
                        <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full -mr-32 -mt-32 group-hover:bg-primary/20 transition-all" />
                            <div className="relative z-10 flex flex-col xl:flex-row items-center gap-10">
                                <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-white shrink-0 shadow-2xl shadow-primary/20 group-hover:scale-110 transition-transform duration-500">
                                    <Cpu size={40} />
                                </div>
                                <div className="space-y-4 text-center xl:text-left">
                                    <h4 className="text-white text-3xl font-black uppercase italic tracking-tight">Machine-to-Cloud Intelligence</h4>
                                    <p className="text-white/40 text-[11px] font-bold uppercase tracking-wider leading-relaxed max-w-2xl">
                                        The <span className="text-primary">Neural Bridge v2.0</span> acts as a digital nervous system for your lab. It automatically intercepts complex HL7 and ASTM vectors directly from your hardware, eliminating 100% of manual data entry risks. Our AI ensures that every result is validated, timestamped, and injected directly into the patient's digital report in <span className="text-primary italic">1.2 seconds.</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Global API Credentials Vault */}
                        {selectedCenter && (
                            <div className="bg-slate-950 p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden group shadow-2xl mt-8">
                                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -ml-32 -mt-32 group-hover:bg-emerald-500/20 transition-all" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Database size={24} className="text-emerald-500" />
                                        <h4 className="text-white text-xl font-black uppercase italic tracking-tight">Middleware Edge Credentials</h4>
                                    </div>
                                    <p className="text-white/50 text-[10px] uppercase font-bold tracking-widest leading-relaxed mb-6">
                                        Input these core authenticated identities into your <span className="text-emerald-400">Pathocore Local Agent Dashboard</span>. These keys authorize secure telemetry streams to the cloud matrix.
                                    </p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-black/50 p-6 rounded-2xl border border-white/5">
                                            <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em] mb-3">Laboratory Identification Code</p>
                                            <p className="text-sm font-mono font-bold text-white break-all tracking-widest">{selectedCenter.labId || "PENDING_PROVISION"}</p>
                                        </div>
                                        <div className="bg-black/50 p-6 rounded-2xl border border-white/5">
                                            <div className="flex justify-between items-center mb-3">
                                                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">Encrypted Access Token</p>
                                                <ShieldCheck size={14} className="text-emerald-500" />
                                            </div>
                                            <p className="text-sm font-mono font-bold text-emerald-400 break-all tracking-widest">{selectedCenter.apiKey || "PENDING_PROVISION"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Live Telemetry Ticker */}
                        <div className="bg-slate-950 p-6 rounded-[2rem] border border-white/5 overflow-hidden flex items-center gap-10 relative">
                            <div className="flex items-center gap-3 shrink-0">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white italic">Live Telemetry Stream</span>
                            </div>
                            <div className="flex-1 overflow-hidden pointer-events-none">
                                <motion.div
                                    animate={{ x: ["50%", "-100%"] }}
                                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                                    className="flex gap-24 whitespace-nowrap"
                                >
                                    {[
                                        "VECTOR_SYNC_V2: M_CELL_COUNTER_176 >> Success",
                                        "HEURISTIC_PACKET_RECEIVED: HL7_2.5_NODE_1DAC >> Ingested",
                                        "NEURAL_PULSE: DB_LATENCY_12ms >> Optimal",
                                        "AUTH_BRIDGE: Pathocore_MIDDLEWARE_V2.0 >> Active",
                                        "HEMOGLOBIN_STREAM: SYSMEX_XN >> Validated",
                                        "REAGENT_SYNC: LOG_77A >> Status_OK",
                                        "QUANTUM_ENCRYPTION_LAYER >> Verified",
                                        "CLOUD_INGESTION: 182_VECTORS >> Synchronized"
                                    ].map((text, i) => (
                                        <span key={i} className="font-mono text-[10px] text-white/10 font-black italic tracking-[0.3em]"> {`[${new Date().toLocaleTimeString('en-US', { hour12: false })}] ${text}`}</span>
                                    ))}
                                </motion.div>
                            </div>
                        </div>

                        {/* Machine Clusters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 min-h-[400px]">
                            {nodes.map((node, i) => (
                                <motion.div
                                    key={node._id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={cn(
                                        "bg-white dark:bg-slate-900 border rounded-[2rem] p-8 shadow-sm group hover:shadow-2xl hover:shadow-primary/5 transition-all relative overflow-hidden",
                                        node.isPaused ? "border-red-500/20 grayscale" : "border-slate-100 dark:border-slate-800"
                                    )}
                                >
                                    {node.isPaused && (
                                        <div className="absolute inset-0 bg-red-500/[0.02] z-0" />
                                    )}
                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="space-y-4">
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-12 relative overflow-hidden",
                                                node.isPaused ? "bg-slate-500/10 text-slate-500" :
                                                    node.type === "HEMATOLOGY" ? "bg-blue-500/10 text-blue-500" :
                                                        node.type === "BIOCHEMISTRY" ? "bg-emerald-500/10 text-emerald-500" :
                                                            node.type === "CLIA" ? "bg-purple-500/10 text-purple-500" :
                                                                "bg-amber-500/10 text-amber-500"
                                            )}>
                                                {!node.isPaused && (
                                                    <motion.div
                                                        animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 2 }}
                                                        className="absolute inset-0 bg-current pointer-events-none"
                                                    />
                                                )}
                                                {node.isPaused ? <ShieldCheck size={24} /> : <Activity size={24} />}
                                            </div>
                                            <div>
                                                <h4 className={cn("text-xl font-black italic uppercase leading-none", node.isPaused ? "text-slate-400" : "text-slate-900 dark:text-white")}>{node.name}</h4>
                                                <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.3em] mt-2 italic">{node.type} • NODE_{node._id.slice(-4)}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {node.isPaused ? (
                                                <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-full border border-red-500/20">
                                                    <AlertCircle size={10} />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">SUSPENDED</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20">
                                                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest">Active</span>
                                                </div>
                                            )}

                                            {isSuperAdmin && (
                                                <button
                                                    onClick={() => toggleNode(node._id, node.isPaused)}
                                                    className={cn(
                                                        "mt-2 px-3 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all border shadow-sm",
                                                        node.isPaused ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                                                    )}
                                                >
                                                    {node.isPaused ? "Re-Activate" : "Suspend Node"}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-8 border-t border-slate-50 dark:border-slate-800 flex flex-col gap-4">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-slate-400 text-[7px] font-black uppercase tracking-widest mb-1 italic">Protocol</p>
                                                <p className="text-slate-900 dark:text-white text-[10px] font-bold italic">{node.protocol}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-[7px] font-black uppercase tracking-widest mb-1 italic">Last Sync</p>
                                                <p className="text-slate-900 dark:text-white text-[10px] font-bold italic">{node.isPaused ? "TERMINATED" : "Just Now"}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-[7px] font-black uppercase tracking-widest mb-1 italic">Port</p>
                                                <p className="text-slate-900 dark:text-white text-[10px] font-bold italic">{node.port}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Revenue Protection Lock: De-provisioning EXCLUSIVELY for Super Admins */}
                                    <>
                                        {isSuperAdmin && (
                                            <div className="flex gap-2 mt-4">
                                                <button
                                                    onClick={() => tripleLockedDelete(node)}
                                                    className="flex-1 py-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-[8px] font-black uppercase tracking-[0.2em] italic border border-red-500/20 transition-all shadow-lg shadow-red-500/5 group/btn"
                                                >
                                                    <span className="group-hover/btn:hidden">Terminate Provisioning</span>
                                                    <span className="hidden group-hover/btn:inline">Execute Hard Deletion</span>
                                                </button>
                                                <button
                                                    onClick={() => connectToMachine(node)}
                                                    className="flex-1 py-3 rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white text-[8px] font-black uppercase tracking-[0.2em] italic border border-primary/20 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Usb size={12} />
                                                    Live Direct Link
                                                </button>
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={() => startEditing(node)}
                                                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => tripleLockedDelete(node)}
                                                        className="w-10 h-10 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {!isSuperAdmin && (
                                            <button
                                                onClick={() => connectToMachine(node)}
                                                className="w-full py-4 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] italic shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                                            >
                                                <Radio size={16} className="animate-pulse" />
                                                Activate Neural Direct Link
                                            </button>
                                        )}
                                    </>
                                </motion.div>
                            ))}
                        </div>

                        {/* Revenue Protection: Termination Controls */}
                        {isSuperAdmin && nodes.length > 0 && (
                            <div className="flex justify-center pt-12">
                                <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.5em] italic">De-commissioning of instrumentation nodes is restricted to Master Admin Account</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quick Connect Guide (Sales Tool) */}
            <div className="p-10 md:p-16 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center space-y-8">
                <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <Wifi size={40} className="animate-bounce" />
                </div>
                <div className="space-y-4 max-w-2xl">
                    <h4 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">Unified Laboratory Link</h4>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed uppercase tracking-wider text-[10px]">
                        Hardware scaling and node provisioning is restricted to the Master Network Account.
                        Contact Pathocore Enterprise Support to activate new machine clusters for this center.
                    </p>
                </div>
                {isSuperAdmin && (
                    <button
                        onClick={() => setIsProvisioning(true)}
                        className="px-12 py-5 rounded-2xl bg-indigo-500 text-white font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-indigo-500/40 italic active:scale-95 transition-all"
                    >
                        Provision New Interface Node
                    </button>
                )}
            </div>

            {/* Provisioning Modal Overlay */}
            <AnimatePresence>
                {isProvisioning && (
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
                            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] p-10 md:p-16 border border-white/10 shadow-4xl text-center space-y-10"
                        >
                            <div className="space-y-4">
                                <div className="w-20 h-20 rounded-[2rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 mx-auto">
                                    <Zap size={40} />
                                </div>
                                <h3 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none">
                                    {isEditingNode ? "Node Recalibration" : "Node Provisioning"}
                                </h3>
                                <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.4em] italic">
                                    {isEditingNode ? `Adjusting logic for ${customMachineName}` : "Generate Integrated Hardware Cluster"}
                                </p>
                            </div>

                            {!isEditingNode && (
                                <div className="grid grid-cols-2 gap-4">
                                    {["HEMATOLOGY", "BIOCHEMISTRY", "CLIA", "DIABETES"].map(type => (
                                        <button
                                            key={type}
                                            onClick={() => {
                                                setProvisioningType(type);
                                                const nodePresets: any = {
                                                    HEMATOLOGY: "Erba Mannheim H 560",
                                                    BIOCHEMISTRY: "Erba Mannheim EM 200",
                                                    CLIA: "Snibe Maglumi 800",
                                                    DIABETES: "Arkray HA-8380V"
                                                };
                                                setCustomMachineName(nodePresets[type]);
                                            }}
                                            className={cn(
                                                "h-20 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all",
                                                provisioningType === type
                                                    ? "bg-indigo-500 border-indigo-400 text-white shadow-xl shadow-indigo-500/30"
                                                    : "bg-slate-50 dark:bg-slate-800 border-transparent text-slate-400 hover:border-indigo-500/20"
                                            )}
                                        >
                                            <Activity size={18} />
                                            <span className="text-[7px] font-black uppercase tracking-widest">{type}</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="space-y-6 text-left">
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 italic pl-2">Machine Identification / Model</label>
                                    <input 
                                        type="text"
                                        value={customMachineName}
                                        onChange={(e) => setCustomMachineName(e.target.value)}
                                        placeholder="Enter Machine Model (e.g., SYSMEX XN-550)"
                                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl py-5 px-6 text-xs font-black italic text-slate-900 dark:text-white outline-none focus:border-indigo-500/40 transition-all placeholder:text-slate-400 uppercase"
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <div className="flex-1 space-y-2">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-slate-500 italic pl-2">Sync Protocol</label>
                                        <div className="flex bg-slate-100 dark:bg-black/20 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
                                            {["ASTM", "HL7 v2.5"].map(p => (
                                                <button
                                                    key={p}
                                                    onClick={() => setCustomProtocol(p)}
                                                    className={cn(
                                                        "flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                                        customProtocol === p 
                                                            ? "bg-white dark:bg-slate-800 text-indigo-500 shadow-lg shadow-black/10" 
                                                            : "text-slate-400 hover:text-slate-600"
                                                    )}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => {
                                        setIsProvisioning(false);
                                        setIsEditingNode(false);
                                        setEditingNodeId(null);
                                    }}
                                    className="flex-1 py-5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={isEditingNode ? updateNode : provisionNode}
                                    disabled={isProvisioningLoading}
                                    className="flex-[2] py-5 rounded-2xl bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    {isProvisioningLoading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <>{isEditingNode ? "Update Machine Config" : "Deploy Node Cluster"} <ArrowRight size={14} /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* --- NEURAL DIRECT LINK TERMINAL --- */}
                {isTerminalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-10"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-slate-900 w-full max-w-6xl h-[85vh] rounded-[3rem] border border-white/10 shadow-4xl overflow-hidden flex flex-col"
                        >
                            {/* Terminal Header */}
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-slate-800/50">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary relative">
                                        <Terminal size={28} />
                                        <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black italic uppercase text-white leading-none">Neural Direct Link</h3>
                                        <p className="text-primary text-[8px] font-black uppercase tracking-[0.4em] mt-2 italic">Active Feed: {selectedMachineForLive?.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5 mr-4">
                                        <button 
                                            onClick={() => setConnectionMode("SERIAL")}
                                            className={cn(
                                                "px-6 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                                connectionMode === "SERIAL" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/20 hover:text-white/40"
                                            )}
                                        >
                                            USB Serial
                                        </button>
                                        <button 
                                            onClick={() => setConnectionMode("NETWORK")}
                                            className={cn(
                                                "px-6 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all",
                                                connectionMode === "NETWORK" ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-white/20 hover:text-white/40"
                                            )}
                                        >
                                            TCP Relay
                                        </button>
                                    </div>
                                    {syncPulse && (
                                        <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                                            <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest italic">Syncing to Cloud</span>
                                        </div>
                                    )}
                                    <div className="hidden md:flex flex-col items-end mr-6">
                                        <span className="text-[7px] font-black uppercase text-white/30 tracking-widest mb-1 italic">Throughput Velocity</span>
                                        <span className="text-sm font-black text-primary italic">{(activePort || connectionMode === "NETWORK") ? "1.4" : "0.0"} VEC/sec</span>
                                    </div>
                                    {connectionMode === "SERIAL" && (
                                        <button
                                            onClick={activePort ? disconnectMachine : establishSerialLink}
                                            disabled={isConnecting}
                                            className={cn(
                                                "h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-3",
                                                activePort 
                                                    ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white"
                                                    : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white shadow-xl shadow-emerald-500/10"
                                            )}
                                        >
                                            {isConnecting ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : activePort ? (
                                                <><Power size={16} /> Sever Link</>
                                            ) : (
                                                <><Zap size={16} /> Connect USB/Serial</>
                                            )}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsTerminalOpen(false)}
                                        className="h-14 w-14 rounded-2xl bg-white/5 text-white/40 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Terminal Body */}
                            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_350px] overflow-hidden">
                                {/* Live Stream Waterfall */}
                                <div className="p-8 space-y-2 overflow-y-auto font-mono text-[10px] leading-relaxed relative bg-black/40">
                                    <div className="sticky top-0 z-10 py-6 px-8 bg-black/80 backdrop-blur-xl -mt-8 -mx-8 border-b border-white/10 flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-white font-black uppercase tracking-widest text-[9px] italic">Forensic Data Waterfall</span>
                                        </div>
                                        
                                        {/* Persistent Hardware Handshake Info */}
                                        <div className="flex gap-10 items-center">
                                            <div className="text-right">
                                                <p className="text-[7px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Target Host IP</p>
                                                <p className="text-xs font-black italic text-indigo-400 leading-none tracking-tight">{selectedMachineForLive?.relayIP || hostIP || "DETECTING..."}</p>
                                            </div>
                                            <div className="text-right border-l border-white/10 pl-10">
                                                <p className="text-[7px] font-black text-white/30 uppercase tracking-widest leading-none mb-1">Forensic TCP Port</p>
                                                <p className="text-xs font-black italic text-white leading-none tracking-tight">{selectedMachineForLive?.relayPort || 5600}</p>
                                            </div>
                                        </div>
                                    </div>
                                    {terminalLogs.map((log, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={cn(
                                                "py-1 border-l-2 pl-4 text-[9px]",
                                                log.includes('RAW_STREAM') ? "text-slate-600 border-slate-800" :
                                                log.includes('VECTOR') ? "text-primary border-primary/40 font-bold" :
                                                log.includes('CLOUD_SYNC') ? "text-emerald-500 border-emerald-500 font-black" :
                                                log.includes('IDENTIFIER') ? "text-amber-500 border-amber-500 font-bold" :
                                                log.includes('CRITICAL') ? "text-red-500 border-red-500" : "text-slate-400 border-slate-700"
                                            )}
                                        >
                                            {renderAnsiLog(log)}
                                        </motion.div>
                                    ))}
                                    <div ref={terminalEndRef} />
                                    {terminalLogs.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-slate-700 space-y-8 p-12">
                                            {connectionMode === "NETWORK" ? (
                                                <>
                                                    <motion.div 
                                                        animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.05, 1] }}
                                                        transition={{ repeat: Infinity, duration: 2 }}
                                                        className="w-24 h-24 rounded-[2.5rem] bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20"
                                                    >
                                                        <Wifi size={40} />
                                                    </motion.div>
                                                    <div className="text-center space-y-6 max-w-md">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.5em] italic">Hyper-Scale Network Bridge</p>
                                                        <p className="text-slate-400 text-xs font-medium leading-relaxed uppercase tracking-wider leading-relaxed">
                                                            Laboratory machines must connect to this bridge identity. Use the values below in your machine's setup or type <span className="text-white font-black italic underline cursor-help" onClick={() => { setTerminalInput("help"); }}>HELP</span> in terminal.
                                                        </p>
                                                        <div className="bg-black p-8 rounded-[2.5rem] border border-white/5 space-y-6 shadow-2xl">
                                                            <div>
                                                                <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.3em] mb-3 leading-none">Target Network Host (IP)</p>
                                                                <p className="text-4xl font-black italic text-indigo-400 tracking-tighter leading-none">{selectedMachineForLive?.relayIP || hostIP || "DETECTING..."}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[7px] font-black text-white/30 uppercase tracking-[0.3em] mb-3 leading-none">Interface Port (TCP)</p>
                                                                <p className="text-4xl font-black italic text-white tracking-tighter leading-none">{selectedMachineForLive?.relayPort || 5600}</p>
                                                            </div>
                                                            <div className="pt-6 border-t border-white/5 space-y-4">
                                                                <p className="text-[8px] font-bold text-slate-500 uppercase italic">👉 Put these values into your Erba H560 settings.</p>
                                                                {!selectedMachineForLive?.relayIP && (
                                                                    <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                                                                        <p className="text-[8px] font-black text-red-500 uppercase mb-2">Security Handshake Required:</p>
                                                                        <code className="text-[9px] text-white/80 font-mono break-all bg-black/50 p-3 block rounded-xl border border-white/5">npm run relay -- --key {selectedMachineForLive?.secretKey}</code>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <ZapOff size={48} />
                                                    <p className="text-[10px] font-black uppercase tracking-widest italic">Awaiting machine pulse...</p>
                                                </>
                                            )}
                                        </div>
                                    )}

                                    {/* Neural Command Input */}
                                    <div className="sticky bottom-0 p-4 pt-12 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent -mx-8">
                                        <form 
                                            onSubmit={handleCommand}
                                            className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center p-1 group focus-within:border-primary/40 transition-all shadow-2xl overflow-hidden"
                                        >
                                            <div className="pl-4 pr-2 text-primary text-[10px] font-black">
                                                <Terminal size={14} />
                                            </div>
                                            <input 
                                                value={terminalInput}
                                                onChange={(e) => setTerminalInput(e.target.value)}
                                                placeholder="Enter clinical command... (try 'help')"
                                                className="w-full h-12 bg-transparent outline-none text-white font-mono text-[11px] tracking-tight"
                                                autoComplete="off"
                                                spellCheck="false"
                                            />
                                            {terminalInput && (
                                                <button 
                                                    type="submit"
                                                    className="h-10 px-4 bg-primary text-white rounded-xl text-[9px] font-black uppercase mr-1 hover:bg-white hover:text-black transition-all"
                                                >
                                                    <ArrowRight size={14} />
                                                </button>
                                            )}
                                        </form>
                                    </div>
                                </div>

                                {/* Control Panel & Session Analytics */}
                                <div className="bg-slate-800/30 border-l border-white/5 p-8 flex flex-col space-y-8 h-full overflow-y-auto">
                                    {/* Neural Status Node */}
                                    <div className="bg-black/40 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                                        <div className="relative z-10 flex items-center gap-6">
                                            <div className="relative flex items-center justify-center">
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                                    className="w-16 h-16 rounded-full border-2 border-dashed border-primary/20"
                                                />
                                                <motion.div
                                                    animate={{ 
                                                        scale: liveData ? [1, 1.15, 1] : [1, 1.05, 1],
                                                        boxShadow: liveData ? [
                                                            "0 0 0px var(--primary)",
                                                            "0 0 20px var(--primary)",
                                                            "0 0 0px var(--primary)"
                                                        ] : "none"
                                                    }}
                                                    transition={{ duration: 0.3 }}
                                                    className="absolute inset-2 rounded-full bg-primary/10 flex items-center justify-center text-primary"
                                                >
                                                    <Cpu size={24} />
                                                </motion.div>
                                            </div>
                                            <div>
                                                <p className="text-[7px] font-black uppercase text-white/40 tracking-[0.2em] italic">Neural Status</p>
                                                <p className="text-white text-xs font-black italic uppercase leading-tight">
                                                    {activePort ? "Active Handshake" : "Awaiting Pulse"}
                                                </p>
                                                <p className="text-primary text-[8px] font-bold mt-1 uppercase italic leading-none">Latency: 8ms</p>
                                            </div>
                                        </div> {/* Closing the flex items-center gap-6 div */}
                                        
                                        <div className="mt-8 space-y-4 pt-8 border-t border-white/5">
                                            <p className="text-[7px] font-black uppercase text-white/40 tracking-[0.2em] italic">Link Recalibration (Baud)</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[9600, 115200].map(rate => (
                                                    <button
                                                        key={rate}
                                                        onClick={() => {
                                                            setBaudRate(rate);
                                                            addLog(`RECALIBRATION: Transmission speed adjusted to ${rate} BAUD`);
                                                        }}
                                                        disabled={!!activePort || connectionMode === "NETWORK"}
                                                        className={cn(
                                                            "py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                                            baudRate === rate
                                                                ? "bg-primary text-white shadow-xl shadow-primary/20"
                                                                : "bg-white/5 text-white/20 hover:text-white hover:bg-white/10 disabled:opacity-20"
                                                        )}
                                                    >
                                                        {rate} BAUD
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {connectionMode === "NETWORK" && (
                                            <div className="mt-8 space-y-6 pt-8 border-t border-white/5">
                                                <div className="bg-slate-950 p-6 rounded-3xl border border-white/5 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-[7px] font-black uppercase text-white/40 tracking-[0.2em] italic">Network Presence</p>
                                                        <div className={cn(
                                                            "w-2 h-2 rounded-full",
                                                            selectedMachineForLive?.isOnline ? "bg-emerald-500 animate-pulse shadow-glow" : "bg-red-500"
                                                        )} />
                                                    </div>
                                                    
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[8px] font-black uppercase text-slate-500 italic">Relay Heartbeat</span>
                                                            <span className={cn("text-[9px] font-black italic", selectedMachineForLive?.isOnline ? "text-emerald-500" : "text-red-500")}>
                                                                {selectedMachineForLive?.isOnline ? "OPERATIONAL" : "DISCONNECTED"}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[8px] font-black uppercase text-slate-500 italic">Connected Host</span>
                                                            <span className="text-[9px] font-mono text-white/60">
                                                                {selectedMachineForLive?.machineIP || "WAITING_FOR_HANDSHAKE"}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[8px] font-black uppercase text-slate-500 italic">Listen Interface</span>
                                                            <span className="text-[9px] font-mono text-indigo-400">0.0.0.0:5600</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => fetchMachines(session.user.centerId)}
                                                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/40 hover:text-white text-[8px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    FORCE STATUS REFRESH
                                                </button>
                                            </div>
                                        )}
                                        {activePort && (
                                            <p className="text-[6px] font-black uppercase text-primary/40 tracking-widest italic text-center mt-4">Sever link to modify transmission rate</p>
                                        )}
                                    </div>

                                    {/* Extraction Summary */}
                                    <div className="space-y-4">
                                        <h5 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic border-b border-white/5 pb-4 flex justify-between">
                                            Extraction Intelligence
                                            <span className="text-primary">{sessionResults.length}</span>
                                        </h5>
                                        <div className="space-y-3">
                                            {sessionResults.map((res, i) => (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    key={i}
                                                    className="bg-white/5 rounded-xl p-3 border border-white/5 flex items-center justify-between"
                                                >
                                                    <div>
                                                        <p className="text-[6px] text-white/30 font-black uppercase tracking-widest">{res.time}</p>
                                                        <p className="text-[9px] text-white font-black italic uppercase">{res.param}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-[10px] text-primary font-black italic">{res.val}</p>
                                                        <CheckCircle2 size={10} className="text-emerald-500 ml-auto mt-1" />
                                                    </div>
                                                </motion.div>
                                            ))}
                                            {sessionResults.length === 0 && (
                                                <div className="py-10 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                                    <p className="text-[8px] text-white/20 font-black uppercase tracking-widest italic">No Data Vectorized</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Calibration Console */}
                                    <div className="space-y-6">
                                        <h5 className="text-white text-[10px] font-black uppercase tracking-[0.2em] italic border-b border-white/5 pb-4">Terminal Calibration</h5>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[7px] font-black uppercase text-white/30 tracking-widest leading-none">Interface Frequency</span>
                                                    {activePort && (
                                                        <span className="text-[6px] font-black uppercase text-amber-500 animate-pulse italic leading-none">Locked by Link</span>
                                                    )}
                                                </div>
                                                <select 
                                                    value={baudRate}
                                                    onChange={(e) => setBaudRate(Number(e.target.value))}
                                                    disabled={activePort}
                                                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-4 px-4 text-white text-[10px] font-black italic outline-none focus:border-primary/40 appearance-none disabled:opacity-50 transition-all cursor-pointer disabled:cursor-not-allowed"
                                                >
                                                    {[2400, 4800, 9600, 19200, 38400, 57600, 115200].map(rate => (
                                                        <option key={rate} value={rate}>
                                                            {rate} BPS {rate === 9600 ? "(DEFAULT)" : ""}
                                                        </option>
                                                    ))}
                                                </select>
                                                {!activePort && (
                                                    <p className="text-[6px] text-white/20 font-medium px-1 italic">Note: Ensure this matches the machine's COM settings.</p>
                                                )}
                                            </div>

                                        </div>
                                    </div>

                                    {/* Neural Optimization Info */}
                                    <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 relative overflow-hidden group mt-auto">
                                        <div className="relative z-10">
                                            <p className="text-primary text-[8px] font-black uppercase tracking-widest mb-1 italic">Neural Optimization</p>
                                            <p className="text-white/70 text-[9px] font-medium leading-relaxed italic">Direct Link bypasses local middleware. Data integrity is guaranteed via end-to-end SSL encryption.</p>
                                        </div>
                                        <Zap className="absolute bottom-[-10px] right-[-10px] text-primary/10 w-20 h-20 rotate-12 group-hover:scale-125 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
