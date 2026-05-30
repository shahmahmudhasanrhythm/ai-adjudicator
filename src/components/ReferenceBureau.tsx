import { motion } from "framer-motion";
import { Fingerprint, FileText, CheckCircle2 } from "lucide-react";

interface Citation {
  sourceName: string;
  relevance: string;
  confidence: number;
}

interface ReferenceBureauProps {
  citations: Citation[] | undefined;
}

export default function ReferenceBureau({ citations }: ReferenceBureauProps) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="w-full bg-neutral-950/80 backdrop-blur-md border border-neutral-800 rounded-lg p-4 space-y-4 font-sans relative overflow-hidden shadow-lg mt-6">
      {/* Subtle background glow */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-neutral-800 pb-3 relative z-10">
        <div className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-emerald-500" />
          <div>
            <h3 className="text-sm font-bold tracking-widest text-emerald-400 uppercase">Cryptographic Source Ledger</h3>
            <p className="text-[10px] text-neutral-500 font-mono">Verified RAG Citations</p>
          </div>
        </div>
        <div className="text-[10px] font-mono text-neutral-500 flex flex-col items-end">
          <span>SOURCES_VERIFIED: <span className="text-emerald-400 font-bold">{citations.length}</span></span>
          <span className="text-emerald-500/50 flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="h-3 w-3" /> SECURE TRACE
          </span>
        </div>
      </div>

      {/* Citation List */}
      <div className="space-y-3 relative z-10">
        {citations.map((cite, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.15 }}
            className="bg-black/40 border border-white/[0.05] p-3 rounded-md flex flex-col gap-2 hover:border-emerald-500/30 transition-colors"
          >
            <div className="flex justify-between items-start gap-4">
              
              {/* Document Info */}
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-zinc-500 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-zinc-200 tracking-wide mb-1.5">{cite.sourceName}</div>
                  <div className="text-[11px] text-zinc-400 italic border-l-2 border-emerald-500/30 pl-2 leading-relaxed">
                    "{cite.relevance}"
                  </div>
                </div>
              </div>

              {/* Confidence Score */}
              <div className="flex flex-col items-end shrink-0">
                <div className="text-[9px] uppercase tracking-widest font-mono text-zinc-500 mb-1">Weight</div>
                <div className={`text-xs font-bold font-mono px-2 py-0.5 rounded shadow-inner ${
                  cite.confidence >= 90 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  cite.confidence >= 70 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {cite.confidence}%
                </div>
              </div>

            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}