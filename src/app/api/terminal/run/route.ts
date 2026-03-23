import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

// High-Performance Forensic Shell Bridge
// This API establishes a direct PTY-like tunnel for hardware diagnostics and network auditing.

let activeProcess: any = null;

export async function POST(req: Request) {
    try {
        const { command, secretKey } = await req.json();

        if (!command) return NextResponse.json({ error: "No command provided" }, { status: 400 });

        // Kill existing diagnostic process if running a new one (singleton execution context)
        if (activeProcess) {
            activeProcess.kill();
            activeProcess = null;
        }

        // CLINICAL SHELL: We allow standard diagnostic and network commands
        // This provides the clinical tech with real-time hardware visibility.
        const cmdParts = command.split(' ');
        const baseCmd = cmdParts[0];

        // Environment injection for the Relay Bridge
        const env = { 
            ...process.env, 
            PATHO_NODE_SECRET: secretKey,
            PATHO_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        };

        // Execution Bridge
        const processRef = spawn(baseCmd, cmdParts.slice(1), { 
            cwd: process.cwd(),
            env: env,
            shell: true 
        });

        activeProcess = processRef;

        // Capture immediate terminal output for the handshake response
        let output = "";
        let errorOutput = "";

        // We use a short timeout to capture initial handshake strings (like IP addresses)
        // while allowing long-running processes (like the relay) to continue in background.
        const handshakeContent = await new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(output || errorOutput || "Process Started..."), 1200);
            
            processRef.stdout.on('data', (data) => {
                output += data.toString();
                if (output.length > 1000) resolve(output);
            });

            processRef.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            processRef.on('close', (code) => {
                clearTimeout(timeout);
                resolve(output || errorOutput || `Process exited with code ${code}`);
            });
        });

        return NextResponse.json({ 
            status: "SUCCESS", 
            pid: processRef.pid,
            output: handshakeContent 
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE() {
    if (activeProcess) {
        activeProcess.kill();
        activeProcess = null;
        return NextResponse.json({ status: "HALTED" });
    }
    return NextResponse.json({ status: "IDLE" });
}
