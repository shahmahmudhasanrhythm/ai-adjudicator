"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createBrowserClient } from '@supabase/ssr';
import { Hexagon, Loader2, Mail, ArrowRight } from "lucide-react";

// --- ORIGINAL GOOGLE SVG ---
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

// --- COMPLEMENTARY BACKGROUND VOLUMETRIC ORBS ---
const backgroundOrbs = [
  { id: 1, size: "40vw", top: "10%", left: "15%", duration: 20, color: "bg-indigo-600/10", xOffset: 50, yOffset: -50 },
  { id: 2, size: "40vw", bottom: "10%", right: "15%", duration: 25, color: "bg-amber-500/5", xOffset: -60, yOffset: 60 }
];

interface OilDrop {
  id: number;
  size: string;
  left: string;
  duration: number;
  delay: number;
  maxOpacity: number;
  xdrift: number;
  color: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  
  const [oilDrops, setOilDrops] = useState<OilDrop[]>([]);

  // Generate the aesthetic fluid blobs on the client to prevent hydration crashes
  useEffect(() => {
    const drops: OilDrop[] = [];
    const numDrops = 25; // Adjusted for larger, distinct elements
    const colors = ["bg-amber-600", "bg-orange-500", "bg-rose-600", "bg-red-500"];

    for (let i = 0; i < numDrops; i++) {
      const sizeVw = Math.random() * 8 + 4; // Much larger: 4vw to 12vw
      const leftPos = Math.random() * 100; // Spread across the entire screen
      
      drops.push({
        id: i,
        size: `${sizeVw}vw`,
        left: `${leftPos}%`,
        duration: Math.random() * 15 + 15, // Smooth, slow duration (15-30s)
        delay: Math.random() * -30, // Negative delay to start mid-animation
        maxOpacity: Math.random() * 0.4 + 0.2, // Subtle, cinematic opacity
        color: colors[Math.floor(Math.random() * colors.length)], 
        xdrift: (Math.random() - 0.5) * 100, // Wide horizontal drifting
      });
    }
    setOilDrops(drops);
  }, []);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (error) alert(error.message);
    else setLinkSent(true);
    
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="h-screen w-screen bg-[#050101] flex items-center justify-center p-6 relative overflow-hidden font-sans text-zinc-200 selection:bg-rose-500/30">
      
      {/* --- CINEMATIC FLUID / OIL BACKGROUND --- */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        
        {/* Rendering the Discrete Particle Oil Drops */}
        {oilDrops.map((drop) => (
          <motion.div
            key={drop.id}
            initial={{ y: "110vh", x: 0, opacity: 0 }} 
            animate={{
              y: ["110vh", "20vh"], // Ascend to 20% from the top
              x: [0, drop.xdrift, 0], // Smooth horizontal sway
              opacity: [0, drop.maxOpacity, 0], // Fade in from bottom, fade out to 0 before the top
            }}
            transition={{
              y: { duration: drop.duration, repeat: Infinity, ease: "easeInOut", delay: drop.delay },
              x: { duration: drop.duration * 1.2, repeat: Infinity, ease: "easeInOut", delay: drop.delay },
              opacity: { duration: drop.duration, repeat: Infinity, ease: "easeInOut", delay: drop.delay },
            }}
            style={{
              left: drop.left,
              width: drop.size,
              height: drop.size,
            }}
            // Extreme blur transforms circles into fluid volumetric light
            className={`absolute rounded-full blur-[60px] mix-blend-screen ${drop.color}`}
          />
        ))}

        {/* Deep perspective grid with soft radial mask */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_10%,transparent_100%)] opacity-40 mix-blend-screen" />
        
        {/* Core center glow behind the card for luminosity */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-rose-900/10 blur-[150px] rounded-full pointer-events-none" />
      </div>

      {/* --- SECURE GATEWAY CARD (Glassmorphism) --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 15 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[420px] bg-[#070303]/40 backdrop-blur-2xl border border-white/[0.06] p-10 rounded-3xl shadow-[0_30px_100px_-10px_rgba(0,0,0,1)] relative z-10"
      >
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />

        <div className="flex flex-col items-center mb-10 text-center">
          <motion.div 
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.8, ease: "backOut" }}
            className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(244,63,94,0.15)]"
          >
            <Hexagon className="h-6 w-6 text-rose-400" />
          </motion.div>
          <h1 className="text-[28px] font-sans font-medium tracking-[0.1em] text-white mb-2">VERDICT<span className="text-rose-500 font-bold">.AI</span></h1>
          <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-[0.4em]">Secure Node Gateway</p>
        </div>

        {linkSent ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-center p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <Mail className="h-5 w-5 text-emerald-400" />
            </div>
            <p className="font-bold text-emerald-400 tracking-widest uppercase text-[11px] mb-2">Transmission Sent</p>
            <p className="text-xs text-zinc-400 leading-relaxed">Check your operator terminal. A secure access link has been dispatched to your email.</p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            
            <Button 
              onClick={handleGoogleLogin}
              type="button"
              className="w-full h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium tracking-wide rounded-xl flex items-center justify-center gap-3 transition-all backdrop-blur-md"
            >
              <GoogleIcon />
              Continue with Google
            </Button>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/[0.04]"></div>
              <span className="flex-shrink-0 mx-4 text-zinc-600 text-[9px] font-mono uppercase tracking-widest">Or Command Line</span>
              <div className="flex-grow border-t border-white/[0.04]"></div>
            </div>

            <form onSubmit={handleMagicLink} className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-rose-400 transition-colors" />
                <Input 
                  type="email" 
                  placeholder="Operator Email" 
                  required
                  disabled={loading}
                  className="bg-black/20 border-white/[0.06] h-12 pl-11 rounded-xl text-white placeholder:text-zinc-600 focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/40 transition-all font-sans text-sm tracking-wide shadow-inner"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button 
                disabled={loading}
                className="w-full h-12 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] group flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-950" />
                ) : (
                  <>
                    <span className="tracking-[0.2em] uppercase text-[10px]">Initialize Uplink</span>
                    <ArrowRight className="h-3 w-3 opacity-70 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
            
          </div>
        )}
      </motion.div>
    </div>
  );
}