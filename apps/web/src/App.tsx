import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Code2, 
  User as UserIcon, 
  LogOut, 
  Trash2, 
  Copy, 
  Check,
  ChevronRight,
  Hash
} from 'lucide-react';
import type { User, AuthResponse, Snippet } from '@snipstack/shared';

type View = 'login' | 'register' | 'dashboard';

export default function App() {
  const [view, setView] = useState<View>('login');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      setUser(JSON.parse(savedUser));
      setView('dashboard');
    }
  }, [token]);

  const handleAuth = async (type: 'login' | 'register', data: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        const { user, token } = result.data;
        setToken(token);
        setUser(user);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setView('dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setView('login');
  };

  return (
    <div className="min-h-screen font-sans selection:bg-black selection:text-white">
      <AnimatePresence mode="wait">
        {view === 'login' && (
          <AuthPage 
            type="login" 
            onSubmit={(data: any) => handleAuth('login', data)}
            onSwitch={() => setView('register')}
            error={error}
            loading={loading}
          />
        )}
        {view === 'register' && (
          <AuthPage 
            type="register" 
            onSubmit={(data: any) => handleAuth('register', data)}
            onSwitch={() => setView('login')}
            error={error}
            loading={loading}
          />
        )}
        {view === 'dashboard' && user && (
          <Dashboard 
            user={user}
            onLogout={logout}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AuthPage({ type, onSubmit, onSwitch, error, loading }: { 
  type: 'login' | 'register', 
  onSubmit: (data: any) => void,
  onSwitch: () => void,
  error: string | null,
  loading: boolean
}) {
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md mx-auto pt-32 px-6"
    >
      <div className="text-center mb-12">
        <div className="inline-flex p-4 bg-black text-white rounded-2xl mb-4">
          <Code2 size={32} />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">snipstack</h1>
        <p className="text-black/50 mt-2">
          {type === 'login' ? 'Welcome back to your snippet stack' : 'Create an account to start stacking'}
        </p>
      </div>

      <form 
        onSubmit={(e: React.FormEvent) => { e.preventDefault(); onSubmit(formData); }}
        className="space-y-4"
      >
        {type === 'register' && (
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-black/50">Full Name</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl focus:border-black outline-none transition-colors"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        )}
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-black/50">Email Address</label>
          <input 
            type="email" 
            required
            className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl focus:border-black outline-none transition-colors"
            placeholder="you@example.com"
            value={formData.email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-black/50">Password</label>
          <input 
            type="password" 
            required
            className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl focus:border-black outline-none transition-colors"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
          />
        </div>

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button 
          disabled={loading}
          className="w-full py-4 bg-black text-white rounded-xl font-bold hover:bg-black/90 transition-colors disabled:bg-black/50"
        >
          {loading ? 'Processing...' : type === 'login' ? 'Sign In' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-black/50">
          {type === 'login' ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={onSwitch} className="text-black font-bold hover:underline decoration-2 underline-offset-4">
            {type === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </form>
    </motion.div>
  );
}

function Dashboard({ user, onLogout }: { user: User, onLogout: () => void }) {
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSnippets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/snippets?search=${search}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (res.ok) {
        setSnippets(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch snippets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnippets();
  }, [user.id, search]);

  const filtered = snippets.filter((s: Snippet) => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-white border-r border-black/5 p-6 space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-black text-white rounded-lg">
            <Code2 size={20} />
          </div>
          <span className="text-xl font-black tracking-tight">snipstack</span>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40 px-3">Main</label>
          <button className="w-full flex items-center gap-3 px-3 py-2 bg-black/5 text-black rounded-lg font-medium text-sm">
            <Plus size={18} /> All Snippets
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-black/50 hover:bg-black/5 hover:text-black rounded-lg font-medium text-sm transition-all">
            <Hash size={18} /> Tags
          </button>
        </div>

        <div className="pt-8 mt-auto border-t border-black/5">
          <div className="flex items-center gap-3 px-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center">
              <UserIcon size={16} className="text-black/50" />
            </div>
            <div className="flex-1 truncate">
              <p className="text-sm font-bold truncate">{user.name || user.email}</p>
              <p className="text-[10px] text-black/40 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg font-bold text-sm transition-all"
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-20 border-b border-black/5 bg-white/50 backdrop-blur-xl sticky top-0 z-10 px-8 flex items-center justify-between">
          <div className="relative w-full max-w-xl">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" />
            <input 
              type="text" 
              placeholder="Search stack..."
              className="w-full pl-10 pr-4 py-2 bg-black/5 border-transparent focus:bg-white focus:border-black rounded-xl outline-none transition-all text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowAdd(true)}
              className="px-4 py-2 bg-black text-white text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-black/80 transition-all"
            >
              <Plus size={18} /> New Snippet
            </button>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filtered.map((snippet) => (
                <SnippetCard key={snippet.id} snippet={snippet} />
              ))}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <div className="inline-flex p-6 bg-black/5 rounded-full text-black/20 mb-4">
                  <Search size={48} />
                </div>
                <h3 className="text-lg font-bold text-black/50">No snippets found</h3>
                <p className="text-sm text-black/30 mt-1">Try a different search or create a new one.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SnippetCard({ snippet }: { snippet: Snippet }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(snippet.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white border border-black/5 rounded-2xl group hover:border-black/20 transition-all overflow-hidden"
    >
      <div className="p-5 border-b border-black/5 flex items-center justify-between bg-black/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white border border-black/10 rounded-md text-[10px] font-bold uppercase tracking-wider text-black/50">
            {snippet.language}
          </div>
          <h3 className="text-sm font-bold truncate max-w-[150px]">{snippet.title}</h3>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={copy} className="p-2 hover:bg-black/5 rounded-lg text-black/40 hover:text-black">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button className="p-2 hover:bg-red-50 rounded-lg text-black/40 hover:text-red-500">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="p-5 font-mono text-[11px] leading-relaxed text-black/70 overflow-hidden">
        <pre className="whitespace-pre-wrap">
          {snippet.content.length > 200 ? snippet.content.slice(0, 200) + '...' : snippet.content}
        </pre>
      </div>
      <div className="px-5 py-3 border-t border-black/5 flex flex-wrap gap-2">
        {snippet.tags.map(tag => (
          <span key={tag.id} className="text-[10px] font-bold text-black/40 hover:text-black cursor-pointer transition-colors">
            #{tag.name}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
