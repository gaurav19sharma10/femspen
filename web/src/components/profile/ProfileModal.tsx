import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { calculateAge, Gender } from '../../types';
import { SUPPORTED_CURRENCIES } from '../../utils/currency';
import { FemSpenFamilyArt } from '../common/VectorArt';
import {
  X,
  User,
  Calendar,
  Phone,
  Camera,
  Crown,
  Users,
  Copy,
  Check,
  Share2,
  LogOut,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRightCircle,
  DoorOpen,
} from 'lucide-react';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const {
    user,
    userProfile,
    family,
    updateUserProfile,
    createFamily,
    joinFamily,
    leaveFamily,
    logout,
  } = useAuth();

  // Profile Form State
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [dob, setDob] = useState(userProfile?.dob || '');
  const [gender, setGender] = useState<Gender>(userProfile?.gender || 'Male');
  const [phoneNumber, setPhoneNumber] = useState(userProfile?.phoneNumber || '');
  const [photoUrl, setPhotoUrl] = useState<string>(userProfile?.photoUrl || '');
  const [currency, setCurrency] = useState(userProfile?.currency || 'INR');

  // Family Action State
  const [familyTab, setFamilyTab] = useState<'create' | 'join'>('create');
  const [familyNameInput, setFamilyNameInput] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [familyError, setFamilyError] = useState<string | null>(null);
  const [familyLoading, setFamilyLoading] = useState(false);

  // Feedback State
  const [copiedCode, setCopiedCode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  // Sync state if userProfile changes
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setDob(userProfile.dob || '');
      setGender(userProfile.gender || 'Male');
      setPhoneNumber(userProfile.phoneNumber || '');
      setPhotoUrl(userProfile.photoUrl || '');
      setCurrency(userProfile.currency || 'INR');
    }
  }, [userProfile]);

  const calculatedAge = calculateAge(dob);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Photo must be under 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        dob,
        gender,
        phoneNumber: phoneNumber.trim(),
        photoUrl: photoUrl || undefined,
        currency,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setProfileSaving(false);
    }
  };

  const handleCreateFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyNameInput.trim()) {
      setFamilyError('Please enter a family name.');
      return;
    }
    setFamilyError(null);
    setFamilyLoading(true);
    try {
      const res = await createFamily(familyNameInput.trim());
      if (!res.success) {
        setFamilyError(res.error || 'Failed to create family.');
      } else {
        setFamilyNameInput('');
      }
    } finally {
      setFamilyLoading(false);
    }
  };

  const handleJoinFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCodeInput.trim()) {
      setFamilyError('Please enter a valid invite code.');
      return;
    }
    setFamilyError(null);
    setFamilyLoading(true);
    try {
      const res = await joinFamily(inviteCodeInput.trim());
      if (!res.success) {
        setFamilyError(res.error || 'Failed to join family.');
      } else {
        setInviteCodeInput('');
      }
    } finally {
      setFamilyLoading(false);
    }
  };

  const handleCopyInviteCode = () => {
    if (!family?.inviteCode) return;
    navigator.clipboard.writeText(family.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleShareInviteCode = async () => {
    if (!family?.inviteCode) return;
    const shareText = `Join my family "${family.name}" on FemSpen! Use Invite Code: ${family.inviteCode} to sync our shared expenses.`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${family.name} on FemSpen`,
          text: shareText,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    navigator.clipboard.writeText(shareText);
    alert('Family invite copied! Send it to your family members over WhatsApp or SMS.');
  };

  const handleLeaveFamilyConfirm = async () => {
    if (window.confirm(`Are you sure you want to leave ${family?.name || 'this family'}?`)) {
      await leaveFamily();
    }
  };

  const isHead = userProfile?.familyRole === 'head' || family?.headUserId === user?.uid;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 30 }}
        className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl border-t sm:border border-gray-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[94vh] sm:max-h-[92vh]"
      >
        {/* Mobile Sheet Handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-[#0057FF]">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">User Profile & Family Hub</h2>
              <p className="text-[11px] sm:text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {saveSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          {/* SECTION 1: PERSONAL PROFILE FORM */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Personal Information
              </span>
              <button
                type="submit"
                disabled={profileSaving}
                className="px-3.5 py-1.5 bg-[#0057FF] hover:bg-[#0046D1] text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-xs disabled:opacity-50"
              >
                {profileSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>

            {/* Profile Avatar & Upload */}
            <div className="flex items-center gap-4 bg-[#F8F7F4] p-3.5 rounded-2xl border border-gray-200/70">
              <label className="relative group cursor-pointer shrink-0">
                <div className="w-16 h-16 rounded-full bg-blue-100 border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
                  {photoUrl ? (
                    <img src={photoUrl} alt="User Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-[#0057FF]">
                      {(displayName || user?.email || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <div className="absolute bottom-0 right-0 bg-[#0057FF] text-white p-1 rounded-full shadow-sm hover:scale-110 transition-transform">
                  <Camera size={11} />
                </div>
              </label>

              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 truncate">
                  {displayName || 'FemSpen Member'}
                </h4>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <label className="text-[10px] font-semibold text-[#0057FF] hover:underline cursor-pointer">
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="text-[10px] font-semibold text-gray-400 hover:text-red-500 cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Grid of Profile Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#0057FF] focus:bg-white"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#0057FF] focus:bg-white"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#0057FF] focus:bg-white"
                  />
                </div>
                {calculatedAge !== null && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#0057FF] font-semibold bg-blue-50/70 px-2 py-0.5 rounded-lg border border-blue-100">
                    <Sparkles size={11} className="text-[#0057FF]" />
                    <span>Current Age: {calculatedAge} years old</span>
                  </div>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#0057FF] focus:bg-white"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              {/* Display Currency */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                  Primary Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#0057FF] focus:bg-white"
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>

          {/* SECTION 2: FAMILY HUB MANAGEMENT */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Users size={14} className="text-[#0057FF]" />
                <span>Family Ledger Hub</span>
              </span>

              {family && (
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isHead ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                }`}>
                  {isHead ? <Crown size={11} className="text-amber-600" /> : <User size={11} />}
                  <span>{isHead ? 'Head of Family' : 'Family Member'}</span>
                </span>
              )}
            </div>

            {familyError && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{familyError}</span>
              </div>
            )}

            {/* CASE A: USER IS ALREADY IN A FAMILY */}
            {family ? (
              <div className="bg-[#F8F7F4] rounded-2xl border border-gray-200/80 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">{family.name}</h3>
                    <p className="text-[11px] text-gray-500">
                      Created by {family.headName} • {family.members?.length || 1} members
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleShareInviteCode}
                    className="p-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-[#0057FF] cursor-pointer shadow-xs transition-colors"
                    title="Share Family Invite"
                  >
                    <Share2 size={16} />
                  </button>
                </div>

                {/* Family Invite Code Box */}
                <div className="bg-white rounded-xl p-3 border border-blue-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                      Family Invite Code
                    </span>
                    <span className="text-lg font-mono font-black text-[#0057FF] tracking-wider">
                      {family.inviteCode}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyInviteCode}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#0057FF] text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                {/* Member Roster */}
                <div>
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-2">
                    Family Members
                  </span>
                  <div className="space-y-2">
                    {family.members?.map((member) => (
                      <div
                        key={member.uid}
                        className="bg-white p-2.5 rounded-xl border border-gray-200/70 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0057FF] font-bold text-xs flex items-center justify-center overflow-hidden shrink-0">
                            {member.photoUrl ? (
                              <img src={member.photoUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              (member.displayName || 'U')[0].toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-gray-900 block leading-tight">
                              {member.displayName} {member.uid === user?.uid && '(You)'}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {member.phoneNumber || 'Member'}
                            </span>
                          </div>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          member.role === 'head' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {member.role === 'head' ? '👑 Head' : 'Member'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leave Family Action */}
                <div className="pt-2 border-t border-gray-200/60 flex justify-end">
                  <button
                    type="button"
                    onClick={handleLeaveFamilyConfirm}
                    className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <DoorOpen size={14} />
                    <span>Leave Family</span>
                  </button>
                </div>
              </div>
            ) : (
              /* CASE B: USER IS NOT IN A FAMILY YET */
              <div className="bg-[#F8F7F4] rounded-2xl border border-gray-200/80 p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <FemSpenFamilyArt size={80} className="shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Connect Your Household</h4>
                    <p className="text-xs text-gray-500">
                      Create a family to become the <strong>Head of the Family</strong>, or join using an invite code.
                    </p>
                  </div>
                </div>

                {/* Sub Tab Toggle */}
                <div className="flex bg-white p-1 rounded-xl border border-gray-200/80">
                  <button
                    type="button"
                    onClick={() => {
                      setFamilyTab('create');
                      setFamilyError(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      familyTab === 'create' ? 'bg-[#0057FF] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Create a Family
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFamilyTab('join');
                      setFamilyError(null);
                    }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      familyTab === 'join' ? 'bg-[#0057FF] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Join with Code
                  </button>
                </div>

                {/* Create Family Form */}
                {familyTab === 'create' ? (
                  <form onSubmit={handleCreateFamily} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Family Name
                      </label>
                      <input
                        type="text"
                        required
                        value={familyNameInput}
                        onChange={(e) => setFamilyNameInput(e.target.value)}
                        placeholder="e.g. The Sharma Family, Our Home"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#0057FF]"
                      />
                    </div>
                    <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200/60 flex items-center gap-1.5">
                      <Crown size={14} className="shrink-0 text-amber-600" />
                      <span>You will be designated as the <strong>Head of the Family</strong> and will receive a 6-digit invite code to share.</span>
                    </p>
                    <button
                      type="submit"
                      disabled={familyLoading}
                      className="w-full py-2 bg-[#0057FF] hover:bg-[#0046D1] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-[#0057FF]/20 cursor-pointer disabled:opacity-50"
                    >
                      <PlusCircle size={15} />
                      <span>{familyLoading ? 'Creating Family...' : 'Create Family & Generate Code'}</span>
                    </button>
                  </form>
                ) : (
                  /* Join Family Form */
                  <form onSubmit={handleJoinFamily} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        6-Digit Family Invite Code
                      </label>
                      <input
                        type="text"
                        required
                        value={inviteCodeInput}
                        onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. FS4982"
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-mono font-bold uppercase tracking-wider text-gray-900 focus:outline-none focus:border-[#0057FF]"
                      />
                    </div>
                    <p className="text-[11px] text-gray-500">
                      Ask your family head for their 6-digit invite code from their profile screen.
                    </p>
                    <button
                      type="submit"
                      disabled={familyLoading}
                      className="w-full py-2 bg-[#0057FF] hover:bg-[#0046D1] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-[#0057FF]/20 cursor-pointer disabled:opacity-50"
                    >
                      <ArrowRightCircle size={15} />
                      <span>{familyLoading ? 'Verifying Code...' : 'Join Family'}</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={logout}
            className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold rounded-xl cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
