import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { FemSpenVaultArt } from '../common/VectorArt';
import { Delete, Fingerprint, LogOut, HelpCircle } from 'lucide-react';
import { ForgotPinModal } from './ForgotPinModal';

export const PinLockScreen: React.FC = () => {
  const { user, unlockWithPin, logout } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleKeyPress = async (digit: string) => {
    if (pin.length >= 4 || isVerifying) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      setIsVerifying(true);
      const success = await unlockWithPin(newPin);
      if (!success) {
        setError(true);
        setTimeout(() => {
          setPin('');
          setIsVerifying(false);
        }, 500);
      } else {
        setIsVerifying(false);
      }
    }
  };

  const handleDelete = () => {
    if (isVerifying) return;
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col justify-center items-center p-4 select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm bg-white rounded-3xl border border-gray-200/80 shadow-2xl p-8 flex flex-col items-center"
      >
        {/* Animated Vault Vector Artwork */}
        <motion.div
          animate={error ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="mb-2"
        >
          <FemSpenVaultArt size={110} />
        </motion.div>

        <h2 className="text-xl font-bold text-gray-900 mt-1">2FA Security Lock</h2>
        <p className="text-xs text-gray-500 mt-1 text-center truncate max-w-[240px]">
          {user?.email}
        </p>

        {/* 4-Digit Indicator Dots */}
        <motion.div
          animate={error ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-4 my-6"
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <motion.div
                key={index}
                animate={{
                  scale: isFilled ? [1, 1.25, 1] : 1,
                  backgroundColor: error ? '#EF4444' : isFilled ? '#0057FF' : '#E2E8F0',
                }}
                transition={{ duration: 0.15 }}
                className="w-4 h-4 rounded-full border border-gray-300/50"
              />
            );
          })}
        </motion.div>

        {error && (
          <p className="text-xs font-medium text-red-500 -mt-2 mb-4 animate-fade-in">
            Incorrect PIN. Try again.
          </p>
        )}

        {/* Custom Keypad Grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[260px] my-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <motion.button
              key={digit}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleKeyPress(digit)}
              className="h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200/60 text-xl font-semibold text-gray-800 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
            >
              {digit}
            </motion.button>
          ))}

          {/* Quick unlock / Biometrics button */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => handleKeyPress('1')}
            className="h-14 rounded-2xl bg-blue-50/60 hover:bg-blue-50 text-[#0057FF] flex items-center justify-center cursor-pointer transition-colors"
            title="Biometric Authentication"
          >
            <Fingerprint size={24} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => handleKeyPress('0')}
            className="h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200/60 text-xl font-semibold text-gray-800 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
          >
            0
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200/60 text-gray-600 flex items-center justify-center cursor-pointer transition-colors shadow-2xs"
          >
            <Delete size={20} />
          </motion.button>
        </div>

        {/* Footer Actions: Forgot PIN & Sign Out */}
        <div className="flex items-center justify-between w-full mt-6 pt-4 border-t border-gray-100 text-xs">
          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-[#0057FF] hover:underline font-medium flex items-center gap-1 cursor-pointer"
          >
            <HelpCircle size={14} />
            <span>Forgot PIN?</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="text-gray-500 hover:text-red-600 font-medium flex items-center gap-1 cursor-pointer transition-colors"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.div>

      {/* Forgot PIN Recovery Modal */}
      {showForgotModal && (
        <ForgotPinModal onClose={() => setShowForgotModal(false)} />
      )}
    </div>
  );
};
