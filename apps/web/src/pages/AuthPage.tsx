import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Code2 } from 'lucide-react';
import api from '../lib/api';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await api.post(endpoint, formData);
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white selection:text-black">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto pt-32 px-6"
      >
        <div className="text-center mb-12">
          <div className="inline-flex p-4 bg-white text-black rounded-2xl mb-6">
            <Code2 size={32} />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter">snipstack</h1>
          <p className="text-white/40 mt-3 text-sm">
            {isLogin ? 'Welcome back to your technical vault' : 'Start building your code collection'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-1">Full Name</label>
              <input 
                type="text" 
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white focus:bg-white/10 outline-none transition-all"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-1">Email</label>
            <input 
              type="email" 
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white focus:bg-white/10 outline-none transition-all"
              placeholder="jane@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 px-1">Password</label>
            <input 
              type="password" 
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:border-white focus:bg-white/10 outline-none transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-red-400 text-xs font-medium px-1"
            >
              {error}
            </motion.p>
          )}

          <button 
            disabled={loading}
            className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-all disabled:opacity-50 mt-4 active:scale-[0.98]"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>

          <p className="text-center text-xs text-white/40 mt-6">
            {isLogin ? "New here? " : "Already stacking? "}
            <button 
              type="button" 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-white font-bold hover:underline decoration-1 underline-offset-4"
            >
              {isLogin ? 'Create an account' : 'Sign in instead'}
            </button>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
