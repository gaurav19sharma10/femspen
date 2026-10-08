import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FemSpenLogo, FemSpenVaultArt } from '../common/VectorArt';
import { Mail, Lock, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { loginWithEmail, signupWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = isSignUp
        ? await signupWithEmail(cleanEmail, password)
        : await loginWithEmail(cleanEmail, password);

      if (!res.success) {
        setError(res.error || 'Authentication failed. Please check credentials.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col justify-center items-center p-4 selection:bg-[#0057FF]/20">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200/80 shadow-2xl p-8 flex flex-col items-center">
        {/* Official Brand Mark */}
        <div className="mb-3">
          <FemSpenLogo size={64} />
        </div>

        <h1 className="text-2xl font-black text-gray-900 tracking-tight">FemSpen</h1>
        <p className="text-xs text-gray-500 mt-1 text-center max-w-xs font-medium">
          Real-time Personal & Family Expense Tracker with Google Keep simplicity
        </p>

        {/* Tab Toggle */}
        <div className="flex bg-gray-100/90 p-1 rounded-2xl w-full mt-6 mb-5 border border-gray-200/60">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isSignUp ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isSignUp ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="w-full bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2 mb-4">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0057FF] focus:bg-white focus:ring-2 focus:ring-[#0057FF]/20 transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0057FF] focus:bg-white focus:ring-2 focus:ring-[#0057FF]/20 transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          {isSignUp && (
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0057FF] focus:bg-white focus:ring-2 focus:ring-[#0057FF]/20 transition-all text-gray-900 placeholder:text-gray-400"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#0057FF] hover:bg-[#0046D1] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#0057FF]/25 cursor-pointer transition-all active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Connecting to Firebase...</span>
              </span>
            ) : (
              <>
                <span>{isSignUp ? 'Register & Setup 2FA PIN' : 'Sign In to FemSpen'}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-gray-400 font-medium">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Real-time Firebase Firestore Sync & SHA-256 PIN Security</span>
        </div>
      </div>
    </div>
  );
};
