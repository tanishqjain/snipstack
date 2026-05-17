import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, ChevronLeft, Hash, X, Plus } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import api from '../lib/api';
import Layout from '../components/Layout';
import type { Snippet, Tag } from '@snipstack/shared';

const LANGUAGES = [
  { label: 'Plain Text', value: 'plaintext', ext: [] },
  { label: 'JavaScript', value: 'javascript', ext: [javascript()] },
  { label: 'TypeScript', value: 'typescript', ext: [javascript({ typescript: true })] },
  { label: 'Python', value: 'python', ext: [python()] },
  { label: 'HTML', value: 'html', ext: [html()] },
  { label: 'CSS', value: 'css', ext: [css()] },
  { label: 'Markdown', value: 'markdown', ext: [markdown()] },
];

export default function SnippetEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    language: 'javascript'
  });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState('');

  const { data: existingSnippet } = useQuery({
    queryKey: ['snippet', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/snippets/${id}`);
      return res.data.data as Snippet;
    },
    enabled: !!id,
  });

  const { data: allTags } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await api.get('/tags');
      return res.data.data as Tag[];
    },
  });

  useEffect(() => {
    if (existingSnippet) {
      setFormData({
        title: existingSnippet.title,
        description: existingSnippet.description || '',
        content: existingSnippet.content,
        language: existingSnippet.language,
      });
      setSelectedTagIds(existingSnippet.tags?.map(t => t.id) || []);
    }
  }, [existingSnippet]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (id) {
        return api.put(`/snippets/${id}`, data);
      } else {
        return api.post('/snippets', data);
      }
    },
    onSuccess: async (response) => {
      const snippetId = id || response.data.data.id;
      
      // Update tags association
      // In a real app, you might do this in a single transaction in backend
      // But based on requested routes, we have attachment endpoints
      const currentTags = existingSnippet?.tags?.map(t => t.id) || [];
      const tagsToAdd = selectedTagIds.filter(tid => !currentTags.includes(tid));
      const tagsToRemove = currentTags.filter(tid => !selectedTagIds.includes(tid));

      await Promise.all([
        ...tagsToAdd.map(tid => api.post(`/snippets/${snippetId}/tags/${tid}`)),
        ...tagsToRemove.map(tid => api.delete(`/snippets/${snippetId}/tags/${tid}`))
      ]);

      queryClient.invalidateQueries({ queryKey: ['snippets'] });
      queryClient.invalidateQueries({ queryKey: ['snippet', snippetId] });
      navigate(`/snippets/${snippetId}`);
    }
  });

  const createTagMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.post('/tags', { name });
      return res.data.data as Tag;
    },
    onSuccess: (newTag) => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setSelectedTagIds([...selectedTagIds, newTag.id]);
      setNewTagName('');
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const activeLang = LANGUAGES.find(l => l.value === formData.language) || LANGUAGES[0];

  return (
    <Layout user={user}>
      <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-20 px-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">
            {id ? 'Edit Snippet' : 'Create New Snippet'}
          </h1>
        </div>
        <button 
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="px-6 py-2.5 bg-white text-black text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-white/90 active:scale-95 transition-all disabled:opacity-50"
        >
          <Save size={18} /> 
          <span>{saveMutation.isPending ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-10 max-w-6xl mx-auto w-full space-y-12 pb-32">
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-1">Snippet Title</label>
              <input 
                type="text"
                placeholder="e.g., React Debounce Hook"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/5 focus:bg-white/10 focus:border-white/20 rounded-xl outline-none transition-all text-lg font-bold"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-1">Language</label>
              <select 
                className="w-full px-5 py-3.5 bg-white/5 border border-white/5 focus:bg-white/10 focus:border-white/20 rounded-xl outline-none transition-all appearance-none cursor-pointer text-sm"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.value} value={lang.value} className="bg-[#0A0A0A]">{lang.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-1">Code Content</label>
            <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#0A0A0A] min-h-[400px]">
              <CodeMirror
                value={formData.content}
                height="400px"
                theme={oneDark}
                extensions={activeLang.ext}
                onChange={(value) => setFormData({ ...formData, content: value })}
                className="text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-1">Description (Optional)</label>
            <textarea 
              rows={3}
              placeholder="Explain how to use this snippet or what problem it solves..."
              className="w-full px-5 py-4 bg-white/5 border border-white/5 focus:bg-white/10 focus:border-white/20 rounded-xl outline-none transition-all text-sm resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </section>

        <section className="space-y-4">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-1">Organize with Tags</label>
          
          <div className="flex flex-wrap gap-3">
            {selectedTagIds.map(tid => {
              const tag = allTags?.find(t => t.id === tid);
              if (!tag) return null;
              return (
                <button 
                  key={tid}
                  onClick={() => setSelectedTagIds(selectedTagIds.filter(id => id !== tid))}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/10 rounded-lg text-xs font-bold text-white hover:bg-red-500/20 hover:border-red-500/30 transition-all group"
                >
                  <Hash size={12} className="text-white/40" />
                  {tag.name}
                  <X size={12} className="ml-1 opacity-40 group-hover:opacity-100" />
                </button>
              );
            })}
            
            <div className="relative group">
              <Plus size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white" />
              <input 
                type="text"
                placeholder="Add tag..."
                className="pl-9 pr-4 py-1.5 bg-white/5 border border-white/5 rounded-lg text-xs font-medium focus:bg-white/10 focus:border-white/20 outline-none w-32 focus:w-48 transition-all"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newTagName.trim()) createTagMutation.mutate(newTagName.trim());
                  }
                }}
              />
            </div>
          </div>

          {allTags && allTags.length > 0 && (
            <div className="pt-4 border-t border-white/5">
               <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-3 ml-1">Existing Tags</p>
               <div className="flex flex-wrap gap-2">
                 {allTags.filter(t => !selectedTagIds.includes(t.id)).map(tag => (
                   <button 
                     key={tag.id}
                     onClick={() => setSelectedTagIds([...selectedTagIds, tag.id])}
                     className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[11px] font-medium text-white/40 hover:text-white hover:bg-white/10 transition-all border-dashed"
                   >
                     {tag.name}
                   </button>
                 ))}
               </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
