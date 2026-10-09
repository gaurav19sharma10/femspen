import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Lock, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';

interface ForgotPinModalProps {
  onClose: () => void;
}

export const ForgotPinModal: React.FC<ForgotPinModalProps> = ({ onClose }) => {
  const { userProfile, resetPinWithSecurityAnswer } = useAuth();
  const [answer, setAnswer] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!answer.trim()) {
      setError('Please provide your secret security answer');
      return;
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('New PIN must be exactly 4 digits');
      return;
    }

    if (newPin !== confirmNewPin) {
      setError('New PINs do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPinWithSecurityAnswer(answer.trim(), newPin);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.error || 'Verification failed. Incorrect answer.');
      }
    } catch (err: any) {
      setError(err.message || 'Error resetting PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl border border-gray-200 max-w-sm w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center -mt-2 pb-3">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-3 text-[#0057FF]">
          <KeyRound size={22} />
          <h3 className="text-lg font-bold text-gray-900">Reset 2FA PIN</h3>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Answer your security recovery question to reset your PIN.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs flex items-center gap-2 mb-3">
            <AlertCircle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2 mb-3">
            <CheckCircle size={15} className="shrink-0" />
            <span>PIN reset successfully! Unlocking...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-[#0057FF] tracking-wider block mb-1">
              Your Security Question
            </span>
            <p className="text-xs font-medium text-gray-800">
              {userProfile?.securityQuestion || 'What was the name of your first elementary school?'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Secret Answer
            </label>
            <input
              type="text"
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:border-[#0057FF] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                New 4-Digit PIN
              </label>
              <div className="relative">
                <Lock size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full pl-7 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono tracking-widest text-center focus:border-[#0057FF] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Confirm PIN
              </label>
              <div className="relative">
                <Lock size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  maxLength={4}
                  required
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full pl-7 pr-2 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono tracking-widest text-center focus:border-[#0057FF] focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full mt-2 py-2.5 bg-[#0057FF] hover:bg-[#0046D1] text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-[#0057FF]/20 cursor-pointer transition-all disabled:opacity-50"
          >
            <span>{loading ? 'Verifying Answer...' : 'Confirm & Reset PIN'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
