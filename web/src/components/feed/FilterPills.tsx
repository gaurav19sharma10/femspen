import React from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { CATEGORIES, KEEP_COLORS } from '../../types';
import { X, Palette } from 'lucide-react';

export const FilterPills: React.FC = () => {
  const {
    selectedCategory,
    setSelectedCategory,
    selectedColor,
    setSelectedColor,
  } = useExpense();

  const hasActiveFilters = Boolean(selectedCategory || selectedColor);

  return (
    <div className="py-2.5 flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
            !selectedCategory
              ? 'bg-[#0057FF] text-white border-[#0057FF] shadow-xs'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          All
        </button>

        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(isSelected ? null : cat.name)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                isSelected
                  ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Color Filter Dots & Clear Button */}
      <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-gray-200">
        <Palette size={13} className="text-gray-400 mr-1" />
        {KEEP_COLORS.map((c) => {
          const isSelected = selectedColor === c.hex;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedColor(isSelected ? null : c.hex)}
              title={c.name}
              className={`w-4.5 h-4.5 rounded-full border cursor-pointer transition-transform ${
                isSelected ? 'scale-125 ring-2 ring-[#0057FF] border-white' : 'border-gray-300 hover:scale-110'
              }`}
              style={{ backgroundColor: c.hex }}
            />
          );
        })}

        {hasActiveFilters && (
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSelectedColor(null);
            }}
            className="ml-2 text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 cursor-pointer"
          >
            <X size={13} />
            <span>Clear</span>
          </button>
        )}
      </div>
    </div>
  );
};
