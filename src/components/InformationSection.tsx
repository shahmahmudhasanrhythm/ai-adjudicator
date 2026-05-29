"use client";

import { motion } from "framer-motion";
import { Shield, BrainCircuit, Gavel, Network, Cpu, Lock, ArrowRight } from "lucide-react";

export default function InformationSection() {
  return (
    <section id="information" className="relative w-full bg-[#030305] py-32 px-6 overflow-hidden">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-indigo-900/10 blur-[200px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* --- SECTION HEADER --- */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-20"
        >
          <div className="flex items-center gap-3 mb-6">
            <span className="h-px w-8 bg-indigo-500"></span>
            <span className="text-indigo-400 font-mono text-[10px] uppercase tracking-[0.3em]">System Architecture</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-serif font-bold text-white tracking-tight leading-[1.1] max-w-3xl">
            Decentralized logic. <br />
            <span className="text-zinc-500 italic font-light">Absolute finality.</span>
          </h2>
          <p className="mt-8 text-zinc-400 max-w-xl leading-relaxed text-lg">
            Verdict.AI doesn't rely on a single model's hallucination. We route your architecture through a hostile, multi-agent tribunal to cross-examine every vulnerability before deployment.
          </p>
        </motion.div>

        {/* --- BENTO GRID LAYOUT --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: The Core Protocol (Spans 2 columns) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="md:col-span-2 rounded-3xl bg-[#07070a]/80 backdrop-blur-md border border-white/[0.05] p-8 md:p-12 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-colors duration-700" />
            <Network className="h-8 w-8 text-indigo-400 mb-6" />
            <h3 className="text-2xl font-bold text-white mb-4">Multi-Agent Consensus Protocol</h3>
            <p className="text-zinc-400 leading-relaxed max-w-md mb-8">
              Your input is simultaneously processed by three distinct neural architectures. They are programmed with conflicting directives to force a logical debate, eliminating single-model bias.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono tracking-widest uppercase text-zinc-500">
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Routing Active</span>
            </div>
          </motion.div>

          {/* Card 2: Cryptographic Security */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="rounded-3xl bg-zinc-950/50 backdrop-blur-md border border-white/[0.05] p-8 relative overflow-hidden group"
          >
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[50px] group-hover:bg-emerald-500/20 transition-colors duration-700" />
            <Lock className="h-8 w-8 text-emerald-400 mb-6" />
            <h3 className="text-xl font-bold text-white mb-3">Zero-Trust Sandbox</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              All proprietary code and policy frameworks are evaluated in an isolated execution environment. Data is purged immediately post-verdict.
            </p>
          </motion.div>

          {/* Card 3: The Prosecutor */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="rounded-3xl bg-rose-950/10 backdrop-blur-md border border-rose-500/10 p-8 relative hover:border-rose-500/30 transition-colors duration-500"
          >
            <Shield className="h-6 w-6 text-rose-400 mb-4" />
            <h3 className="text-lg font-bold text-rose-100 mb-2">Phase I: The Prosecutor</h3>
            <p className="text-rose-400/60 text-sm leading-relaxed">
              Powered by Llama 3.3. Instructed to aggressively seek out edge-cases, vulnerabilities, and logical fallacies in your framework.
            </p>
          </motion.div>

          {/* Card 4: The Logician */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="rounded-3xl bg-indigo-950/10 backdrop-blur-md border border-indigo-500/10 p-8 relative hover:border-indigo-500/30 transition-colors duration-500"
          >
            <BrainCircuit className="h-6 w-6 text-indigo-400 mb-4" />
            <h3 className="text-lg font-bold text-indigo-100 mb-2">Phase II: The Logician</h3>
            <p className="text-indigo-400/60 text-sm leading-relaxed">
              Powered by DeepSeek R1. Attempts to defend the architecture by mathematically proving structural soundness against the prosecution.
            </p>
          </motion.div>

          {/* Card 5: The Magistrate */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="rounded-3xl bg-amber-950/10 backdrop-blur-md border border-amber-500/10 p-8 relative hover:border-amber-500/30 transition-colors duration-500"
          >
            <Gavel className="h-6 w-6 text-amber-400 mb-4" />
            <h3 className="text-lg font-bold text-amber-100 mb-2">Phase III: The Magistrate</h3>
            <p className="text-amber-400/60 text-sm leading-relaxed">
              Powered by Gemini Pro. Synthesizes the debate, issues a final numerical structural score, and generates the resolution protocol.
            </p>
          </motion.div>

        </div>

      </div>
    </section>
  );
}