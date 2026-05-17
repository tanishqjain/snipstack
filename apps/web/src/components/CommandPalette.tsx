import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Terminal, Code } from 'lucide-react';
import api from '../lib/api';
import type { Snippet } from '@snipstack/shared';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const { data: snippets } = useQuery({
    queryKey: ['snippets', 'all'],
    queryFn: async () => {
      const res = await api.get('/snippets');
      return res.data.data as Snippet[];
    },
    enabled: open,
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        navigate('/snippets/new');
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [navigate]);

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
    >
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center px-4 border-b border-white/5">
          <Search className="w-5 h-5 text-white/20" />
          <Command.Input 
            placeholder="Search snippets or run commands..."
            className="w-full py-4 px-3 bg-transparent outline-none text-sm text-white placeholder:text-white/20"
          />
        </div>

        <Command.List className="max-h-[350px] overflow-y-auto p-2 custom-scrollbar">
          <Command.Empty className="py-8 text-center text-xs text-white/30">No results found.</Command.Empty>

          <Command.Group heading="Navigation" className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/20">
             <Command.Item 
              onSelect={() => { navigate('/snippets/new'); setOpen(false); }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 aria-selected:bg-white/5 aria-selected:text-white cursor-pointer transition-all"
             >
                <Plus size={16} />
                <span>New Snippet</span>
                <kbd className="ml-auto flex items-center gap-1 font-mono text-[9px] text-white/20">
                   <span className="text-[12px]">⌘</span>N
                </kbd>
             </Command.Item>
          </Command.Group>

          {snippets && snippets.length > 0 && (
            <Command.Group heading="Snippets" className="mt-4 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/20">
              {snippets.map((snippet) => (
                <Command.Item
                  key={snippet.id}
                  onSelect={() => { navigate(`/snippets/${snippet.id}`); setOpen(false); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-white/60 hover:text-white hover:bg-white/5 aria-selected:bg-white/5 aria-selected:text-white cursor-pointer transition-all group"
                >
                  <Code size={16} className="text-white/10 group-aria-selected:text-white/40" />
                  <span className="truncate flex-1">{snippet.title}</span>
                  <span className="text-[9px] font-black uppercase tracking-tighter text-white/10 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                    {snippet.language}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Group heading="Settings" className="mt-4 px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-white/20">
             <Command.Item 
                onSelect={() => { localStorage.clear(); navigate('/auth'); setOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400/60 hover:text-red-400 hover:bg-red-400/5 aria-selected:bg-red-400/5 aria-selected:text-red-400 cursor-pointer transition-all"
             >
                <Terminal size={16} />
                <span>Reset Application State</span>
             </Command.Item>
          </Command.Group>
        </Command.List>

        <div className="px-4 py-3 border-t border-white/5 bg-black/40 flex items-center justify-between text-[10px] font-medium text-white/20">
          <div className="flex items-center gap-4">
             <span className="flex items-center gap-1"><kbd className="bg-white/5 px-1 rounded">↑↓</kbd> Navigate</span>
             <span className="flex items-center gap-1"><kbd className="bg-white/5 px-1 rounded">↵</kbd> Select</span>
          </div>
          <span className="flex items-center gap-1"><kbd className="bg-white/5 px-1 rounded">ESC</kbd> Close</span>
        </div>
      </div>
    </Command.Dialog>
  );
}
