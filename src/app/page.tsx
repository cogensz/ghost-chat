'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import { playKeyClickSound, playJoinSound } from '@/lib/audio';

const BOOT_LOGS = [
  '[SYS_INIT] BIOS_VERSION: 0x9942 // CRT_PHOSPHOR_ACTIVE',
  '[SECURITY] ZERO_DATABASE_POLICY: ENFORCED [0-PERSISTENCE]',
  '[SECURITY] STORAGE_DRIVES: DISCONNECTED // IN-MEMORY ONLY',
  '[SOCKET] WEBSOCKET_DAEMON: LISTENING ON PORT 3000',
  '[PROTOCOL] P2P_EMPH_BROADCAST: READY FOR CHANNEL ALLOCATION',
];

export default function TerminalLandingPage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [logsVisible, setLogsVisible] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    // Clock in retro terminal format
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toTimeString().split(' ')[0]);
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Staggered boot logs
    BOOT_LOGS.forEach((log, index) => {
      setTimeout(() => {
        setLogsVisible((prev) => [...prev, log]);
      }, (index + 1) * 160);
    });
  }, []);

  const handleCreateRoom = () => {
    playKeyClickSound();
    setIsExecuting(true);
    const id = nanoid(8);
    setTimeout(() => {
      playJoinSound();
      router.push(`/chat/${id}`);
    }, 400);
  };

  const handleJoinWithCode = (e: React.FormEvent) => {
    e.preventDefault();
    playKeyClickSound();
    if (!joinCode.trim()) return;

    let cleanCode = joinCode.trim();
    if (cleanCode.includes('/chat/')) {
      const parts = cleanCode.split('/chat/');
      cleanCode = parts[parts.length - 1];
    }
    cleanCode = cleanCode.split('?')[0].replace(/\/$/, '');

    if (cleanCode) {
      router.push(`/chat/${cleanCode}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-3 sm:p-6 bg-black text-[#00FF66] font-mono">
      {/* Main Terminal Window Frame */}
      <div className="w-full max-w-3xl term-window border-2 border-[#00FF66] bg-[#060a06] shadow-[0_0_30px_rgba(0,255,102,0.15)] relative">
        
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b-2 border-[#00FF66] bg-[#00220d] text-xs font-bold select-none">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-[#00FF66] shadow-[0_0_8px_#00FF66]" />
            <span className="glow-green uppercase tracking-wider">
              TERMINAL // TTY_SECURE_GHOST_NET [v4.0.9]
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[#008833] hidden sm:inline">[{currentTime}]</span>
            <span className="text-[#00FF66]">[SYS_STATUS: CONNECTED]</span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="px-1 bg-[#003311] border border-[#008833] text-[10px] text-[#00FF66]">_</span>
              <span className="px-1 bg-[#003311] border border-[#008833] text-[10px] text-[#00FF66]">□</span>
              <span className="px-1 bg-[#003311] border border-[#FF3333] text-[10px] text-[#FF3333]">X</span>
            </div>
          </div>
        </div>

        {/* Terminal Content Body */}
        <div className="p-4 sm:p-8 space-y-6">
          
          {/* ASCII Banner */}
          <div className="overflow-x-auto text-center select-none py-1">
            <pre className="inline-block text-[9px] sm:text-[11px] md:text-xs text-[#00FF66] font-bold leading-tight glow-green">
{`
 ██████╗ ██╗  ██╗ ██████╗ ███████╗████████╗   ███╗   ██╗███████╗████████╗
██╔════╝ ██║  ██║██╔═══██╗██╔════╝╚══██╔══╝   ████╗  ██║██╔════╝╚══██╔══╝
██║  ███╗███████║██║   ██║███████╗   ██║      ██╔██╗ ██║█████╗     ██║   
██║   ██║██╔══██║██║   ██║╚════██║   ██║      ██║╚██╗██║██╔══╝     ██║   
╚██████╔╝██║  ██║╚██████╔╝███████║   ██║      ██║ ╚████║███████╗   ██║   
 ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝      ╚═╝  ╚═══╝╚══════╝   ╚═╝   
`}
            </pre>
            <div className="text-xs text-[#008833] tracking-widest mt-1">
              [ 100% IN-MEMORY // EPHEMERAL PEER-TO-PEER ENCLAVE ]
            </div>
          </div>

          {/* Diagnostics Boot Log Terminal */}
          <div className="p-3 bg-[#020502] border border-[#008833] text-xs font-mono space-y-1">
            <div className="text-[#008833] text-[10px] uppercase tracking-wider pb-1 border-b border-[#003311]">
              --- SYSTEM DIAGNOSTIC INITIALIZATION LOG ---
            </div>
            {logsVisible.map((log, i) => (
              <div key={i} className="text-[#00FF66]/80 flex items-start gap-2">
                <span className="text-[#008833] select-none">&gt;</span>
                <span>{log}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 text-[#00FF66]">
              <span className="text-[#008833] select-none">&gt;</span>
              <span className="glow-green font-bold">READY FOR OPERATOR COMMAND</span>
              <span className="term-cursor" />
            </div>
          </div>

          {/* Primary Action Button: CREATE SECURE ROOM */}
          <div className="pt-2">
            <button
              onClick={handleCreateRoom}
              disabled={isExecuting}
              className="w-full py-4 px-6 term-btn border-2 border-[#00FF66] bg-[#00220d] text-[#00FF66] text-sm sm:text-base font-bold tracking-widest transition-all duration-150 flex items-center justify-center gap-3 group"
            >
              <span className="text-[#FFCC00] group-hover:text-black">⚡</span>
              <span>
                {isExecuting ? 'INITIALIZING_MEMORY_NODE...' : '[ > EXECUTE: CREATE_SECURE_ROOM ]'}
              </span>
              <span className="text-[#FFCC00] group-hover:text-black">⚡</span>
            </button>
          </div>

          {/* Divider with Terminal Prompt */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[#004419]" />
            <span className="text-xs text-[#008833] uppercase tracking-wider">
              -- OR CONNECT TO EXISTING FREQUENCY --
            </span>
            <div className="flex-1 h-px bg-[#004419]" />
          </div>

          {/* Join with Channel Code Form */}
          <form onSubmit={handleJoinWithCode} className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center border border-[#008833] bg-[#020502] px-3 py-2.5 focus-within:border-[#00FF66] focus-within:shadow-[0_0_10px_rgba(0,255,102,0.2)]">
              <span className="text-[#008833] text-sm mr-2 select-none">&gt; INPUT_CHANNEL:</span>
              <input
                type="text"
                placeholder="ENTER_ROOM_ID_OR_INVITE_URL"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 bg-transparent text-[#00FF66] text-sm font-mono placeholder-[#005522] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="px-6 py-2.5 term-btn border border-[#00FF66] text-xs font-bold disabled:opacity-40 disabled:pointer-events-none"
            >
              [ CONNECT_NODE ]
            </button>
          </form>

          {/* Terminal Specs Footnote Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#003311]">
            <div className="p-2.5 border border-[#004419] bg-[#020502]">
              <div className="text-xs font-bold text-[#00FF66] flex items-center gap-1.5 mb-1">
                <span className="text-[#FFCC00]">[✓]</span> NO_DATABASE
              </div>
              <div className="text-[11px] text-[#008833] leading-relaxed">
                Zero disk writes. Packets exist only in active server RAM.
              </div>
            </div>

            <div className="p-2.5 border border-[#004419] bg-[#020502]">
              <div className="text-xs font-bold text-[#00FF66] flex items-center gap-1.5 mb-1">
                <span className="text-[#FFCC00]">[✓]</span> DYNAMIC_TTY
              </div>
              <div className="text-[11px] text-[#008833] leading-relaxed">
                High-entropy Nanoid frequency allocation per session.
              </div>
            </div>

            <div className="p-2.5 border border-[#004419] bg-[#020502]">
              <div className="text-xs font-bold text-[#FF3333] flex items-center gap-1.5 mb-1">
                <span className="text-[#FF3333]">[!]</span> PURGE_ON_EXIT
              </div>
              <div className="text-[11px] text-[#008833] leading-relaxed">
                Disconnecting evicts session and vanishes channel traces.
              </div>
            </div>
          </div>

        </div>

        {/* Terminal Bottom Status Line */}
        <div className="px-3 py-1.5 border-t border-[#004419] bg-[#020502] text-[10px] text-[#008833] flex flex-wrap justify-between items-center select-none">
          <span>HOST: 127.0.0.1 // DEV_TTY: /dev/pts/0</span>
          <span className="text-[#00FF66] glow-green-sm">ENCRYPTION: VOLATILE_IN_RAM</span>
          <span>PRESS [ENTER] TO TRANSMIT</span>
        </div>
      </div>
    </div>
  );
}
