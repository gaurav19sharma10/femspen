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

// ==========================================
// GOALS & SAVINGS SYSTEM TYPES
// ==========================================

export type GoalType = 'individual' | 'group';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'closed' | 'cancelled';
export type GoalTransactionType =
  | 'MANUAL_CONTRIBUTION'
  | 'DAILY_CONTRIBUTION'
  | 'MONTHLY_CONTRIBUTION'
  | 'ROUND_UP'
  | 'WITHDRAWAL'
  | 'SPENDING_REQUEST'
  | 'SPENDING_APPROVED'
  | 'SPENDING_REJECTED'
  | 'REFUND'
  | 'ADJUSTMENT';

export interface GoalFundingMethod {
  manual: boolean;
  dailySaving?: {
    enabled: boolean;
    amount: number;
  };
  monthlySaving?: {
    enabled: boolean;
    amount: number;
    dayOfMonth: number;
  };
  roundUpSaving?: {
    enabled: boolean;
  };
}

export interface GoalParticipant {
  uid: string;
  name: string;
  photoUrl?: string;
  role?: 'owner' | 'contributor';
}

export interface SpendingRequest {
  id: string;
  goalId: string;
  requestedByUid: string;
  requestedByName: string;
  amount: number;
  reason: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvals: Record<string, 'APPROVED' | 'REJECTED' | 'PENDING'>;
  createdAt: number;
  updatedAt: number;
}

export interface GoalTransaction {
  id: string;
  goalId: string;
  userId: string;
  userName: string;
  amount: number;
  type: GoalTransactionType;
  expenseId?: string;
  source?: string;
  notes?: string;
  timestamp: number;
}

export interface Goal {
  id: string;
  title: string;
  icon: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string; // YYYY-MM-DD
  type: GoalType;
  ownerUid: string;
  ownerName: string;
  participantUids: string[];
  participants: GoalParticipant[];
  familyId?: string;
  fundingMethod: GoalFundingMethod;
  status: GoalStatus;
  spendingRequests?: SpendingRequest[];
  createdAt: number;
  updatedAt: number;
}

export interface RoundUpSettings {
  enabled: boolean;
  roundTo: number; // 10, 50, 100, 500, or custom
  destination: 'all' | 'specific';
  targetGoalId?: string;
  allocations?: Record<string, number>;
}

export const GOAL_CATEGORIES = [
  { id: 'Home', name: 'Home', icon: '🏠', color: '#6366F1' },
  { id: 'Vehicle', name: 'Vehicle', icon: '🚗', color: '#0EA5E9' },
  { id: 'Education', name: 'Education', icon: '🎓', color: '#10B981' },
  { id: 'Travel', name: 'Travel', icon: '✈️', color: '#F59E0B' },
  { id: 'Events', name: 'Events', icon: '🎉', color: '#EC4899' },
  { id: 'Electronics', name: 'Electronics', icon: '💻', color: '#3B82F6' },
  { id: 'Emergency', name: 'Emergency', icon: '💰', color: '#EF4444' },
  { id: 'Shopping', name: 'Shopping', icon: '🛍️', color: '#8B5CF6' },
  { id: 'Family', name: 'Family', icon: '❤️', color: '#F43F5E' },
  { id: 'Other', name: 'Other', icon: '📦', color: '#64748B' },
];

export const POPULAR_GOAL_EMOJIS = [
  '🎓', '🏖️', '📱', '🚗', '🏠', '🎂', '💰', '💍', '💻', '✈️', '🚴', '🎸', '🎁', '🏖️', '🏥', '🚀'
];

