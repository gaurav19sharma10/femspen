import { Expense } from '../types';

const today = new Date().toISOString().split('T')[0];

const yesterdayDate = new Date();
yesterdayDate.setDate(yesterdayDate.getDate() - 1);
const yesterday = yesterdayDate.toISOString().split('T')[0];

const earlierDate = new Date();
earlierDate.setDate(earlierDate.getDate() - 4);
const earlier = earlierDate.toISOString().split('T')[0];

const monthDate = new Date();
monthDate.setDate(monthDate.getDate() - 12);
const thisMonth = monthDate.toISOString().split('T')[0];

export const INITIAL_DEMO_EXPENSES: Expense[] = [
  // --- INDIVIDUAL MODE ---
  {
    id: 'exp-1',
    title: 'Blue Tokai Artisan Coffee & Croissant',
    amount: 8.50,
    currency: 'USD',
    category: 'Food',
    mode: 'individual',
    color: '#FFE0B2', // Peach
    isPinned: true,
    date: today,
    notes: 'Morning espresso before deep work session with team.',
    createdAt: Date.now() - 3600000 * 2,
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'exp-2',
    title: 'Uber to Design Studio',
    amount: 19.20,
    currency: 'USD',
    category: 'Transport',
    mode: 'individual',
    color: '#BBDEFB', // Sky
    isPinned: false,
    date: today,
    notes: 'Heavy rain surge pricing.',
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'exp-3',
    title: 'Kindle Book: Designing Data-Intensive Apps',
    amount: 24.99,
    currency: 'USD',
    category: 'Education',
    mode: 'individual',
    color: '#FFF9C4', // Lemon
    isPinned: false,
    date: yesterday,
    notes: 'Recommended by staff engineer for database architectures.',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'exp-4',
    title: 'Spotify Premium Family Plan',
    amount: 16.99,
    currency: 'USD',
    category: 'Entertainment',
    mode: 'individual',
    color: '#E1BEE7', // Lavender
    isPinned: true,
    date: earlier,
    notes: 'Monthly recurring music subscription auto-debited.',
    isRecurring: true,
    recurringInterval: 'monthly',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'exp-5',
    title: 'Ergonomic Mechanical Keyboard Keycaps',
    amount: 45.00,
    currency: 'USD',
    category: 'Shopping',
    mode: 'individual',
    color: '#FFCDD2', // Coral
    isPinned: false,
    date: thisMonth,
    notes: 'PBT custom retro keycaps for desk setup upgrade.',
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000 * 12,
  },

  // --- FAMILY MODE ---
  {
    id: 'exp-fam-1',
    title: 'Weekly Supermarket & Organic Produce',
    amount: 142.80,
    currency: 'USD',
    category: 'Food',
    mode: 'family',
    color: '#C8E6C9', // Mint
    isPinned: true,
    date: today,
    familyMember: 'Shared Household',
    notes: 'Fresh vegetables, sourdough bread, pantry staples, and olive oil.',
    createdAt: Date.now() - 3600000 * 1,
    updatedAt: Date.now() - 3600000 * 1,
  },
  {
    id: 'exp-fam-2',
    title: 'High-speed Fiber Internet (Airtel / Comcast)',
    amount: 69.99,
    currency: 'USD',
    category: 'Bills',
    mode: 'family',
    color: '#DCEDC8', // Sage
    isPinned: true,
    date: yesterday,
    familyMember: 'Dad',
    isRecurring: true,
    recurringInterval: 'monthly',
    notes: '1 Gbps symmetrical connection for home office & streaming.',
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'exp-fam-3',
    title: 'Kids Soccer Academy Term Fees',
    amount: 120.00,
    currency: 'USD',
    category: 'Education',
    mode: 'family',
    color: '#FFE0B2', // Peach
    isPinned: false,
    date: earlier,
    familyMember: 'Kids',
    notes: 'Winter tournament kit and 12-week training package.',
    createdAt: Date.now() - 86400000 * 4,
    updatedAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'exp-fam-4',
    title: 'Pharmacy Vitamins & Pediatric Syrups',
    amount: 38.50,
    currency: 'USD',
    category: 'Health',
    mode: 'family',
    color: '#BBDEFB', // Sky
    isPinned: false,
    date: thisMonth,
    familyMember: 'Mom',
    notes: 'Vitamin D supplements and emergency medicine refills.',
    createdAt: Date.now() - 86400000 * 12,
    updatedAt: Date.now() - 86400000 * 12,
  }
];
