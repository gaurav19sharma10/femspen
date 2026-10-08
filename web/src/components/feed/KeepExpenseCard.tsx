import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VectorIcon } from '../vector/VectorIcons';
import { KeepColorPicker } from '../common/KeepColorPicker';
import { useExpense, type UnifiedExpense } from '../../context/ExpenseContext';
import { formatMoney } from '../../domain/currency';

interface KeepExpenseCardProps {
  expense: UnifiedExpense;
  onEdit: (expense: UnifiedExpense) => void;
}

export const KeepExpenseCard: React.FC<KeepExpenseCardProps> = ({ expense, onEdit }) => {
  const { togglePin, setCardColor, deleteExpense, mode } = useExpense();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formattedAmount = formatMoney(expense.baseAmountMinor, expense.currency);

  const formattedDate = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(expense.date);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowColorPicker(false);
      }}
      style={{ backgroundColor: expense.color || '#FFFFFF' }}
      className="group relative rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all duration-200 p-4 flex flex-col justify-between overflow-hidden cursor-default"
    >
      {/* Top Header: Title, Amount, and Pin button */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-snug break-words">
              {expense.title}
            </h3>
            {expense.merchant && (
              <p className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-1">
                <span>at {expense.merchant}</span>
              </p>
            )}
          </div>

          {/* Pin button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePin(expense.id, expense.isPinned);
            }}
            className={`p-1.5 rounded-full transition-opacity cursor-pointer ${
              expense.isPinned
                ? 'text-[#0057FF] opacity-100 bg-blue-50/80'
                : isHovered
                ? 'opacity-80 hover:opacity-100 text-gray-400 hover:text-gray-700'
                : 'opacity-0'
            }`}
            title={expense.isPinned ? 'Unpin note' : 'Pin note'}
          >
            <VectorIcon name="pin" size={17} strokeWidth={expense.isPinned ? 2.5 : 1.8} />
          </button>
        </div>

        {/* Big Rupee Amount */}
        <div className="mt-2.5">
          <span className="font-bold text-gray-950 text-xl tracking-tight font-sans">
            {formattedAmount}
          </span>
        </div>

        {/* Notes snippet if present */}
        {expense.notes && (
          <p className="text-xs text-gray-600 mt-2 line-clamp-3 leading-relaxed">
            {expense.notes}
          </p>
        )}
      </div>

      {/* Middle Tags: Category pill & Payer / Split pill */}
      <div className="mt-3.5 space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Category Chip */}
          <span
            style={{ borderColor: expense.categoryColor + '40', color: expense.categoryColor }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/70 border"
          >
            <VectorIcon name={expense.categoryIcon} size={12} color={expense.categoryColor} />
            <span>{expense.categoryName}</span>
          </span>

          {/* Date Tag */}
          <span className="text-[11px] text-gray-400 font-medium ml-auto">
            {formattedDate}
          </span>
        </div>

        {/* Mode & Payer info */}
        {mode === 'family' && (
          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-black/5 font-medium">
            <span className="truncate">
              Paid by <strong>{expense.paidByName}</strong>
            </span>
            <span className="bg-black/5 px-2 py-0.5 rounded-md text-[10px] font-semibold text-gray-600">
              Split {expense.participantCount || 1} ways
            </span>
          </div>
        )}
      </div>

      {/* Google Keep Bottom Action Tray (revealed on hover) */}
      <div
        className={`mt-3 pt-2 border-t border-black/5 flex items-center justify-between transition-opacity duration-150 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="flex items-center gap-1 relative">
          {/* Palette button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowColorPicker(!showColorPicker);
            }}
            className="p-1.5 rounded-full hover:bg-black/10 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            title="Change note color"
          >
            <VectorIcon name="palette" size={15} />
          </button>

          {showColorPicker && (
            <div className="absolute bottom-8 left-0 z-50">
              <KeepColorPicker
                selectedColor={expense.color}
                onSelectColor={(hex) => {
                  setCardColor(expense.id, hex);
                  setShowColorPicker(false);
                }}
              />
            </div>
          )}

          {/* Edit button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(expense);
            }}
            className="p-1.5 rounded-full hover:bg-black/10 text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            title="Edit expense details"
          >
            <VectorIcon name="edit" size={15} />
          </button>
        </div>

        {/* Delete button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete "${expense.title}"?`)) {
              deleteExpense(expense.id, expense.title);
            }
          }}
          className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
          title="Delete expense"
        >
          <VectorIcon name="trash" size={15} />
        </button>
      </div>
    </motion.div>
  );
};
