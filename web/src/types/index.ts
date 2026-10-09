export type ExpenseMode = 'individual' | 'family';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  mode: ExpenseMode;
  color: string;
  isPinned: boolean;
  date: string; // ISO format: YYYY-MM-DD
  notes?: string;
  familyMember?: string; // e.g. "Mom", "Dad", "Partner", "Kids", "Shared"
  isRecurring?: boolean;
  recurringInterval?: 'weekly' | 'monthly' | 'yearly';
  receiptUrl?: string;
  createdAt: number;
  updatedAt: number;
}

export type Gender = 'Male' | 'Female' | 'Other' | 'Prefer not to say';
export type FamilyRole = 'head' | 'member';

export interface FamilyMember {
  uid: string;
  displayName: string;
  role: FamilyRole;
  photoUrl?: string;
  phoneNumber?: string;
  gender?: Gender;
  joinedAt: number;
}

export interface FamilyGroup {
  id: string;
  name: string;
  inviteCode: string;
  headUserId: string;
  headName: string;
  members: FamilyMember[];
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  dob?: string; // YYYY-MM-DD
  gender?: Gender;
  phoneNumber?: string;
  photoUrl?: string;
  familyId?: string;
  familyRole?: FamilyRole;
  familyName?: string;
  pinHash: string;
  pinSalt: string;
  securityQuestion: string;
  securityAnswerHash: string;
  currency: string;
  monthlyBudget: {
    individual: number;
    family: number;
  };
  createdAt: number;
}

export function calculateAge(dobStr?: string): number | null {
  if (!dobStr) return null;
  const birthDate = new Date(dobStr);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

export interface DateGroup {
  id: string;
  title: string;
  dateStr: string;
  totalAmount: number;
  expenses: Expense[];
}

export interface KeepColor {
  id: string;
  name: string;
  hex: string;
}

export const KEEP_COLORS: KeepColor[] = [
  { id: 'default', name: 'Default Chalk', hex: '#F8F7F4' },
  { id: 'peach', name: 'Soft Peach', hex: '#FFE0B2' },
  { id: 'mint', name: 'Fresh Mint', hex: '#C8E6C9' },
  { id: 'sky', name: 'Sky Blue', hex: '#BBDEFB' },
  { id: 'lemon', name: 'Pale Lemon', hex: '#FFF9C4' },
  { id: 'lavender', name: 'Lavender', hex: '#E1BEE7' },
  { id: 'coral', name: 'Soft Coral', hex: '#FFCDD2' },
  { id: 'sage', name: 'Muted Sage', hex: '#DCEDC8' },
];

export const CATEGORIES = [
  { id: 'Food', name: 'Food & Dining', icon: 'Utensils', color: '#F97316' },
  { id: 'Transport', name: 'Transport & Fuel', icon: 'Car', color: '#0EA5E9' },
  { id: 'Bills', name: 'Bills & Utilities', icon: 'Zap', color: '#EAB308' },
  { id: 'Shopping', name: 'Shopping & Clothes', icon: 'ShoppingBag', color: '#EC4899' },
  { id: 'Health', name: 'Health & Medical', icon: 'HeartPulse', color: '#EF4444' },
  { id: 'Entertainment', name: 'Entertainment', icon: 'Film', color: '#8B5CF6' },
  { id: 'Education', name: 'Education & Learning', icon: 'GraduationCap', color: '#10B981' },
  { id: 'Home', name: 'Home & Household', icon: 'Home', color: '#6366F1' },
  { id: 'Other', name: 'General / Other', icon: 'CircleEllipsis', color: '#64748B' },
];

export const FAMILY_MEMBERS = [
  'Shared Household',
  'Dad',
  'Mom',
  'Partner',
  'Kids',
  'Other'
];

export const SECURITY_QUESTIONS = [
  'What was the name of your first elementary school?',
  'What was your childhood nickname?',
  'In what city or town did your parents meet?',
  'What is the name of your favorite childhood pet?',
  'What was the model of your first car?',
  'What is the street name where you grew up?'
];
