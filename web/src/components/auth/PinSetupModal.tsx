import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SECURITY_QUESTIONS } from '../../types';
import { KeepVaultArt } from '../common/VectorArt';
import { ShieldCheck, Lock, HelpCircle, AlertCircle } from 'lucide-react';

export const PinSetupModal: React.FC = () => {
  const { setupPinAndSecurity } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [question, setQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    if (!answer.trim()) {
      setError('Please provide an answer to the security question');
      return;
    }

    setLoading(true);
    try {
      const ok = await setupPinAndSecurity(pin, question, answer.trim());
      if (!ok) {
        setError('Failed to configure security PIN. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Error configuring security settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-200 max-w-md w-full p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center mb-6">
          <KeepVaultArt size={90} className="mb-2" />
          <h2 className="text-xl font-bold text-gray-900">Set Up 2FA Security PIN</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-xs">
            Create a 4-digit PIN and security question to secure your financial records across Web and Android.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 mb-4">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                4-Digit PIN
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono tracking-widest text-center focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Confirm PIN
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono tracking-widest text-center focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF]"
                />
              </div>
            </div>
          </div>

          <div className="pt-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <HelpCircle size={13} className="text-[#0057FF]" />
              <span>Security Recovery Question</span>
            </label>
            <select
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:border-[#0057FF] focus:outline-none"
            >
              {SECURITY_QUESTIONS.map((q, idx) => (
                <option key={idx} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Secret Answer (case-insensitive)
            </label>
            <input
              type="text"
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter your memorable answer"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:border-[#0057FF] focus:outline-none focus:ring-1 focus:ring-[#0057FF]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 py-2.5 bg-[#0057FF] hover:bg-[#0046D1] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#0057FF]/20 cursor-pointer transition-all disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            <span>{loading ? 'Activating Security...' : 'Save & Unlock Vault'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
