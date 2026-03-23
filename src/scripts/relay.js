/**
 * 🛰️ PathoCare Neural Relay Node (v3.1 - Forensic Data Extraction & Live Stream)
 * --------------------------------------------------------------------------
 * High-performance autonomous bridge for diagnostic hardware.
 * Upgraded with Cloud Terminal Streaming for real-time monitoring.
 */

const net = require('net');
const http = require('http');
const os = require('os');
const { URL } = require('url');

// Configuration Matrix
const DEFAULT_PORT = 5600;
const HOST = '0.0.0.0'; 
const APP_BASE_URL = process.env.PATHO_APP_URL || 'http://localhost:3000';

// Discovery
const getNetworkIP = () => {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        for (const iface of networkInterfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1';
};

const LOCAL_IP = getNetworkIP();

// Dynamic Argument Parsing
const args = process.argv.slice(2);
const getKey = () => {
    const idx = args.indexOf('--key');
    const k = (idx !== -1 && args[idx + 1]) ? args[idx + 1] : (process.env.PATHO_NODE_SECRET || 'SECRET_DEMO_NODE');
    return k.trim();
};

const getPort = () => {
    const idx = args.indexOf('--port');
    return (idx !== -1 && args[idx + 1]) ? parseInt(args[idx + 1]) : DEFAULT_PORT;
};

const SECRET_KEY = getKey();
const PORT = getPort();

let connectedMachineIP = null;

// ---------- CLOUD LOG STREAMER ----------

const streamToCloud = (msg) => {
    console.log(msg); // Local logging
    const payload = JSON.stringify({
        secretKey: SECRET_KEY,
        log_stream: msg,
        isOnline: true,
        machineIP: connectedMachineIP,
        relayIP: LOCAL_IP,
        relayPort: PORT
    });

    try {
        const target = new URL(`${APP_BASE_URL}/api/machine/status`);
        const req = http.request({
            hostname: target.hostname,
            port: target.port || (target.protocol === 'https:' ? 443 : 80),
            path: target.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        });
        req.on('error', () => {});
        req.write(payload);
        req.end();
    } catch(e) {}
};

streamToCloud(`🚀 [BOOT] Forensic Relay live on ${LOCAL_IP}:${PORT}`);
streamToCloud(`📡 [CONNECT] Cloud Matrix Target: ${APP_BASE_URL}`);

// ---------- TELEMETRY HEARTBEAT ----------

const sendHeartbeat = () => {
    const payload = JSON.stringify({
        secretKey: SECRET_KEY,
        isOnline: true,
        machineIP: connectedMachineIP,
        relayIP: LOCAL_IP,
        relayPort: PORT
    });

    try {
        const target = new URL(`${APP_BASE_URL}/api/machine/status`);
        const req = http.request({
            hostname: target.hostname,
            port: target.port || (target.protocol === 'https:' ? 443 : 80),
            path: target.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        });
        req.on('error', () => {});
        req.write(payload);
        req.end();
    } catch(e) {}
};

setInterval(sendHeartbeat, 10000);

// ---------- ASTM/HL7 CORE PARSER (V3 - Forensic) ----------

const processDigitalStream = (rawBuffer) => {
    const result = {
        barcode: null,
        parameters: []
    };

    const sections = rawBuffer.split(/[\r\n]+/);
    for (const line of sections) {
        if (!line.trim()) continue;
        const p = line.split('|');

        if (line.startsWith('O') || line.startsWith('OBR')) {
            result.barcode = (line.startsWith('O') ? p[2] : p[3])?.replace(/[\r\n]/g, '').trim();
        }

        if (line.startsWith('R') || line.startsWith('OBX')) {
            try {
                const isOBX = line.startsWith('OBX');
                const nameIdx = isOBX ? 3 : 2;
                const valIdx = isOBX ? 5 : 3;
                const unitIdx = isOBX ? 6 : 4;
                const rangeIdx = isOBX ? 7 : 5;
                const flagIdx = isOBX ? 8 : 6;

                let nameToken = p[nameIdx];
                if (nameToken.includes('^')) {
                    const parts = nameToken.split('^').filter(x => x && !x.includes('-') && isNaN(x));
                    nameToken = parts[0] || nameToken;
                }

                const value = p[valIdx]?.trim();
                const rawFlag = p[flagIdx] || "";
                
                let clinicalFlag = "NORMAL";
                if (rawFlag.includes('H')) clinicalFlag = "HIGH";
                else if (rawFlag.includes('L')) clinicalFlag = "LOW";
                else if (rawFlag.includes('A')) clinicalFlag = "ABNORMAL";

                if (nameToken && value) {
                    result.parameters.push({
                        name: nameToken.replace(/\*/g, '').trim(),
                        value: value,
                        unit: p[unitIdx]?.trim() || "",
                        range: p[rangeIdx]?.trim() || "",
                        flag: clinicalFlag
                    });
                }
            } catch(e) {}
        }
    }
    return result;
};

// ---------- CLOUD SYNCHRONIZATION ----------

const syncToCloudMatrix = (data) => {
    if (!data.barcode || data.barcode.length < 2) return;

    const payload = JSON.stringify({
        secretKey: SECRET_KEY,
        barcode: data.barcode,
        results: data.parameters
    });

    try {
        const target = new URL(`${APP_BASE_URL}/api/machine/push`);
        const req = http.request({
            hostname: target.hostname,
            port: target.port || (target.protocol === 'https:' ? 443 : 80),
            path: target.pathname,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
        }, (res) => {
            if (res.statusCode === 200) {
                streamToCloud(`✅ [FORENSIC INGEST] Sample ${data.barcode} -> Matrix Synced. (${data.parameters.length} params)`);
            }
        });
        req.on('error', (e) => streamToCloud(`❌ [ERROR] Cloud Link Refused: ${e.message}`));
        req.write(payload);
        req.end();
    } catch(e) {}
};

// ---------- TCP SERVER ARCHITECTURE ----------

const server = net.createServer((socket) => {
    connectedMachineIP = socket.remoteAddress.replace('::ffff:', '');
    streamToCloud(`🔔 [NEW LINK] Clinical Instrument Connected: ${connectedMachineIP}`);

    let streamBuffer = "";

    socket.on('data', (chunk) => {
        const raw = chunk.toString('utf8');
        streamToCloud(`📥 [RAW_CHUNK] Length: ${raw.length} bytes`);
        streamBuffer += raw;

        if (streamBuffer.includes('\x04') || streamBuffer.includes('L|')) {
            const parsed = processDigitalStream(streamBuffer);
            if (parsed.parameters.length > 0) {
                syncToCloudMatrix(parsed);
                streamBuffer = ""; 
            }
        }
    });

    socket.on('end', () => {
        streamToCloud(`🔌 [LINK CLOSED] Machine Disconnected: ${connectedMachineIP}`);
        connectedMachineIP = null;
    });

    socket.on('error', (e) => {
        streamToCloud(`⚠️ [LINK ERROR] ${e.message}`);
        connectedMachineIP = null;
    });
});

process.on('SIGINT', () => {
    streamToCloud(`🛑 [SHUTDOWN] Terminating Diagnostic Node.`);
    process.exit(0);
});

server.listen(PORT, HOST, () => {
    streamToCloud(`🚀 [RUNNING] Listening for Erba H560 pulses on ${LOCAL_IP}:${PORT}`);
});
