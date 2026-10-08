import React, { useState } from 'react';
import { VectorIcon } from '../vector/VectorIcons';
import { KeepColorPicker } from '../common/KeepColorPicker';
import { useExpense, type UnifiedExpense } from '../../context/ExpenseContext';
import type { SplitMode } from '../../domain/types';

interface ExpenseEditModalProps {
  expense: UnifiedExpense | null;
  onClose: () => void;
}

export const ExpenseEditModal: React.FC<ExpenseEditModalProps> = ({ expense, onClose }) => {
  const { categories, editExpense } = useExpense();

  if (!expense) return null;

  const [title, setTitle] = useState(expense.title);
  const [amountStr, setAmountStr] = useState((expense.amountMinor / 100).toString());
  const [merchant, setMerchant] = useState(expense.merchant || '');
  const [notes, setNotes] = useState(expense.notes || '');
  const [categoryId, setCategoryId] = useState<string | null>(expense.categoryId);
  const [color, setColor] = useState(expense.color || '#FFFFFF');
  const [isPinned, setIsPinned] = useState(expense.isPinned);
  const [splitMode, setSplitMode] = useState<SplitMode>(expense.splitMode || 'equal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    const amountNum = parseFloat(amountStr);
    if (!amountStr.trim() || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount.');
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);
    const finalTitle =
      title.trim() ||
      merchant.trim() ||
      notes.trim() ||
      selectedCategory?.name ||
      'Expense';

    setIsSubmitting(true);
    try {
      await editExpense(expense.id, {
        title: finalTitle,
        amount: amountNum,
        currency: expense.currency,
        categoryId,
        date: expense.date,
        merchant: merchant.trim() || undefined,
        notes: notes.trim() || undefined,
        color,
        isPinned,
        splitMode,
      });
      onClose();
    } catch (err: any) {
      console.error('Failed to update expense:', err);
      setError(err?.message || 'Failed to update expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        style={{ backgroundColor: color }}
        className="rounded-3xl p-6 w-full max-w-lg shadow-2xl border border-gray-200/80 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What was it"
            className="w-full text-lg font-bold bg-transparent outline-none text-gray-900 placeholder-gray-400 font-sans"
          />
          <button
            type="button"
            onClick={() => setIsPinned(!isPinned)}
            className={`p-2 rounded-full cursor-pointer ${
              isPinned ? 'text-[#0057FF] bg-blue-50' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <VectorIcon name="pin" size={20} strokeWidth={isPinned ? 2.5 : 1.8} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center bg-black/5 rounded-xl px-3 py-2 border border-black/5">
            <span className="font-bold text-gray-700 mr-2 text-base font-mono">₹</span>
            <input
              type="number"
              step="any"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="Amount"
              className="w-full bg-transparent outline-none font-semibold text-gray-900 text-sm font-sans"
            />
          </div>

          <div className="flex items-center bg-black/5 rounded-xl px-3 py-2 border border-black/5">
            <VectorIcon name="home" size={16} className="text-gray-400 mr-2" />
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Merchant"
              className="w-full bg-transparent outline-none text-gray-900 text-sm font-sans"
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Category</p>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {categories.map((cat) => {
              const isSelected = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(isSelected ? null : cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#0057FF] text-white shadow-sm'
                      : 'bg-black/5 hover:bg-black/10 text-gray-700'
                  }`}
                >
                  <VectorIcon name={cat.icon || cat.name} size={14} color={isSelected ? '#FFFFFF' : cat.color || 'currentColor'} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Add notes..."
            className="w-full bg-black/5 rounded-xl p-3 text-sm outline-none text-gray-800 placeholder-gray-400 resize-none font-sans"
          />
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <VectorIcon name="alert" size={15} color="#DC2626" />
            <span>{error}</span>
          </div>
        )}

        {/* Color Palette & Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-black/5 relative">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-2 rounded-full hover:bg-black/10 text-gray-600 cursor-pointer"
              title="Change note color"
            >
              <VectorIcon name="palette" size={18} />
            </button>
            {showColorPicker && (
              <div className="absolute bottom-12 left-0 z-50">
                <KeepColorPicker
                  selectedColor={color}
                  onSelectColor={(hex) => {
                    setColor(hex);
                    setShowColorPicker(false);
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-black/5 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSave}
              className="px-5 py-2 bg-[#0057FF] hover:bg-[#0046D1] text-white text-xs font-bold rounded-xl shadow-md shadow-[#0057FF]/25 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Update Expense'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
