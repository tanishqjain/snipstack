import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Copy, Check, Clock, Hash } from 'lucide-react';
import type { Snippet } from '@snipstack/shared';
import { useState } from 'react';

export default function SnippetCard({ snippet }: { snippet: Snippet }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(snippet.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const preview = snippet.content.split('\n').slice(0, 3).join('\n');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group relative bg-[#0A0A0A] border border-white/5 rounded-2xl hover:border-white/20 transition-all overflow-hidden flex flex-col h-full"
    >
      <Link to={`/snippets/${snippet.id}`} className="flex-1 flex flex-col p-6 cursor-default">
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1 overflow-hidden pr-8">
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-white/5 border border-white/10 rounded text-[9px] font-black uppercase tracking-widest text-white/50">
                {snippet.language}
              </span>
              <span className="text-[10px] text-white/30 flex items-center gap-1">
                <Clock size={10} />
                {new Date(snippet.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h3 className="text-lg font-bold truncate group-hover:text-white transition-colors">{snippet.title}</h3>
          </div>
          
          <button 
            onClick={handleCopy}
            className="absolute top-6 right-6 p-2 bg-white/5 border border-white/10 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
          >
            {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
          </button>
        </div>

        {snippet.description && (
          <p className="text-xs text-white/40 line-clamp-2 mb-4 leading-relaxed italic">{snippet.description}</p>
        )}

        <div className="relative flex-1 min-h-[80px] bg-black/40 rounded-xl p-4 border border-white/[0.03] font-mono text-[11px] text-white/70 overflow-hidden mb-5">
           <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/60 to-transparent" />
           <pre className="whitespace-pre">
             {preview}
             {snippet.content.split('\n').length > 3 && '\n...'}
           </pre>
        </div>

        <div className="mt-auto flex flex-wrap gap-2">
          {snippet.tags?.map(tag => (
            <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/[0.02] border border-white/5 rounded-full text-[10px] font-medium text-white/30">
              <Hash size={10} className="opacity-50" />
              {tag.name}
            </span>
          ))}
        </div>
      </Link>
    </motion.div>
  );
}
