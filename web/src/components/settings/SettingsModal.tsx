import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useExpense } from '../../context/ExpenseContext';
import { SUPPORTED_CURRENCIES } from '../../utils/currency';
import { exportExpensesToCSV, exportExpensesToJSON } from '../../utils/export';
import {
  X,
  Settings,
  DollarSign,
  Wallet,
  Flame,
  Download,
  LogOut,
  CheckCircle2,
} from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const { user, userProfile, updateCurrency, updateMonthlyBudget, logout } = useAuth();
  const { expenses } = useExpense();

  const [selectedCurrency, setSelectedCurrency] = useState(userProfile?.currency || 'USD');
  const [indBudget, setIndBudget] = useState(userProfile?.monthlyBudget?.individual?.toString() || '1500');
  const [famBudget, setFamBudget] = useState(userProfile?.monthlyBudget?.family?.toString() || '4500');
  const [firebaseConfigJson, setFirebaseConfigJson] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCurrency !== userProfile?.currency) {
      await updateCurrency(selectedCurrency);
    }
    const parsedInd = parseFloat(indBudget) || 1500;
    const parsedFam = parseFloat(famBudget) || 4500;
    await updateMonthlyBudget('individual', parsedInd);
    await updateMonthlyBudget('family', parsedFam);

    if (firebaseConfigJson.trim()) {
      try {
        const parsed = JSON.parse(firebaseConfigJson);
        localStorage.setItem('EXPENSE_TRACKER_FIREBASE_CONFIG', JSON.stringify(parsed));
      } catch (err) {
        alert('Invalid Firebase JSON format');
        return;
      }
    }

    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white rounded-3xl border border-gray-200/90 shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-[#0057FF]">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Settings & Preferences</h2>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {saveSuccess && (
          <div className="my-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>Preferences saved successfully!</span>
          </div>
        )}

        {/* Settings Body */}
        <form onSubmit={handleSavePreferences} className="py-4 overflow-y-auto space-y-5 flex-1">
          <div className="bg-[#F8F7F4] p-4 rounded-2xl border border-gray-200/70">
            <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
              <DollarSign size={14} className="text-[#0057FF]" />
              <span>Display Currency</span>
            </label>
            <p className="text-[11px] text-gray-500 mb-2.5">
              Select your primary symbol and currency standard.
            </p>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#0057FF]"
            >
              {SUPPORTED_CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label} ({c.symbol})
                </option>
              ))}
            </select>
          </div>

          <div className="bg-[#F8F7F4] p-4 rounded-2xl border border-gray-200/70">
            <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
              <Wallet size={14} className="text-[#0057FF]" />
              <span>Monthly Budget Limits</span>
            </label>
            <p className="text-[11px] text-gray-500 mb-3">
              Set spending limits for individual and family ledgers to trigger smart alerts.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Individual Limit
                </span>
                <input
                  type="number"
                  value={indBudget}
                  onChange={(e) => setIndBudget(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#0057FF]"
                />
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Family Limit
                </span>
                <input
                  type="number"
                  value={famBudget}
                  onChange={(e) => setFamBudget(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-[#0057FF]"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#F8F7F4] p-4 rounded-2xl border border-gray-200/70">
            <span className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
              <Download size={14} className="text-[#0057FF]" />
              <span>Export Ledger History</span>
            </span>
            <p className="text-[11px] text-gray-500 mb-3">
              Download your complete financial records for tax or backup purposes.
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => exportExpensesToCSV(expenses, `keep_expenses_${new Date().toISOString().slice(0, 10)}.csv`)}
                className="flex-1 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 cursor-pointer transition-colors shadow-2xs"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => exportExpensesToJSON(expenses, `keep_expenses_${new Date().toISOString().slice(0, 10)}.json`)}
                className="flex-1 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl text-xs font-semibold text-gray-800 cursor-pointer transition-colors shadow-2xs"
              >
                Export JSON
              </button>
            </div>
          </div>

          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100">
            <span className="block text-xs font-bold text-[#0057FF] mb-1 flex items-center gap-1.5">
              <Flame size={14} />
              <span>Firebase Cloud Sync Status</span>
            </span>
            <p className="text-[11px] text-gray-600 mb-2.5">
              Connected to project: <span className="font-mono font-bold text-gray-800">femspen-bee68</span>.
              If you experience permission notices, copy the recommended security rules below and publish them in your Firebase Console:
            </p>
            <button
              type="button"
              onClick={() => {
                const rules = `rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /{document=**} {\n      allow read, write: if request.auth != null;\n    }\n  }\n}`;
                navigator.clipboard.writeText(rules);
                alert('Copied Firestore Security Rules to clipboard! Paste and Publish them in Firebase Console > Firestore Database > Rules tab.');
              }}
              className="px-3.5 py-1.5 bg-[#0057FF] hover:bg-[#0046D1] text-white text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs"
            >
              Copy Recommended Firestore Rules
            </button>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#0057FF] hover:bg-[#0046D1] text-white text-xs font-semibold rounded-xl cursor-pointer shadow-md shadow-[#0057FF]/20 transition-all"
          >
            Save Preferences
          </button>
        </form>

        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={logout}
            className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out Account</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-xl cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};
