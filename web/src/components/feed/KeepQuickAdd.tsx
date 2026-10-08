import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VectorIcon } from '../vector/VectorIcons';
import { KeepColorPicker } from '../common/KeepColorPicker';
import { useExpense } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import type { SplitMode } from '../../domain/types';

export const KeepQuickAdd: React.FC = () => {
  const { user } = useAuth();
  const {
    mode,
    categories,
    members,
    addExpense,
    household,
  } = useExpense();

  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [merchant, setMerchant] = useState('');
  const [notes, setNotes] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [color, setColor] = useState('#FFFFFF');
  const [isPinned, setIsPinned] = useState(false);
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Close on outside click if all fields are empty
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !title.trim() &&
        !amountStr.trim() &&
        !merchant.trim() &&
        !notes.trim()
      ) {
        setIsExpanded(false);
        setShowColorPicker(false);
        setValidationError(null);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [title, amountStr, merchant, notes]);

  const handleSave = async () => {
    setValidationError(null);

    const parsedAmount = parseFloat(amountStr);
    if (!amountStr.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      setValidationError('Please enter a valid expense amount.');
      amountInputRef.current?.focus();
      return;
    }

    const selectedCategory = categories.find((c) => c.id === categoryId);
    // Intelligent title derivation: if user leaves title empty, derive from merchant, notes, category, or generic
    const resolvedTitle =
      title.trim() ||
      merchant.trim() ||
      notes.trim() ||
      selectedCategory?.name ||
      'Expense';

    setIsSubmitting(true);
    try {
      await addExpense({
        title: resolvedTitle,
        amount: parsedAmount,
        currency: household?.baseCurrency || 'INR',
        categoryId,
        date: new Date(),
        merchant: merchant.trim() || undefined,
        notes: notes.trim() || undefined,
        color,
        isPinned,
        splitMode,
      });

      // Quick success flash
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        setTitle('');
        setAmountStr('');
        setMerchant('');
        setNotes('');
        setCategoryId(null);
        setColor('#FFFFFF');
        setIsPinned(false);
        setIsExpanded(false);
        setShowColorPicker(false);
        setValidationError(null);
      }, 500);
    } catch (err: any) {
      console.error('Failed to add expense:', err);
      setValidationError(err?.message || 'Failed to save expense. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto my-5 px-3">
      <motion.div
        layout
        style={{ backgroundColor: color }}
        className="rounded-2xl border border-gray-200/90 shadow-md hover:shadow-lg transition-shadow overflow-hidden"
      >
        {!isExpanded ? (
          /* Collapsed State (Google Keep "Take a note..." bar) */
          <div
            onClick={() => setIsExpanded(true)}
            className="flex items-center justify-between px-5 py-3.5 cursor-text text-gray-500 hover:text-gray-700"
          >
            <span className="text-sm font-medium">Take an expense note...</span>
            <div className="flex items-center gap-3 text-gray-400">
              <span className="text-sm font-bold font-mono text-[#0057FF]">₹</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                  setShowColorPicker(true);
                }}
                className="hover:text-gray-700 cursor-pointer"
                title="Choose color"
              >
                <VectorIcon name="palette" size={18} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPinned(true);
                  setIsExpanded(true);
                }}
                className="hover:text-gray-700 cursor-pointer"
                title="Pin note"
              >
                <VectorIcon name="pin" size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* Expanded State (Full Google Keep Note Editor) */
          <div className="p-5 space-y-4" onKeyDown={handleKeyDown}>
            {/* Top row: Title + Pin button */}
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                autoFocus
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="What was it (e.g. Lunch with team, Groceries)"
                className="w-full text-base font-semibold bg-transparent outline-none text-gray-900 placeholder-gray-400 font-sans"
              />
              <button
                type="button"
                onClick={() => setIsPinned(!isPinned)}
                className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                  isPinned ? 'text-[#0057FF] bg-blue-50' : 'text-gray-400 hover:text-gray-600'
                }`}
                title={isPinned ? 'Unpin' : 'Pin to top'}
              >
                <VectorIcon name="pin" size={20} strokeWidth={isPinned ? 2.5 : 1.8} />
              </button>
            </div>

            {/* Amount & Merchant Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center bg-black/5 rounded-xl px-3 py-2 border border-black/5 focus-within:border-[#0057FF]/40 focus-within:bg-white transition-all">
                <span className="font-bold text-gray-700 mr-2 text-base font-mono">₹</span>
                <input
                  ref={amountInputRef}
                  type="number"
                  step="any"
                  value={amountStr}
                  onChange={(e) => {
                    setAmountStr(e.target.value);
                    if (validationError) setValidationError(null);
                  }}
                  placeholder="Amount (e.g. 500)"
                  className="w-full bg-transparent outline-none font-semibold text-gray-900 text-sm font-sans"
                />
              </div>

              <div className="flex items-center bg-black/5 rounded-xl px-3 py-2 border border-black/5 focus-within:border-[#0057FF]/40 focus-within:bg-white transition-all">
                <VectorIcon name="home" size={16} className="text-gray-400 mr-2" />
                <input
                  type="text"
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder="Merchant (optional)"
                  className="w-full bg-transparent outline-none text-gray-900 text-sm font-sans"
                />
              </div>
            </div>

            {/* Category selector chips */}
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Category</p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
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
                      <VectorIcon name={cat.icon || cat.name} size={15} color={isSelected ? '#FFFFFF' : cat.color || 'currentColor'} />
                      <span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Split Mode Selector (Family Mode only) */}
            {mode === 'family' && (
              <div className="bg-black/5 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                    <VectorIcon name="scale" size={14} color="#0057FF" />
                    Split Mode
                  </span>
                  <div className="flex items-center gap-1">
                    {(['equal', 'percent', 'weight'] as SplitMode[]).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSplitMode(m)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold uppercase cursor-pointer transition-all ${
                          splitMode === m
                            ? 'bg-[#0057FF] text-white shadow-xs'
                            : 'bg-white/80 text-gray-600 hover:bg-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-gray-500">
                  {splitMode === 'equal' && `Divided equally among all ${members.length || 1} family members.`}
                  {splitMode === 'percent' && 'Allocated proportionately by share.'}
                  {splitMode === 'weight' && 'Allocated according to default member weights.'}
                </p>
              </div>
            )}

            {/* Notes textarea */}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes, receipt tags or comments..."
              rows={2}
              className="w-full bg-black/5 rounded-xl p-3 text-sm outline-none text-gray-800 placeholder-gray-400 resize-none font-sans"
            />

            {/* Validation / Error banner */}
            {validationError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                <VectorIcon name="alert" size={15} color="#DC2626" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Bottom Actions Tray */}
            <div className="flex items-center justify-between pt-2 border-t border-black/5">
              <div className="flex items-center gap-2 relative">
                {/* Palette picker toggle */}
                <button
                  type="button"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-2 rounded-full hover:bg-black/10 text-gray-600 cursor-pointer transition-colors"
                  title="Card pastel color"
                >
                  <VectorIcon name="palette" size={18} />
                </button>

                {showColorPicker && (
                  <div className="absolute bottom-10 left-0 z-20">
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
                  onClick={() => {
                    setIsExpanded(false);
                    setValidationError(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSave}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md ${
                    submitSuccess
                      ? 'bg-green-600 text-white shadow-green-600/25'
                      : 'bg-[#0057FF] hover:bg-[#0046D1] text-white shadow-[#0057FF]/25'
                  }`}
                >
                  {submitSuccess ? (
                    <>
                      <VectorIcon name="check" size={15} color="#FFFFFF" />
                      <span>Saved!</span>
                    </>
                  ) : isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <VectorIcon name="plus" size={15} color="#FFFFFF" />
                      <span>Save Expense</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
