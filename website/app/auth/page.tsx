"use client";

import React, { useState } from 'react';
import { Mail, Lock, User, UserPlus, ChevronRight } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const getHeaders = () => ({
  'apikey': supabaseAnonKey,
  'Content-Type': 'application/json'
});

/**
 * Standalone AuthPage Component
 * Handles login and registration via direct Supabase REST/Auth API calls.
 * Uses standard window.location for redirection to avoid library resolution issues.
 */
export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'signup' ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password';
      const body = mode === 'signup' 
        ? { email, password, data: { first_name: firstName, last_name: lastName } } 
        : { email, password };

      const res = await fetch(`${supabaseUrl}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error_description || data.msg || 'Authentication failed');
      }

      if (mode === 'signup') {
        setError('Verification email sent! Please check your inbox.');
      } else {
        // Save session locally for the dashboard to pick up
        localStorage.setItem('supabase.auth.token', JSON.stringify(data));
        
        // Redirect to the individual dashboard using standard browser API
        // This is safer for environment resolution and works perfectly in Next.js
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-50/50">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-12 border border-slate-100">
        <div className="mb-10 text-center">
          <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-6 shadow-xl shadow-green-100/50">G</div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-2">
            {mode === 'login' ? 'Account Login' : 'Create Profile'}
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-none">The Green Way Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
              <input 
                type="text" 
                placeholder="First Name" 
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-slate-400 text-sm font-bold focus:ring-2 focus:ring-green-500" 
                onChange={e => setFirstName(e.target.value)} 
                required 
              />
              <input 
                type="text" 
                placeholder="Last Name" 
                className="w-full px-5 py-4 bg-slate-50 rounded-2xl border-none text-slate-400 text-sm font-bold focus:ring-2 focus:ring-green-500" 
                onChange={e => setLastName(e.target.value)} 
                required 
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-slate-300" size={18} />
            <input 
              type="email" 
              placeholder="Email Address" 
              className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl border-none text-slate-400 text-sm font-bold focus:ring-2 focus:ring-green-500" 
              onChange={e => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-4 text-slate-300" size={18} />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full pl-12 pr-5 py-4 bg-slate-50 rounded-2xl border-none text-slate-400 text-sm font-bold focus:ring-2 focus:ring-green-500" 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          {error && (
            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 p-4 rounded-xl border border-rose-100">
              {error}
            </p>
          )}
          
          <button 
            disabled={loading} 
            className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 mt-4 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (mode === 'login' ? 'Continue' : 'Sign Up')}
          </button>
        </form>

        <button 
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} 
          className="w-full mt-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-green-600 transition-colors"
        >
          {mode === 'login' ? "Don't have an account? Sign Up" : 'Back to login'}
        </button>
      </div>
    </div>
  );
}