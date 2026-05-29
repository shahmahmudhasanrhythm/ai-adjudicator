"use client";

import { motion } from "framer-motion";
import { Layers } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="h-screen w-screen bg-[#050508] flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Animated Logo Container */}
        <motion.div 
          animate={{ 
            boxShadow: [
              "0 0 0px rgba(99,102,241,0)",
              "0 0 40px rgba(99,102,241,0.3)",
              "0 0 0px rgba(99,102,241,0)"
            ]
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-16 w-16 rounded-2xl bg-[#09090e] border border-zinc-800 flex items-center justify-center relative"
        >
          {/* Inner spinning border */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-2xl border border-indigo-500/30 border-t-indigo-500/0 border-r-indigo-500/0"
          />
          <Layers className="h-6 w-6 text-indigo-400" />
        </motion.div>

        {/* Text Stack */}
        <div className="text-center flex flex-col gap-2">
          <motion.h2 
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-sm font-bold tracking-[0.2em] text-zinc-200 uppercase"
          >
            Initializing Matrix
          </motion.h2>
          <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Establishing Secure Node
          </div>
        </div>
      </div>
    </div>
  );
}