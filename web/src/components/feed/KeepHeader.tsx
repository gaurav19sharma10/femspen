import React, { useState } from 'react';
import { RvsLogo } from '../vector/RvsLogo';
import { VectorIcon } from '../vector/VectorIcons';
import { useAuth } from '../../context/AuthContext';
import { useExpense } from '../../context/ExpenseContext';
import { motion, AnimatePresence } from 'framer-motion';

interface KeepHeaderProps {
  onOpenFamilyModal?: () => void;
}

export const KeepHeader: React.FC<KeepHeaderProps> = ({ onOpenFamilyModal }) => {
  const { user, userProfile, logout } = useAuth();
  const {
    mode,
    setMode,
    searchQuery,
    setSearchQuery,
    isSyncing,
    household,
  } = useExpense();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = () => {
    if (!household?.inviteCode) return;
    navigator.clipboard.writeText(household.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const userInitials = (userProfile?.displayName || user?.email || 'GS')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-[#F8F7F4]/90 backdrop-blur-md border-b border-gray-200/80 px-4 md:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <RvsLogo size={42} showText={true} />
          
          {mode === 'family' && household && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-200/80 rounded-full text-xs font-semibold text-[#0057FF]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0057FF]" />
              {household.name}
            </div>
          )}
        </div>

        {/* Center: Google Keep Search Bar */}
        <div className="flex-1 max-w-xl mx-2 md:mx-4">
          <div className="relative flex items-center bg-white hover:bg-gray-50 focus-within:bg-white rounded-2xl border border-gray-200/90 shadow-sm focus-within:shadow-md focus-within:border-[#0057FF]/60 transition-all">
            <div className="pl-4 pr-2 text-gray-400">
              <VectorIcon name="search" size={19} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search expenses, merchants, notes, categories..."
              className="w-full py-2.5 pr-10 text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400 font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
              >
                <VectorIcon name="close" size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Dual Mode Switcher Pill */}
          <div className="flex items-center p-1 bg-gray-200/70 rounded-xl select-none">
            <button
              type="button"
              onClick={() => setMode('family')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'family'
                  ? 'bg-white text-[#0057FF] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <VectorIcon name="users" size={14} />
              <span>Family</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('individual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                mode === 'individual'
                  ? 'bg-white text-[#0057FF] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <VectorIcon name="wallet" size={14} />
              <span>Personal</span>
            </button>
          </div>

          {/* Realtime Live Sync Indicator */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200/80 rounded-full text-xs font-medium text-gray-600 shadow-sm"
            title="Connected realtime to Firebase Firestore"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span className="text-[11px] font-semibold text-gray-700">
              {isSyncing ? 'Syncing...' : 'Live Sync'}
            </span>
          </div>

          {/* Family Invite Code button */}
          {mode === 'family' && household?.inviteCode && (
            <button
              type="button"
              onClick={handleCopyCode}
              title="Click to copy 6-digit family invite code"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200/90 text-gray-700 rounded-xl text-xs font-medium shadow-sm transition-colors cursor-pointer"
            >
              <VectorIcon name="copy" size={13} color="#0057FF" />
              <span>Code: <strong>{household.inviteCode}</strong></span>
              {copiedCode && <span className="text-emerald-600 text-[10px] font-bold">Copied!</span>}
            </button>
          )}

          {/* User Avatar with Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-9 h-9 rounded-full bg-[#0057FF] text-white font-bold text-xs flex items-center justify-center shadow-md shadow-[#0057FF]/20 hover:ring-2 hover:ring-[#0057FF]/40 transition-all cursor-pointer"
            >
              {userInitials}
            </button>

            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200/80 p-3 z-50 text-gray-800"
                >
                  <div className="pb-3 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0057FF] text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                      {userInitials}
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-semibold text-sm truncate text-gray-900">
                        {userProfile?.displayName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                  </div>

                  <div className="py-2 space-y-1">
                    {onOpenFamilyModal && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          onOpenFamilyModal();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100/80 rounded-xl transition-colors cursor-pointer"
                      >
                        <VectorIcon name="users" size={15} color="#0057FF" />
                        <span>Manage Family & Invites</span>
                      </button>
                    )}

                    {household?.inviteCode && (
                      <button
                        type="button"
                        onClick={() => {
                          handleCopyCode();
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100/80 rounded-xl transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2.5">
                          <VectorIcon name="copy" size={15} color="#64748B" />
                          <span>Invite Code</span>
                        </span>
                        <span className="font-mono bg-blue-50 text-[#0057FF] px-2 py-0.5 rounded text-[11px] font-bold">
                          {household.inviteCode}
                        </span>
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    >
                      <VectorIcon name="logout" size={15} color="#EF4444" />
                      <span>Sign out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
};
