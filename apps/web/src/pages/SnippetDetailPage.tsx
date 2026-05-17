import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  Edit3, 
  Trash2, 
  Copy, 
  Check, 
  Hash, 
  Calendar,
  Code
} from 'lucide-react';
import toast from 'react-hot-toast';
import CodeMirror from '@uiw/react-codemirror';
// ... rest of imports unchanged ...
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import api from '../lib/api';
import Layout from '../components/Layout';
import type { Snippet } from '@snipstack/shared';
import { useState } from 'react';

const LANGUAGE_EXTS: Record<string, any> = {
  javascript: [javascript()],
  typescript: [javascript({ typescript: true })],
  python: [python()],
  html: [html()],
  css: [css()],
  markdown: [markdown()],
};

export default function SnippetDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [copied, setCopied] = useState(false);

  const { data: snippet, isLoading } = useQuery({
    queryKey: ['snippet', id],
    queryFn: async () => {
      const res = await api.get(`/snippets/${id}`);
      return res.data.data as Snippet;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => api.delete(`/snippets/${id}`),
    onSuccess: () => {
      toast.success('Snippet removed from stack');
      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      navigate('/');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to delete snippet');
    }
  });

  const handleCopy = () => {
    if (!snippet) return;
    
    const commentChar = ['python', 'ruby', 'shell', 'bash'].includes(snippet.language) ? '#' : '//';
    const contentToCopy = `${commentChar} ${snippet.language}\n${snippet.content}`;
    
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };
// ... rest of component logic unchanged ...


  if (isLoading) return <Layout user={user}><div className="p-20 text-center animate-pulse text-white/30 font-bold uppercase tracking-widest text-xs">Accessing Data...</div></Layout>;
  if (!snippet) return <Layout user={user}><div className="p-20 text-center text-red-400 font-bold">Snippet not found.</div></Layout>;

  return (
    <Layout user={user}>
      <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-10 px-8 flex items-center justify-between">
        <div className="flex items-center gap-6 overflow-hidden">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all flex-shrink-0"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="overflow-hidden space-y-0.5">
            <div className="flex items-center gap-2">
               <span className="px-1.5 py-0.5 bg-white text-black rounded text-[9px] font-black uppercase tracking-widest">
                {snippet.language}
              </span>
              <span className="text-[10px] text-white/30 flex items-center gap-1">
                <Calendar size={10} />
                {new Date(snippet.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-xl font-bold tracking-tight truncate">{snippet.title}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleCopy}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-2 px-4 group"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-white/40 group-hover:text-white" />}
            <span className="text-xs font-bold">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          
          <Link 
            to={`/snippets/${id}/edit`}
            className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-2 px-4 group"
          >
            <Edit3 size={16} className="text-white/40 group-hover:text-white" />
            <span className="text-xs font-bold">Edit</span>
          </Link>
          
          <button 
            onClick={() => { if(confirm('Delete this snippet forever?')) deleteMutation.mutate(); }}
            className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 px-4"
          >
            <Trash2 size={16} />
            <span className="text-xs font-bold">Delete</span>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 max-w-6xl mx-auto w-full space-y-10 pb-32">
        {snippet.description && (
          <div className="space-y-3">
             <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-1 border-l-2 border-white/10 ml-1">Documentation</h2>
             <p className="text-sm text-white/60 leading-relaxed max-w-3xl ml-1">{snippet.description}</p>
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-1 border-l-2 border-white/10 ml-1 flex items-center gap-2">
            <Code size={12} />
            Implementation
          </h2>
          <div className="border border-white/5 rounded-3xl overflow-hidden bg-[#0A0A0A] shadow-2xl relative group">
             <div className="absolute right-4 top-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="px-2 py-1 bg-white/5 backdrop-blur-md border border-white/10 rounded text-[9px] font-black text-white/40 uppercase tracking-widest">Read Only</div>
             </div>
             <CodeMirror
               value={snippet.content}
               theme={oneDark}
               readOnly={true}
               editable={false}
               extensions={LANGUAGE_EXTS[snippet.language] || []}
               basicSetup={{ lineNumbers: true, foldGutter: true }}
               className="text-sm"
             />
          </div>
        </div>

        {snippet.tags && snippet.tags.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-1 border-l-2 border-white/10 ml-1">Associations</h2>
            <div className="flex flex-wrap gap-2 ml-1">
              {snippet.tags.map(tag => (
                <span key={tag.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/5 rounded-xl text-xs font-medium text-white/40">
                  <Hash size={12} className="opacity-40" />
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
