import React, { useState } from 'react';
import { RvsLogo } from '../vector/RvsLogo';
import { VectorIcon } from '../vector/VectorIcons';
import { useAuth } from '../../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { loginWithEmail, signupWithEmail, sendResetEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await signupWithEmail(email, password);
        if (!res.success) {
          setError(res.error || 'Failed to register account.');
        }
      } else {
        const res = await loginWithEmail(email, password);
        if (!res.success) {
          setError(res.error || 'Invalid email or password.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Enter your email address first, then click forgot password.');
      return;
    }
    setError(null);
    const res = await sendResetEmail(email);
    if (res.success) {
      setInfoMessage('Password reset email sent! Check your inbox.');
    } else {
      setError(res.error || 'Could not send reset email.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col items-center justify-center p-4 selection:bg-[#0057FF]/20">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-xl border border-gray-200/90 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <RvsLogo size={58} />
          <h1 className="text-2xl font-black text-gray-900 tracking-tight font-sans">
            RVS <span className="text-[#0057FF]">Expences</span>
          </h1>
          <p className="text-xs text-gray-500 font-medium">
            Realtime Firestore Sync · Web & Android
          </p>
        </div>

        {/* Tab switch: Sign In vs Sign Up */}
        <div className="flex items-center p-1 bg-gray-100 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isSignUp ? 'bg-white text-[#0057FF] shadow-xs' : 'text-gray-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(true);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isSignUp ? 'bg-white text-[#0057FF] shadow-xs' : 'text-gray-600'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
            {error}
          </div>
        )}

        {infoMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium">
            {infoMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <div className="flex items-center bg-gray-50 border border-gray-200 focus-within:border-[#0057FF] focus-within:bg-white rounded-xl px-3 py-2.5 transition-all">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-transparent outline-none text-sm text-gray-900 font-sans"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Password
              </label>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-[#0057FF] font-semibold hover:underline cursor-pointer"
                >
                  Forgot?
                </button>
              )}
            </div>
            <div className="flex items-center bg-gray-50 border border-gray-200 focus-within:border-[#0057FF] focus-within:bg-white rounded-xl px-3 py-2.5 transition-all">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent outline-none text-sm text-gray-900 font-sans"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0057FF] hover:bg-[#0046D1] disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-[#0057FF]/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
            )}
          </button>
        </form>

        <p className="text-[11px] text-center text-gray-400">
          Connected directly to <strong>expence-rvs</strong> Firestore cloud.
        </p>
      </div>
    </div>
  );
};
