import React from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Bell,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
  Send,
  Check,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

interface WalletNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletNotificationsModal: React.FC<WalletNotificationsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useWallet();
  const { userProfile } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#0057FF]/10 text-[#0057FF] flex items-center justify-center font-bold">
              <Bell size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-gray-900 leading-tight">Wallet Alerts & Activity</h2>
              <p className="text-[11px] text-gray-500">{notifications.length} total notifications</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold text-[#0057FF] hover:bg-blue-50 cursor-pointer"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 text-xs text-gray-700 divide-y divide-gray-100">
          {notifications.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Bell size={32} className="mx-auto text-gray-300 opacity-60" />
              <p className="font-bold text-gray-700 text-xs">No notifications yet</p>
              <p className="text-gray-400 text-[11px]">
                Alerts about transfers, money requests, and balance updates will appear here.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && markNotificationAsRead(n.id)}
                className={`pt-3 first:pt-0 pb-2 px-2.5 rounded-2xl transition-colors cursor-pointer ${
                  !n.read ? 'bg-blue-50/60 font-semibold' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        n.type === 'NEGATIVE_BALANCE'
                          ? 'bg-rose-100 text-rose-600'
                          : n.type === 'REQUEST_APPROVED' || n.type === 'TRANSFER_RECEIVED'
                          ? 'bg-emerald-100 text-emerald-600'
                          : n.type === 'REQUEST_RECEIVED'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-blue-100 text-[#0057FF]'
                      }`}
                    >
                      {n.type === 'NEGATIVE_BALANCE' && <AlertTriangle size={14} />}
                      {(n.type === 'REQUEST_APPROVED' || n.type === 'TRANSFER_RECEIVED') && <CheckCircle2 size={14} />}
                      {n.type === 'REQUEST_RECEIVED' && <Send size={14} />}
                      {n.type === 'WALLET_FROZEN' && <ShieldAlert size={14} />}
                      {!['NEGATIVE_BALANCE', 'REQUEST_APPROVED', 'TRANSFER_RECEIVED', 'REQUEST_RECEIVED', 'WALLET_FROZEN'].includes(n.type) && (
                        <Bell size={14} />
                      )}
                    </span>

                    <div>
                      <h4 className="font-bold text-gray-900 leading-snug">{n.title}</h4>
                      <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-gray-400 block mt-1">
                        {new Date(n.createdAt).toLocaleString('en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>
                  </div>

                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-[#0057FF] shrink-0 mt-1.5" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
