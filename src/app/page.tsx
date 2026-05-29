"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Hexagon, ChevronRight, ShieldAlert, Activity, Lock, Shield, BrainCircuit, Gavel, Network } from "lucide-react";
import { useEffect, useState } from "react";

// --- THE BACKGROUND SOLVER COMPONENT ---
const SolvingBackground = () => {
  const [lines, setLines] = useState<{ text: string; color: string }[]>([]);

  useEffect(() => {
    let isCancelled = false;

    const runSequence = async () => {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

      while (!isCancelled) {
        setLines([]);
        await sleep(1000);

        const sequence = [
          { t: "> Initializing Agent: Mathematical Core...", c: "text-zinc-400", ms: 800 },
          { t: "> Task: Evaluate Gaussian Integral I = ∫_0^∞ e^(-x²) dx", c: "text-zinc-300", ms: 1200 },
          { t: "> Method: Square the integral and map to 2D space", c: "text-zinc-400", ms: 1000 },
          { t: "  I² = [∫_0^∞ e^(-x²) dx] [∫_0^∞ e^(-y²) dy]", c: "text-indigo-300/80", ms: 800 },
          { t: "  I² = ∫_0^∞ ∫_0^∞ e^(-(x²+y²)) dx dy", c: "text-indigo-300/80", ms: 1000 },
          { t: "> Applying Polar Transformation (x=r cos θ, y=r sin θ)", c: "text-zinc-400", ms: 900 },
          { t: "  Jacobian determinant: dx dy = r dr dθ", c: "text-zinc-300", ms: 800 },
          { t: "> Mapping bounds for Quadrant I (x≥0, y≥0):", c: "text-zinc-400", ms: 1000 },
          
          // The Mistake
          { t: "  r ∈ [0, ∞), θ ∈ [0, π]", c: "text-indigo-300/80", ms: 1500 }, 
          { t: "  I² = ∫_0^π ∫_0^∞ e^(-r²) r dr dθ", c: "text-indigo-300/80", ms: 800 },
          { t: "  I² = ∫_0^π [ -1/2 e^(-r²) ]_0^∞ dθ", c: "text-indigo-300/80", ms: 800 },
          { t: "  I² = ∫_0^π (1/2) dθ = π/2", c: "text-indigo-300/80", ms: 1200 },
          { t: "  ∴ I = √(π/2)", c: "text-indigo-300/80", ms: 2000 },
          
          // The Correction
          { t: "[!] CONTRADICTION DETECTED: BOUNDARY LOGIC FLAW", c: "text-rose-400 font-bold", ms: 1500 },
          { t: ">>> Agent_Prosecutor: Quadrant I angle bounds are strictly [0, π/2], not [0, π].", c: "text-amber-400", ms: 2000 },
          { action: "backspace", count: 7, ms: 1000 }, 
          
          // The Fix
          { t: "> Re-mapping bounds for Quadrant I:", c: "text-zinc-400", ms: 800 },
          { t: "  r ∈ [0, ∞), θ ∈ [0, π/2]", c: "text-emerald-400", ms: 1000 },
          { t: "  I² = ∫_0^(π/2) ∫_0^∞ e^(-r²) r dr dθ", c: "text-indigo-300/80", ms: 800 },
          { t: "  I² = ∫_0^(π/2) (1/2) dθ = π/4", c: "text-indigo-300/80", ms: 800 },
          { t: "  ∴ I = √(π)/2", c: "text-emerald-400 font-bold", ms: 2000 },
          { t: "[✓] PROOF VERIFIED. STRUCTURAL CONSENSUS ACHIEVED.", c: "text-zinc-300", ms: 6000 },
        ];

        for (const step of sequence) {
          if (isCancelled) break;
          
          if (step.action === "backspace") {
            for (let i = 0; i < (step.count || 0); i++) {
              setLines((prev) => prev.slice(0, -1));
              await sleep(150);
            }
            await sleep(step.ms || 0);
          } else {
            setLines((prev) => [...prev, { text: step.t || "", color: step.c || "" }]);
            await sleep(step.ms || 0);
          }
        }
      }
    };

    runSequence();
    return () => { isCancelled = true; };
  }, []);

  return (
    // FIX 1: Set to opacity-30 so it acts as a gorgeous watermark that doesn't ruin text readability when scrolling
    <div className="fixed inset-0 z-0 p-8 md:p-16 overflow-hidden pointer-events-none opacity-30 select-none">
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03]" />
      
      {lines.map((l, i) => (
        <motion.div 
          key={i} 
          initial={{ opacity: 0, x: -5 }} 
          animate={{ opacity: 1, x: 0 }} 
          className={`font-mono text-sm md:text-lg leading-loose tracking-wide ${l.color}`}
          style={{ textShadow: "0 0 20px currentColor" }} 
        >
          {l.text}
        </motion.div>
      ))}
      <motion.div 
        animate={{ opacity: [0, 1, 0] }} 
        transition={{ repeat: Infinity, duration: 0.8 }} 
        className="w-3 h-5 md:h-6 bg-indigo-400 mt-2 inline-block shadow-[0_0_15px_rgba(129,140,248,0.8)]" 
      />
    </div>
  );
};

