import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FemSpenLogo } from '../common/VectorArt';
import { calculateAge, Gender } from '../../types';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  User,
  Calendar,
  Phone,
  Camera,
  Sparkles,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { loginWithEmail, signupWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender>('Male');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const calculatedAge = calculateAge(dob);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Profile picture must be under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please fill in email and password.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (isSignUp) {
      if (!displayName.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (!dob) {
        setError('Please select your date of birth.');
        return;
      }
      if (!phoneNumber.trim()) {
        setError('Please enter your mobile number.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setLoading(true);
    try {
      const res = isSignUp
        ? await signupWithEmail(cleanEmail, password, {
            displayName: displayName.trim(),
            dob,
            gender,
            phoneNumber: phoneNumber.trim(),
            photoUrl: photoUrl || undefined,
          })
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
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col justify-center items-center p-4 selection:bg-[#0057FF]/20 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200/80 shadow-2xl p-7 md:p-8 flex flex-col items-center">
        {/* Official Brand Mark */}
        <div className="mb-2">
          <FemSpenLogo size={58} />
        </div>

        <h1 className="text-2xl font-black text-gray-900 tracking-tight">FemSpen</h1>
        <p className="text-xs text-gray-500 mt-0.5 text-center max-w-xs font-medium">
          Personal & Family Expense Tracker with Google Keep simplicity
        </p>

        {/* Tab Toggle */}
        <div className="flex bg-gray-100/90 p-1 rounded-2xl w-full mt-5 mb-4 border border-gray-200/60">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(false);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              !isSignUp ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
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
              isSignUp ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="w-full bg-red-50 border border-red-200 text-red-600 px-3.5 py-2.5 rounded-xl text-xs flex items-start gap-2 mb-3.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-3.5">
          {/* Sign Up Extended Fields */}
          {isSignUp && (
            <>
              {/* Profile Picture Upload Preview */}
              <div className="flex flex-col items-center justify-center pt-1 pb-2">
                <label className="relative group cursor-pointer">
                  <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-dashed border-[#0057FF]/40 flex items-center justify-center overflow-hidden hover:border-[#0057FF] transition-all shadow-inner">
                    {photoUrl ? (
                      <img src={photoUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center text-gray-400 group-hover:text-[#0057FF] transition-colors">
                        <Camera size={22} />
                        <span className="text-[9px] font-semibold mt-1">Photo</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <div className="absolute bottom-0 right-0 bg-[#0057FF] text-white p-1 rounded-full shadow-sm">
                    <Camera size={11} />
                  </div>
                </label>
                <span className="text-[10px] text-gray-400 mt-1 font-medium">
                  {photoUrl ? 'Click avatar to change photo' : 'Upload profile picture (optional)'}
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Priya Sharma"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0057FF] focus:bg-white focus:ring-2 focus:ring-[#0057FF]/20 transition-all text-gray-900 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Date of Birth & Live Age Calculator */}
              <div>
                <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split('T')[0]}
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0057FF] focus:bg-white focus:ring-2 focus:ring-[#0057FF]/20 transition-all text-gray-900"
                  />
                </div>
                {calculatedAge !== null && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[#0057FF] font-semibold bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100">
                    <Sparkles size={13} className="text-[#0057FF] shrink-0" />
                    <span>Current Age: {calculatedAge} years old</span>
                  </div>
                )}
              </div>

              {/* Gender Selection & Mobile Number in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full px-3 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:border-[#0057FF] focus:bg-white"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
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
                      className="w-full pl-8 pr-3 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#0057FF] focus:bg-white text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Email Address */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
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

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
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

          {/* Confirm Password (Sign Up only) */}
          {isSignUp && (
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
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

        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-gray-400 font-medium">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Real-time Firebase Firestore Sync & SHA-256 PIN Security</span>
        </div>
      </div>
    </div>
  );
};
