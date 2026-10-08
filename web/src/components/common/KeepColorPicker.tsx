import React from 'react';

export interface KeepColor {
  id: string;
  name: string;
  hex: string;
}

export const KEEP_CARD_COLORS: KeepColor[] = [
  { id: 'chalk', name: 'Chalk White', hex: '#FFFFFF' },
  { id: 'peach', name: 'Soft Peach', hex: '#FFF0E0' },
  { id: 'mint', name: 'Fresh Mint', hex: '#E8F5E9' },
  { id: 'sky', name: 'Sky Blue', hex: '#E3F2FD' },
  { id: 'lemon', name: 'Pale Lemon', hex: '#FFFDE7' },
  { id: 'lavender', name: 'Lavender', hex: '#F3E5F5' },
  { id: 'coral', name: 'Soft Coral', hex: '#FFEBEE' },
  { id: 'sage', name: 'Muted Sage', hex: '#F1F8E9' },
  { id: 'sand', name: 'Warm Sand', hex: '#FFF8E1' },
];

interface KeepColorPickerProps {
  selectedColor: string;
  onSelectColor: (hex: string) => void;
  className?: string;
}

export const KeepColorPicker: React.FC<KeepColorPickerProps> = ({
  selectedColor,
  onSelectColor,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-1.5 p-1.5 bg-white rounded-full shadow-lg border border-gray-200/80 z-50 ${className}`}>
      {KEEP_CARD_COLORS.map((c) => {
        const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
        return (
          <button
            key={c.id}
            type="button"
            title={c.name}
            onClick={(e) => {
              e.stopPropagation();
              onSelectColor(c.hex);
            }}
            style={{ backgroundColor: c.hex }}
            className={`w-6 h-6 rounded-full border transition-transform hover:scale-115 cursor-pointer ${
              isSelected ? 'border-[#0057FF] ring-2 ring-[#0057FF]/30 scale-110' : 'border-gray-300'
            }`}
          />
        );
      })}
    </div>
  );
};
