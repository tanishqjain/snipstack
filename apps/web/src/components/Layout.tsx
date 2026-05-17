import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  Code2, 
  Plus, 
  Search, 
  Hash, 
  User as UserIcon, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import type { User } from '@snipstack/shared';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
}

export default function Layout({ children, user }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-[#0A0A0A] border-r border-white/5 flex flex-col pt-8">
        <div className="px-8 flex items-center gap-3 mb-12">
          <div className="p-2 bg-white text-black rounded-lg">
            <Code2 size={20} />
          </div>
          <span className="text-xl font-bold tracking-tighter">snipstack</span>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20 px-4 mb-2 block">Main</label>
          <Link 
            to="/" 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
              location.pathname === '/' ? "bg-white/5 text-white" : "text-white/40 hover:text-white hover:bg-white/[0.02]"
            )}
          >
            <Search size={18} /> 
            <span>All Snippets</span>
            {location.pathname === '/' && <ChevronRight size={14} className="ml-auto opacity-40" />}
          </Link>
          
          <Link 
            to="/snippets/new" 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
              location.pathname === '/snippets/new' ? "bg-white/5 text-white" : "text-white/40 hover:text-white hover:bg-white/[0.02]"
            )}
          >
            <Plus size={18} /> 
            <span>New Snippet</span>
          </Link>
        </nav>

        <div className="p-6 mt-auto border-t border-white/5 bg-[#080808]">
          <div className="flex items-center gap-3 px-2 mb-6">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <UserIcon size={18} className="text-white/40" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.name || user.email}</p>
              <p className="text-[10px] text-white/30 truncate uppercase tracking-tighter uppercase">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/5 rounded-xl font-bold text-sm transition-all group"
          >
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" /> 
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#333_0%,transparent_50%)] opacity-20 pointer-events-none" />
        {children}
      </main>
    </div>
  );
}