// --- THE NEW INFORMATION SECTION ---
const InformationSection = () => {
  return (
    // FIX 2: Stripped the solid background and border. It is now completely transparent to let the math flow underneath.
    <section id="information" className="relative z-10 w-full py-32 px-6">
      
      {/* Background Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-indigo-900/10 blur-[200px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-20 relative"
        >
          {/* Subtle text mask to ensure the math background doesn't make the header unreadable */}
          <div className="absolute inset-0 -inset-x-10 -inset-y-10 bg-[#030305]/70 blur-2xl -z-10 rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <span className="h-px w-8 bg-indigo-500"></span>
            <span className="text-indigo-400 font-mono text-[10px] uppercase tracking-[0.3em]">System Architecture</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight leading-[1.1] max-w-2xl relative z-10">
            Decentralized logic. <br />
            <span className="text-zinc-500 italic font-light">Absolute finality.</span>
          </h2>
          <p className="mt-8 text-zinc-400 max-w-xl leading-relaxed text-lg font-light relative z-10">
            Verdict.AI doesn't rely on a single model's hallucination. We route your architecture through a hostile, multi-agent tribunal to cross-examine every vulnerability before deployment.
          </p>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Core Protocol */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="md:col-span-2 rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/[0.08] p-8 md:p-12 relative overflow-hidden group shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-colors duration-700" />
            <Network className="h-8 w-8 text-indigo-400 mb-6 relative z-10" />
            <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Multi-Agent Consensus Protocol</h3>
            <p className="text-zinc-400 leading-relaxed max-w-md mb-8 relative z-10">
              Your input is simultaneously processed by three distinct neural architectures. They are programmed with conflicting directives to force a logical debate, eliminating single-model bias.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono tracking-widest uppercase text-zinc-500 relative z-10">
              <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> Routing Active</span>
            </div>
          </motion.div>

          {/* Card 2: Security */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-white/[0.08] p-8 relative overflow-hidden group shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          >
             <div className="absolute bottom-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px] group-hover:bg-emerald-500/20 transition-colors duration-700" />
            <Lock className="h-8 w-8 text-emerald-400 mb-6 relative z-10" />
            <h3 className="text-xl font-bold text-white mb-3 relative z-10">Zero-Trust Sandbox</h3>
            <p className="text-zinc-400 leading-relaxed text-sm relative z-10">
              All proprietary code and policy frameworks are evaluated in an isolated execution environment. Data is purged immediately post-verdict.
            </p>
          </motion.div>

          {/* Card 3: Prosecutor */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-rose-500/10 p-8 relative hover:border-rose-500/30 transition-colors duration-500 group shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Shield className="h-6 w-6 text-rose-400 mb-4 relative z-10" />
            <h3 className="text-lg font-bold text-rose-100 mb-2 relative z-10">Phase I: The Prosecutor</h3>
            <p className="text-rose-400/60 text-sm leading-relaxed relative z-10">
              Powered by Llama 3.3. Instructed to aggressively seek out edge-cases, vulnerabilities, and logical fallacies in your framework.
            </p>
          </motion.div>

          {/* Card 4: Logician */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-indigo-500/10 p-8 relative hover:border-indigo-500/30 transition-colors duration-500 group shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <BrainCircuit className="h-6 w-6 text-indigo-400 mb-4 relative z-10" />
            <h3 className="text-lg font-bold text-indigo-100 mb-2 relative z-10">Phase II: The Logician</h3>
            <p className="text-indigo-400/60 text-sm leading-relaxed relative z-10">
              Powered by DeepSeek R1. Attempts to defend the architecture by mathematically proving structural soundness against the prosecution.
            </p>
          </motion.div>

          {/* Card 5: Magistrate */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
            className="rounded-3xl bg-black/60 backdrop-blur-2xl border border-amber-500/10 p-8 relative hover:border-amber-500/30 transition-colors duration-500 group shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Gavel className="h-6 w-6 text-amber-400 mb-4 relative z-10" />
            <h3 className="text-lg font-bold text-amber-100 mb-2 relative z-10">Phase III: The Magistrate</h3>
            <p className="text-amber-400/60 text-sm leading-relaxed relative z-10">
              Powered by Gemini Pro. Synthesizes the debate, issues a final numerical structural score, and generates the resolution protocol.
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

// --- THE MAIN PAGE COMPONENT ---
export default function LandingPage() {
  return (
    <div className="relative h-screen w-full bg-[#030305] text-zinc-100 font-sans scroll-smooth overflow-y-auto overflow-x-hidden">
      
      {/* 1. The Living AI Background (Fixed and seamless) */}
      <SolvingBackground />

      {/* --- HERO SECTION WRAPPER --- */}
      <section className="relative min-h-screen w-full flex flex-col shrink-0">
        
        {/* 2. Ambient Lighting for depth */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[5%] right-[5%] w-[60vw] h-[60vw] bg-indigo-600/30 blur-[180px] rounded-full mix-blend-screen"
          />
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.15, 0.05] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-amber-600/20 blur-[150px] rounded-full mix-blend-screen"
          />
        </div>

        {/* 3. Text Mask */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[#030305]/70 blur-[100px] z-0 pointer-events-none rounded-full" />

        {/* --- NAVIGATION BAR --- */}
        <nav className="relative z-50 w-full px-8 py-6 flex items-center justify-between border-b border-white/[0.05] bg-[#030305]/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Hexagon className="h-6 w-6 text-indigo-400" />
            <span className="font-serif font-bold tracking-wide text-xl">VERDICT.AI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
            <a 
              href="#information" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('information')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-zinc-100 transition-colors cursor-pointer"
            >
              Information
            </a>
            <Link href="/pricing" className="hover:text-zinc-100 transition-colors">Pricing Architecture</Link>
            <Link href="/login" className="flex items-center gap-2 hover:text-zinc-100 transition-colors">
              <Lock className="h-3.5 w-3.5" /> Log In
            </Link>
          </div>
          
          <Link href="/dashboard">
            <button className="px-5 py-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold tracking-widest uppercase transition-all flex items-center gap-2">
              Launch Node <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </Link>
        </nav>

        {/* --- HERO CONTENT --- */}
        <main className="relative z-10 flex flex-col items-center justify-center text-center max-w-5xl mx-auto px-6 py-16 flex-grow">
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8 px-4 py-1.5 rounded-full border border-indigo-500/40 bg-[#0a0a10]/80 backdrop-blur-md text-[10px] font-mono font-medium text-indigo-300 flex items-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
            MULTIPLE AGENT CONSENSUS PROTOCOL
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight mb-8 text-white leading-tight drop-shadow-[0_0_40px_rgba(255,255,255,0.1)]"
          >
            Arguments judged by <br />
            <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 bg-clip-text text-transparent italic pr-4 drop-shadow-lg">
              silicon logic.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="text-lg md:text-xl text-zinc-200 max-w-2xl mb-12 font-light leading-relaxed drop-shadow-md"
          >
            Submit your strategic proposals, business frameworks, or architectural designs. Our decentralized AI tribunal cross-examines your logic for fatal flaws before you deploy.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-5 relative z-30"
          >
            <Link href="/dashboard">
              <button className="px-8 py-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] flex items-center gap-2 tracking-wide">
                Enter the Tribunal <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
            <Link href="/pricing">
              <button className="px-8 py-4 rounded-xl bg-black/60 border border-white/[0.15] hover:border-white/[0.3] hover:bg-black/80 text-white font-medium text-sm transition-all flex items-center gap-2 backdrop-blur-xl shadow-2xl">
                View Architecture Pricing
              </button>
            </Link>
          </motion.div>
        </main>

        {/* --- FLOATING STATUS CARDS --- */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
          className="w-full flex flex-wrap justify-center gap-6 pb-12 px-6 mt-auto relative z-40"
        >
          <div className="hidden md:flex items-center gap-4 px-6 py-4 rounded-xl border border-white/[0.08] bg-black/70 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <ShieldAlert className="h-5 w-5 text-rose-500" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-0.5">Agent 01: Prosecutor</span>
              <span className="text-xs font-bold text-zinc-200">Flaw Detection Active</span>
            </div>
          </div>
          <div className="flex items-center gap-4 px-6 py-4 rounded-xl border border-white/[0.08] bg-black/70 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <Activity className="h-5 w-5 text-emerald-500" />
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest mb-0.5">System Status</span>
              <span className="text-xs font-bold text-zinc-200">Consensus Achieved</span>
            </div>
          </div>
        </motion.div>

      </section>

      {/* --- INJECTED INFORMATION SECTION --- */}
      <InformationSection />

    </div>
  );
}