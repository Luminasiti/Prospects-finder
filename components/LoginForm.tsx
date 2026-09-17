'use client';

import React, { useState } from 'react';
import { 
  Radar, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  Loader2, 
  ShieldCheck, 
  AlertTriangle, 
  KeyRound 
} from 'lucide-react';

interface LoginFormProps {
  onLoginSuccess: (email: string) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('accounts@luminasiti.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user?.email || email);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0b0f19]">
      <div className="w-full max-w-md bg-slate-900 border-3 border-black rounded-3xl p-8 shadow-[8px_8px_0px_0px_#000]">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#FFE600] border-2 border-black shadow-[3px_3px_0px_0px_#000] flex items-center justify-center mx-auto mb-4">
            <Radar className="w-8 h-8 text-black" />
          </div>

          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
            PROSPECT<span className="text-[#FFE600] bg-black px-2 py-0.5 rounded-lg border border-[#FFE600]">PULSE</span>
          </h1>
          <p className="text-xs font-bold text-slate-400 mt-1">
            Luminasiti Private Lead Finder & Website Audit Engine
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-[#FB7185] text-black border-2 border-black rounded-xl text-xs font-black flex items-center gap-2 shadow-[2px_2px_0px_0px_#000]">
            <AlertTriangle className="w-4 h-4 stroke-[3] shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-300 mb-1.5">
              Authorized Account Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="accounts@luminasiti.com"
                className="w-full bg-white border-2 border-black rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold text-black placeholder-slate-400 shadow-[3px_3px_0px_0px_#000] focus:outline-none focus:shadow-[4px_4px_0px_0px_#FFE600]"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-300 mb-1.5">
              Access Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-black absolute left-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-white border-2 border-black rounded-xl pl-10 pr-10 py-2.5 text-xs font-bold text-black placeholder-slate-400 shadow-[3px_3px_0px_0px_#000] focus:outline-none focus:shadow-[4px_4px_0px_0px_#FFE600]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-black hover:opacity-70"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 neo-btn bg-[#FFE600] hover:bg-[#FACC15] disabled:opacity-50 text-black py-3 rounded-xl text-xs font-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin stroke-[3]" />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 stroke-[2.5]" />
                <span>SIGN IN TO DASHBOARD</span>
              </>
            )}
          </button>
        </form>

        {/* Security Footer Notice */}
        <div className="mt-8 pt-4 border-t-2 border-black text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00F59B]" />
            <span>Protected by Luminasiti Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
};
