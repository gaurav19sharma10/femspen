import React, { useState } from 'react';
import { VectorIcon } from '../vector/VectorIcons';
import { useExpense } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';

interface FamilyManagementModalProps {
  onClose: () => void;
}

export const FamilyManagementModal: React.FC<FamilyManagementModalProps> = ({ onClose }) => {
  const { household, members, joinFamily, createFamily } = useExpense();
  const { user, userProfile } = useAuth();

  const [tab, setTab] = useState<'members' | 'join' | 'create'>('members');
  const [joinCode, setJoinCode] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const handleCopy = () => {
    if (!household?.inviteCode) return;
    navigator.clipboard.writeText(household.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setStatusMsg(null);
    try {
      await joinFamily(joinCode.trim());
      setStatusMsg({ text: 'Successfully joined family!' });
      setTimeout(onClose, 1000);
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to join family', error: true });
    }
  };

  const handleCreate = async () => {
    if (!newFamilyName.trim()) return;
    setStatusMsg(null);
    try {
      await createFamily(newFamilyName.trim());
      setStatusMsg({ text: 'New family created!' });
      setTimeout(onClose, 1000);
    } catch (err: any) {
      setStatusMsg({ text: err.message || 'Failed to create family', error: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-gray-200 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 text-base">Family Management</h3>
            <p className="text-xs text-gray-500">{household?.name || 'Shared Household'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
          >
            <VectorIcon name="close" size={18} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 bg-gray-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setTab('members')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'members' ? 'bg-white text-[#0057FF] shadow-xs' : 'text-gray-600'
            }`}
          >
            Members & Code
          </button>
          <button
            type="button"
            onClick={() => setTab('join')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'join' ? 'bg-white text-[#0057FF] shadow-xs' : 'text-gray-600'
            }`}
          >
            Join Family
          </button>
          <button
            type="button"
            onClick={() => setTab('create')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === 'create' ? 'bg-white text-[#0057FF] shadow-xs' : 'text-gray-600'
            }`}
          >
            Create New
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-medium ${
              statusMsg.error ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Tab 1: Current Family Members & Invite Code */}
        {tab === 'members' && (
          <div className="space-y-4">
            {/* 6-character Invite Code Card (Matches Android screenshot page 14) */}
            {household?.inviteCode && (
              <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-center space-y-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  INVITE CODE
                </span>
                <div className="text-2xl font-black font-mono tracking-wider text-[#0057FF]">
                  {household.inviteCode}
                </div>
                <p className="text-[11px] text-gray-500">
                  Read this out, or share it. Six characters, no confusable ones.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-4 py-1.5 bg-[#0057FF] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#0057FF]/25 cursor-pointer flex items-center gap-1.5"
                  >
                    <VectorIcon name="copy" size={13} />
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Members List */}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                MEMBERS ({members.length})
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {members.map((m) => {
                  const isYou = m.uid === user?.uid;
                  return (
                    <div
                      key={m.uid}
                      className="p-3 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0057FF] text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {m.displayName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            {m.displayName} {isYou && <span className="text-gray-400 font-normal">(you)</span>}
                          </p>
                          <p className="text-[10px] text-gray-400">{m.email}</p>
                        </div>
                      </div>

                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-200/80 text-gray-600">
                        {m.role}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Join Family with Code */}
        {tab === 'join' && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase">Enter 6-digit Invite Code</label>
              <input
                type="text"
                maxLength={7}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. A9EH9J"
                className="w-full mt-1.5 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono font-bold text-center text-xl text-[#0057FF] tracking-widest uppercase"
              />
            </div>
            <button
              type="button"
              disabled={!joinCode.trim()}
              onClick={handleJoin}
              className="w-full py-2.5 bg-[#0057FF] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-[#0057FF]/25 cursor-pointer"
            >
              Join Household
            </button>
          </div>
        )}

        {/* Tab 3: Create New Family */}
        {tab === 'create' && (
          <div className="space-y-4">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase">Family / Household Name</label>
              <input
                type="text"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                placeholder="e.g. Sharma Family"
                className="w-full mt-1.5 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm text-gray-900 font-medium"
              />
            </div>
            <button
              type="button"
              disabled={!newFamilyName.trim()}
              onClick={handleCreate}
              className="w-full py-2.5 bg-[#0057FF] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-[#0057FF]/25 cursor-pointer"
            >
              Create Household
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
