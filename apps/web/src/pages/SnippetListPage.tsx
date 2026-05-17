import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Hash, Filter, Plus, Code2, X } from 'lucide-react';
import debounce from 'lodash/debounce';
import api from '../lib/api';
import Layout from '../components/Layout';
import SnippetCard from '../components/SnippetCard';
import type { Snippet, Tag } from '@snipstack/shared';
import { Link, useSearchParams } from 'react-router-dom';

export default function SnippetListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  
  const selectedTag = searchParams.get('tag');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data: snippetsData, isLoading: isLoadingSnippets } = useQuery({
    queryKey: ['snippets', search, selectedTag],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedTag) params.append('tag', selectedTag);
      const res = await api.get(`/snippets?${params.toString()}`);
      return res.data.data as Snippet[];
    },
  });

  const { data: tagsData } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await api.get('/tags');
      return res.data.data as Tag[];
    },
  });

  const handleSearchChange = useMemo(
    () => debounce((value: string) => setSearch(value), 300),
    []
  );

  const clearTag = () => {
    searchParams.delete('tag');
    setSearchParams(searchParams);
  };

  const selectTag = (tagName: string | null) => {
    if (!tagName) {
      searchParams.delete('tag');
    } else {
      searchParams.set('tag', tagName);
    }
    setSearchParams(searchParams);
  };

  return (
    <Layout user={user}>
      <header className="h-20 border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-10 px-8 flex items-center justify-between">
        <div className="relative flex-1 max-w-2xl mr-8 group">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" />
          <input 
            type="text" 
            placeholder="Search your stack (title, code, description...)"
            className="w-full pl-11 pr-4 py-2.5 bg-white/5 border border-white/5 focus:bg-white/10 focus:border-white/20 rounded-xl outline-none transition-all text-sm font-medium"
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Link 
          to="/snippets/new"
          className="px-5 py-2.5 bg-white text-black text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-white/90 active:scale-95 transition-all"
        >
          <Plus size={18} /> 
          <span>New Snippet</span>
        </Link>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Grid */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {/* Active Filters Bar */}
          {(selectedTag || search) && (
            <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-1">Active Filter:</span>
              {selectedTag && (
                <button 
                  onClick={clearTag}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white text-black rounded-lg text-xs font-bold hover:bg-white/80 transition-all group"
                >
                  <Hash size={12} className="opacity-40" />
                  {selectedTag}
                  <X size={12} className="ml-1 opacity-40 group-hover:opacity-100" />
                </button>
              )}
              {search && (
                <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-white/60">
                   Search: "{search}"
                </div>
              )}
            </div>
          )}

          {isLoadingSnippets ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-[280px] bg-white/5 border border-white/5 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : snippetsData && snippetsData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {snippetsData.map(snippet => (
                <SnippetCard key={snippet.id} snippet={snippet} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="p-8 bg-white/5 rounded-full mb-6 border border-white/5 text-white/10">
                <Code2 size={64} strokeWidth={1.5} />
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-2">No snippets found</h2>
              <p className="text-white/30 text-sm max-w-sm mx-auto leading-relaxed">
                {search || selectedTag 
                  ? "We couldn't find anything matching your filters in your stack." 
                  : "Your stack is empty. Start by creating a new snippet to save your valuable code patterns."}
              </p>
              {(search || selectedTag) && (
                <button 
                  onClick={() => { setSearch(''); selectTag(null); }}
                  className="mt-6 text-sm text-white hover:underline decoration-1 underline-offset-4"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tag Sidebar Filter */}
        <aside className="w-64 border-l border-white/5 bg-black/10 p-8 hidden xl:block">
          <div className="flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-[0.2em] text-white/30">
            <Filter size={12} />
            <span>Filter by Tag</span>
          </div>
          <div className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-200px)] pr-2 custom-scrollbar">
            <button 
              onClick={() => selectTag(null)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                !selectedTag ? 'bg-white/10 text-white shadow-xl shadow-black/20' : 'text-white/30 hover:text-white/60'
              }`}
            >
              <Hash size={14} className={!selectedTag ? 'opacity-100' : 'opacity-20'} />
              All Snippets
            </button>
            {tagsData?.map(tag => (
              <button 
                key={tag.id}
                onClick={() => selectTag(tag.name === selectedTag ? null : tag.name)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  selectedTag === tag.name ? 'bg-white/10 text-white shadow-xl shadow-black/20' : 'text-white/30 hover:text-white/60'
                }`}
              >
                <Hash size={14} className={selectedTag === tag.name ? 'opacity-100' : 'opacity-20'} />
                <span className="truncate">{tag.name}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </Layout>
  );
}
