"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link"; 
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShieldAlert, Gavel, Send, Layers, 
  Terminal, Activity, Cpu, CheckCircle2,
  Lock, Hexagon, Radio, Compass, ChevronRight, HelpCircle, Mic,
  Volume2, VolumeX, Zap, BrainCircuit
} from "lucide-react";
import UniversalMatrix from "@/components/UniversalMatrix";
import ReferenceBureau from "@/components/ReferenceBureau"; // <--- ADDED REFERENCE BUREAU IMPORT

export default function Dashboard() {
  const [argument, setArgument] = useState("");
  const [isDeliberating, setIsDeliberating] = useState(false);
  const [verdictResult, setVerdictResult] = useState<any>(null);
  const [simulationBlueprint, setSimulationBlueprint] = useState<any>(null);

  // --- HARDWARE TIER STATE ---
  const [showTierSelect, setShowTierSelect] = useState(false);
  const [activeTier, setActiveTier] = useState("plus"); 

  // --- RATE LIMIT STATE VARIABLES ---
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // --- VOICE DICTATION STATE ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // --- AUDIO TEXT TO SPEECH LIVE COMMS STATE ---
  const [activeSpeaker, setActiveSpeaker] = useState<"none" | "prosecutor" | "magistrate">("none");
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Clean up any speaking audio when the interface closes or changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const synth = window.speechSynthesis;
      
      const loadVoices = () => {
        setAvailableVoices(synth.getVoices());
      };

      loadVoices();
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // --- PREMIUM SYSTEM AUDIO BROADCAST ENGINE ---
  const playVerdictAudio = (prosecutorText: string, magistrateText: string) => {
    if (typeof window === "undefined" || isAudioMuted) return;
    
    const synth = window.speechSynthesis;
    synth.cancel(); 

    const voices = availableVoices.length > 0 ? availableVoices : synth.getVoices();

    const premiumVoices = voices.filter(v => 
      v.lang.startsWith("en") && 
      (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Enhanced") || v.name.includes("Premium"))
    );

    const prosecutorVoice = premiumVoices.find(v => v.name.includes("Female") || v.name.includes("Zira") || v.name.includes("Google US English")) || voices.find(v => v.lang.startsWith("en")) || voices[0];
    const magistrateVoice = premiumVoices.find(v => v.name.includes("Male") || v.name.includes("David") || v.name.includes("Google UK English Male")) || voices.find(v => v.lang.startsWith("en")) || voices[0];

    const cleanProsecutor = prosecutorText.replace(/\[.*?\]/g, "").trim();
    const cleanMagistrate = magistrateText.replace(/\[.*?\]/g, "").trim();

    const prosecutorUtterance = new SpeechSynthesisUtterance(cleanProsecutor);
    prosecutorUtterance.voice = prosecutorVoice;
    prosecutorUtterance.rate = 1.04; 
    prosecutorUtterance.pitch = 0.98; 

    const magistrateUtterance = new SpeechSynthesisUtterance(cleanMagistrate);
    magistrateUtterance.voice = magistrateVoice;
    magistrateUtterance.rate = 0.96; 
    magistrateUtterance.pitch = 0.88; 

    prosecutorUtterance.onstart = () => setActiveSpeaker("prosecutor");
    prosecutorUtterance.onend = () => {
      setActiveSpeaker("magistrate");
      synth.speak(magistrateUtterance);
    };

    magistrateUtterance.onend = () => setActiveSpeaker("none");
    magistrateUtterance.onerror = () => setActiveSpeaker("none");

    synth.speak(prosecutorUtterance);
  };

  const stopAudioBroadcast = () => {
    if (typeof window !== "undefined") {
      window.speechSynthesis.cancel();
      setActiveSpeaker("none");
    }
  };

  const toggleAudioConfiguration = () => {
    if (!isAudioMuted) {
      stopAudioBroadcast();
    }
    setIsAudioMuted(!isAudioMuted);
  };

  // --- AUTOMATED RETRY TIMER HOOK ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRateLimited && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else if (isRateLimited && countdown === 0) {
      setIsRateLimited(false);
      executeAnalysis(activeTier); 
    }
    return () => clearInterval(timer);
  }, [isRateLimited, countdown]);

  // --- VOICE ENGINE INITIALIZATION HOOK ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true; 
        recognition.interimResults = false; 
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              currentTranscript += event.results[i][0].transcript + " ";
            }
          }
          if (currentTranscript) {
            setArgument((prev) => prev + currentTranscript);
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleListening = (e: React.MouseEvent) => {
    e.preventDefault(); 
    
    if (!recognitionRef.current) {
      alert("Your browser does not support Voice Dictation. Please use Chrome or Edge.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // --- 1. INTERCEPT SUBMIT TO SHOW MODAL ---
  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!argument.trim()) return;
    setShowTierSelect(true); 
  };

  // --- 2. EXECUTE TRIBUNAL WITH SELECTED TIER ---
  const executeAnalysis = async (selectedTier: string) => {
    setShowTierSelect(false);
    setActiveTier(selectedTier);
    setIsDeliberating(true);
    setVerdictResult(null);
    setSimulationBlueprint(null); 
    stopAudioBroadcast(); 

    try {
      const response = await fetch("/api/adjudicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          argument: argument,
          tier: selectedTier 
        }),
      });
      
      const data = await response.json();

      if (!response.ok || data.error) {
        if (data.error && data.error.includes("retry in")) {
          const match = data.error.match(/retry in ([\d\.]+)s/);
          const secondsToWait = match ? Math.ceil(parseFloat(match[1])) : 20; 
          setCountdown(secondsToWait);
          setIsRateLimited(true);
          return;
        }
        alert(`SYSTEM ERROR:\n${data.error}`); 
        setVerdictResult(null); 
        return;
      }

      setVerdictResult(data);

      // --- INJECT AI LOGIC INTO DYNAMIC BLUEPRINT ---
      let dynamicBlueprint = data.blueprint;
      if (dynamicBlueprint && data.simulationParams) {
        if (!dynamicBlueprint.environment) dynamicBlueprint.environment = {};
        dynamicBlueprint.environment.gravity = data.simulationParams.gravityMultiplier;
      }
      setSimulationBlueprint(dynamicBlueprint);

      if (!isAudioMuted) {
        playVerdictAudio(data.prosecutorCritique, data.chiefJusticeRuling);
      }
    } catch (error) {
      console.error("Tribunal link failed:", error);
      alert("CRITICAL ERROR: Failed to reach the backend.");
    } finally {
      setIsDeliberating(false);
    }
  };

  return (
    <div className="relative h-screen w-screen bg-[#030305] text-zinc-200 flex flex-col overflow-hidden font-sans">
      
      {/* --- THE NEW RATE LIMIT POPUP --- */}
      {isRateLimited && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="bg-gray-950 border border-gray-800 p-8 rounded-2xl max-w-md w-full text-center shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <h2 className="text-xl font-bold text-zinc-100 mb-2 font-serif tracking-wide">Verdict.AI Community Tier</h2>
            <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
              The consensus core has hit the rapid-fire safety limit. Connection holding. Automatic retry in:
            </p>
            <div className="text-6xl font-mono text-indigo-500 font-bold mb-6 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              {countdown}s
            </div>
            <div className="flex items-center justify-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest animate-pulse">
              <Radio className="h-3 w-3" /> System is maintaining connection...
            </div>
          </div>
        </div>
      )}

      {/* --- TIER SELECTION MODAL POPUP --- */}
      {showTierSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#070303] border border-white/10 p-8 rounded-3xl w-full max-w-4xl shadow-[0_0_100px_rgba(0,0,0,1)] relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-zinc-500/40 to-transparent" />
            
            <h2 className="text-2xl font-serif tracking-widest text-white mb-2">Hardware Selection</h2>
            <p className="text-sm text-zinc-500 mb-8 font-mono">Allocate processing cores for this tribunal.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* LITE */}
              <button onClick={() => executeAnalysis('lite')} className="flex flex-col text-left p-6 rounded-2xl border border-white/5 hover:border-amber-500/50 bg-white/5 hover:bg-amber-500/5 transition-all group">
                <Zap className="h-6 w-6 text-zinc-500 group-hover:text-amber-400 mb-4 transition-colors" />
                <h3 className="text-lg font-bold text-white mb-1">Lite Node</h3>
                <p className="text-xs text-zinc-500 mb-6 font-mono">Llama 3.3 (70B) LPU</p>
                <ul className="text-xs text-zinc-400 space-y-2 mt-auto">
                  <li className="flex items-center"><span className="text-amber-500 mr-2">✓</span>Ultra-low Latency</li>
                  <li className="flex items-center"><span className="text-amber-500 mr-2">✓</span>Logic Validation</li>
                  <li className="flex items-center text-zinc-600"><span className="mr-2">✕</span>Web Tools Disabled</li>
                </ul>
              </button>

              {/* PLUS (DEFAULT) */}
              <button onClick={() => executeAnalysis('plus')} className="flex flex-col text-left p-6 rounded-2xl border border-rose-500/40 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500/10 transition-all group relative overflow-hidden shadow-[0_0_30px_rgba(244,63,94,0.1)]">
                <div className="absolute top-0 right-0 bg-rose-500 text-[9px] font-bold px-3 py-1 uppercase text-white rounded-bl-xl tracking-widest">Current</div>
                <BrainCircuit className="h-6 w-6 text-rose-500 mb-4" />
                <h3 className="text-lg font-bold text-white mb-1">Plus Node</h3>
                <p className="text-xs text-rose-500/70 mb-6 font-mono">Gemini 2.5 Flash</p>
                <ul className="text-xs text-zinc-400 space-y-2 mt-auto">
                  <li className="flex items-center"><span className="text-rose-500 mr-2">✓</span>Balanced Compute</li>
                  <li className="flex items-center"><span className="text-rose-500 mr-2">✓</span>Vector DB Retrieval</li>
                  <li className="flex items-center"><span className="text-rose-500 mr-2">✓</span>Math Tools</li>
                </ul>
              </button>

              {/* PRO */}
              <button onClick={() => executeAnalysis('pro')} className="flex flex-col text-left p-6 rounded-2xl border border-white/5 hover:border-indigo-500/50 bg-white/5 hover:bg-indigo-500/5 transition-all group">
                <Cpu className="h-6 w-6 text-zinc-500 group-hover:text-indigo-400 mb-4 transition-colors" />
                <h3 className="text-lg font-bold text-white mb-1">Pro Node</h3>
                <p className="text-xs text-zinc-500 group-hover:text-indigo-400/70 mb-6 font-mono transition-colors">Gemini 1.5 Pro</p>
                <ul className="text-xs text-zinc-400 space-y-2 mt-auto">
                  <li className="flex items-center"><span className="text-indigo-500 mr-2">✓</span>Deep Logic Parsing</li>
                  <li className="flex items-center"><span className="text-indigo-500 mr-2">✓</span>Live Web Scraping</li>
                  <li className="flex items-center"><span className="text-indigo-500 mr-2">✓</span>Full Agent Loop</li>
                </ul>
              </button>
            </div>

            <button 
              onClick={() => setShowTierSelect(false)} 
              className="mt-8 text-[11px] text-zinc-600 hover:text-white uppercase tracking-widest transition-colors w-full text-center"
            >
              Abort Operation
            </button>
          </motion.div>
        </div>
      )}

      {/* --- AMBIENT 3D LIGHTING & GRID --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_20%,transparent_100%)] opacity-70" />
        <motion.div 
          animate={{ scale: [1, 1.05, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[15%] w-[45vw] h-[45vw] bg-indigo-600/20 blur-[130px] rounded-full mix-blend-screen"
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.1, 0.05] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[-20%] right-[10%] w-[50vw] h-[50vw] bg-amber-500/10 blur-[150px] rounded-full mix-blend-screen"
        />
      </div>

      {/* --- TOP TELEMETRY HEADER --- */}
      <header className="relative z-20 w-full px-6 py-4 flex items-center justify-between border-b border-white/[0.05] bg-[#050508]/80 backdrop-blur-xl shadow-md">
        <div className="flex items-center gap-6">
          
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.6, ease: "backOut" }}
              className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-transparent border border-indigo-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.2)]"
            >
              <Hexagon className="h-4 w-4 text-indigo-400" />
            </motion.div>
            <div className="flex flex-col group-hover:opacity-80 transition-opacity">
              <span className="font-serif font-bold tracking-wide text-zinc-50 text-lg leading-tight">VERDICT.AI</span>
              <span className="text-[9px] text-zinc-500 tracking-[0.2em] uppercase font-semibold">Architecture Node</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.05] text-zinc-400 text-[10px] font-mono shadow-inner">
            <Lock className="h-3 w-3 text-emerald-500" />
            <span>NODE: EN-046 // SECURE SANDBOX</span>
          </div>
        </div>
        <div className="flex items-center gap-6 text-zinc-500 text-[10px] font-mono uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-zinc-300 font-semibold">Consensus Core Online</span>
          </div>
          <div className="hidden sm:block">SYS_LATENCY: <span className="text-indigo-400 font-bold">12ms</span></div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex w-full min-h-0 overflow-hidden">
        
        {/* --- LEFT SIDEBAR: SYSTEM METRICS --- */}
        <section className="w-72 bg-[#060609]/60 backdrop-blur-md border-r border-white/[0.05] p-5 hidden xl:flex flex-col gap-8 shadow-2xl z-20 overflow-y-auto scrollbar-hide">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <div className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold mb-4 flex items-center gap-2">
              <Activity className={`h-3.5 w-3.5 ${isDeliberating ? "text-emerald-400 animate-spin" : "text-indigo-400"}`} /> 
              System Diagnostics
            </div>
            
            <div className={`space-y-4 bg-black/40 border transition-colors duration-500 p-4 rounded-xl shadow-inner ${isDeliberating ? "border-indigo-500/30" : "border-white/[0.03]"}`}>
              <div>
                <div className="flex justify-between text-zinc-400 mb-1.5 text-[11px] font-medium">
                  <span>Logic Precision</span>
                  <span className={isDeliberating ? "text-indigo-400 animate-pulse" : "text-zinc-200"}>
                    {isDeliberating ? "CALCULATING..." : "98.4%"}
                  </span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden shadow-inner relative">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: isDeliberating ? ["0%", "100%", "0%"] : "98.4%" }} 
                    transition={isDeliberating ? { duration: 2, repeat: Infinity, ease: "linear" } : { duration: 1.5, ease: "easeOut" }} 
                    className="bg-indigo-500 h-full shadow-[0_0_10px_rgba(99,102,241,0.5)] absolute" 
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-zinc-400 mb-1.5 text-[11px] font-medium">
                  <span>Factual Rigor (RAG)</span>
                  <span className={isDeliberating ? "text-emerald-400 animate-pulse" : "text-emerald-400"}>
                    {isDeliberating ? "SEARCHING DB..." : "Active"}
                  </span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden shadow-inner relative">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: isDeliberating ? ["100%", "0%", "100%"] : "85%" }} 
                    transition={isDeliberating ? { duration: 1.5, repeat: Infinity, ease: "linear" } : { duration: 1.5, delay: 0.2, ease: "easeOut" }} 
                    className="bg-emerald-500 h-full shadow-[0_0_10px_rgba(16,185,129,0.5)] absolute" 
                  />
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold mb-4 flex items-center gap-2">
              <Cpu className={`h-3.5 w-3.5 ${isDeliberating ? "text-indigo-400 animate-pulse" : "text-amber-500"}`} /> 
              Active Court Array
            </div>
            <div className="space-y-2">
              {[
                { role: "Prosecutor", icon: Radio, color: "text-rose-400", glow: "border-rose-500/30 bg-rose-900/10", model: "Llama 3.3" },
                { role: "Logician", icon: Compass, color: "text-indigo-400", glow: "border-indigo-500/30 bg-indigo-900/10", model: "DeepSeek R1" },
                { role: "Magistrate", icon: Gavel, color: "text-amber-400", glow: "border-amber-500/30 bg-amber-900/10", model: "Gemini Pro" }
              ].map((agent, i) => (
                <motion.div 
                  key={i} 
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-500 ${
                    isDeliberating ? agent.glow : "bg-black/40 border-white/[0.03]"
                  } text-zinc-300 cursor-default`}
                >
                  <span className="flex items-center gap-3 text-xs font-medium">
                    <agent.icon className={`h-4 w-4 ${agent.color} ${isDeliberating ? "animate-pulse" : ""}`} /> 
                    {agent.role}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded transition-colors ${isDeliberating ? "bg-zinc-800 text-zinc-300 animate-pulse" : "bg-zinc-900 text-zinc-500"}`}>
                    {isDeliberating ? "COMPUTING..." : agent.model}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="mt-auto p-4 rounded-xl bg-indigo-500/[0.02] border border-indigo-500/10 flex items-start gap-3">
            <HelpCircle className="h-4 w-4 text-indigo-400/50 shrink-0 mt-0.5" />
            <div className="text-[11px] text-zinc-400 leading-relaxed">
              Submit your strategic policy or code rationale. The cluster uses decentralized consensus to evaluate architectural flaws.
            </div>
          </div>
        </section>

        {/* --- WORKSPACE DIVIDER GRID --- */}
        <section className="flex-1 grid grid-cols-1 lg:grid-cols-2 min-h-0 p-6 gap-6 perspective-1000">
          
          {/* LEFT: THE DOSSIER COMPILER */}
          <motion.div 
            whileHover={{ rotateX: 0.5, rotateY: 0.5 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex flex-col min-h-0 bg-[#07070a]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] overflow-hidden relative"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
            
            <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-indigo-400" />
                <span className="font-serif font-bold text-zinc-200 tracking-wide text-sm">DOSSIER COMPILER</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">Status: <span className="text-emerald-400">Ready</span></span>
            </div>
            
            {/* INTERCEPTED FORM - OPENS MODAL NOW */}
            <form onSubmit={handleInitialSubmit} className="flex-1 flex flex-col p-6 min-h-0 gap-4">
              <div className="flex-1 relative rounded-xl bg-black/50 border border-white/[0.03] p-5 focus-within:border-indigo-500/30 transition-all flex flex-col shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] min-h-0">
                <Textarea
                  placeholder="Draft your operational architecture, or use the microphone to dictate your strategic frameworks here..."
                  className="flex-1 h-full overflow-y-auto bg-transparent border-none text-zinc-200 placeholder:text-zinc-700 text-[15px] leading-loose p-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 scrollbar-hide pb-8"
                  value={argument}
                  onChange={(e) => setArgument(e.target.value)}
                />
                
                <div className="absolute bottom-3 right-4 flex items-center gap-3">
                  {/* VOICE DICTATION BUTTON */}
                  <button 
                    onClick={toggleListening}
                    type="button"
                    className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                      isListening 
                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.4)]" 
                        : "bg-black/80 text-zinc-500 border border-white/[0.05] hover:text-zinc-300 hover:bg-white/[0.05]"
                    } backdrop-blur-md`}
                  >
                    <Mic className={`h-4 w-4 ${isListening ? "animate-pulse" : ""}`} />
                    {isListening && <span className="text-[10px] font-bold tracking-widest uppercase animate-pulse">Recording</span>}
                  </button>

                  <div className="text-[10px] text-zinc-500 font-mono font-medium bg-black/80 px-2 py-1.5 rounded-lg border border-white/[0.05] backdrop-blur-md">
                    CHAR_COUNT: {argument.length}
                  </div>
                </div>
              </div>

              <motion.div whileTap={{ scale: 0.98 }} className="shrink-0">
                <Button 
                  type="submit" 
                  disabled={isDeliberating || !argument.trim()}
                  className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-6 rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] tracking-widest uppercase text-xs gap-3 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" /> 
                  {isDeliberating ? "Executing Agent Protocol..." : "Convene Architectural Court"}
                </Button>
              </motion.div>
            </form>
          </motion.div>

          {/* RIGHT: TRIBUNAL OUTPUT */}
          <motion.div 
            whileHover={{ rotateX: 0.5, rotateY: -0.5 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="flex flex-col min-h-0 bg-[#07070a]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] overflow-hidden relative"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

            <div className="px-6 py-4 border-b border-white/[0.04] flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-500" />
                <span className="font-serif font-bold text-zinc-200 tracking-wide text-sm">CONSENSUS MONITOR</span>
              </div>
              
              {/* INTERACTIVE VOICE COMMS CONFIGURATION SWITCH */}
              {verdictResult && (
                <button 
                  type="button" 
                  onClick={toggleAudioConfiguration} 
                  className="text-zinc-500 hover:text-zinc-300 transition-colors p-1.5 bg-white/[0.03] border border-white/[0.05] rounded-md shadow-inner"
                >
                  {isAudioMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5 text-indigo-400" />}
                </button>
              )}
              
              {isDeliberating && <span className="text-[10px] text-amber-400 font-mono uppercase tracking-widest animate-pulse">Evaluating</span>}
            </div>

            <div className="flex-1 px-6 py-4 overflow-y-auto min-h-0 relative scrollbar-thin scrollbar-thumb-zinc-800">
              <AnimatePresence mode="wait">
                {!isDeliberating && !verdictResult ? (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <div className="h-16 w-16 rounded-2xl bg-black/50 border border-white/[0.05] flex items-center justify-center mb-6 shadow-inner">
                      <Activity className="h-6 w-6 text-zinc-500" />
                    </div>
                    <h3 className="font-serif text-lg text-zinc-300 tracking-wide mb-2">Awaiting Matrix Payload</h3>
                    <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">Live telemetry outputs from decentralized models will populate structural rulings here.</p>
                  </motion.div>
                ) : isDeliberating ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full flex flex-col items-center justify-center gap-8">
                     <div className="relative flex items-center justify-center h-24 w-24">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-full border border-indigo-500/20 border-t-indigo-500" />
                      <motion.div animate={{ rotate: -360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute inset-2 rounded-full border border-amber-500/20 border-b-amber-500" />
                      <Gavel className="h-6 w-6 text-zinc-300" />
                    </div>
                    <div className="text-center space-y-2">
                      <div className="font-serif text-lg text-zinc-200 tracking-wider">Synthesizing Logic</div>
                      <div className="text-zinc-500 text-xs tracking-widest uppercase font-mono">Cross-examining facts...</div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="result" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.4 }} 
                    className="space-y-6 pt-2 block w-full pb-4"
                  >
                    {/* --- DECENTRALIZED VOICE AUDIO BROADCAST INTERFACE --- */}
                    <div className="flex items-center justify-center gap-6 mb-4">
                      
                      {/* PROSECUTOR AUDIO AVATAR */}
                      <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${activeSpeaker === "prosecutor" ? "scale-110" : "scale-100 opacity-30"}`}>
                        <div className={`h-11 w-11 rounded-full border flex items-center justify-center transition-all ${
                          activeSpeaker === "prosecutor"
                            ? "bg-rose-500/10 border-rose-400 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]"
                            : "bg-zinc-900/60 border-white/[0.05] text-zinc-500"
                        }`}>
                          <Radio className={`h-4 w-4 ${activeSpeaker === "prosecutor" ? "animate-pulse" : ""}`} />
                        </div>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">Prosecutor</span>
                      </div>

                      {/* DATA CONNECTION STREAM GLYPH */}
                      <div className="h-px w-14 bg-gradient-to-r from-rose-500/20 via-zinc-800 to-indigo-500/20 relative">
                        {isDeliberating && <div className="absolute inset-0 bg-indigo-500 animate-ping opacity-30" />}
                      </div>

                      {/* MAGISTRATE AUDIO AVATAR */}
                      <div className={`flex flex-col items-center gap-2 transition-all duration-300 ${activeSpeaker === "magistrate" ? "scale-110" : "scale-100 opacity-30"}`}>
                        <div className={`h-11 w-11 rounded-full border flex items-center justify-center transition-all ${
                          activeSpeaker === "magistrate"
                            ? "bg-indigo-500/10 border-indigo-400 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                            : "bg-zinc-900/60 border-white/[0.05] text-zinc-500"
                        }`}>
                          <Gavel className={`h-4 w-4 ${activeSpeaker === "magistrate" ? "animate-pulse" : ""}`} />
                        </div>
                        <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">Magistrate</span>
                      </div>

                    </div>

                    {/* Verdict Banner */}
                    <div className="p-6 rounded-xl bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 relative overflow-hidden shadow-lg">
                      <div className="text-amber-500/80 font-bold tracking-[0.2em] uppercase mb-2 text-[10px] font-mono">Judicial Assessment</div>
                      <div className="font-serif text-3xl text-amber-100 mb-6">{verdictResult.verdict}</div>
                      <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-lg bg-black/60 border border-amber-500/10 shadow-inner">
                        <span className="text-zinc-500 uppercase tracking-widest text-[10px] font-mono">Structural Score</span>
                        <span className="font-bold text-xl text-zinc-100">{verdictResult.score}<span className="text-zinc-600 text-sm font-normal">/100</span></span>
                      </div>
                    </div>
                    
                    {/* Critique Cards */}
                    <div className={`p-6 rounded-xl border transition-all duration-300 shadow-inner ${
                      activeSpeaker === "prosecutor" ? "bg-rose-950/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]" : "border-white/[0.04] bg-black/40"
                    }`}>
                      <div className="flex items-center gap-3 text-rose-400 mb-4 font-bold uppercase tracking-widest text-[10px] font-mono">
                        <ShieldAlert className="h-4 w-4" /> Prosecutor Vulnerability Scan
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[15px]">{verdictResult.prosecutorCritique}</p>
                    </div>
                    
                    <div className={`p-6 rounded-xl border transition-all duration-300 shadow-inner ${
                      activeSpeaker === "magistrate" ? "bg-indigo-950/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]" : "border-white/[0.04] bg-black/40"
                    }`}>
                      <div className="flex items-center gap-3 text-indigo-400 mb-4 font-bold uppercase tracking-widest text-[10px] font-mono">
                        <CheckCircle2 className="h-4 w-4" /> Magistrate Resolution Protocol
                      </div>
                      <p className="text-zinc-300 leading-relaxed text-[15px]">{verdictResult.chiefJusticeRuling}</p>
                    </div>

                    {/* --- DYNAMIC UNIVERSAL MATRIX SIMULATION --- */}
                    {simulationBlueprint && (
                      <div className="pt-2">
                        <UniversalMatrix blueprint={simulationBlueprint} />
                      </div>
                    )}

                    {/* --- CRYPTOGRAPHIC CITATION LEDGER --- */}
                    {verdictResult?.citations && (
                      <div className="pt-2">
                        <ReferenceBureau citations={verdictResult.citations} />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </section>
      </main>

      {/* --- BOTTOM FOOTER LAYER --- */}
      <footer className="relative z-20 w-full border-t border-white/[0.05] bg-[#030305] px-8 py-3 flex items-center justify-between text-[10px] text-zinc-600 font-mono tracking-widest uppercase">
        <div className="flex items-center gap-3">
          <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
          Stable Context: Active
        </div>
        <div className="flex items-center gap-2 hover:text-zinc-400 transition-colors cursor-pointer">
          Compiled via Congruent Intelligence
          <ChevronRight className="h-3 w-3" />
        </div>
      </footer>
      
    </div>
  );
}