import React from 'react';

/**
 * Authentic hand-authored vector illustrations ported directly
 * from RVS Expences native Android app (src/components/vector/illustrations.tsx).
 */

interface IllustrationProps {
  size?: number;
  className?: string;
}

/** Shown when no expenses are logged yet. Glass slab with settling coin. */
export const EmptyLedgerIllustration: React.FC<IllustrationProps> = ({ size = 180, className = '' }) => {
  return (
    <svg
      width={size}
      height={size * 0.86}
      viewBox="0 0 200 172"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="ledgerPaper" x1="60" y1="20" x2="150" y2="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0057FF" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#0057FF" stopOpacity="0.04" />
        </linearGradient>
      </defs>

      {/* The glass slab */}
      <rect x="26" y="14" width="148" height="128" rx="26" fill="url(#ledgerPaper)" />
      <rect
        x="26.5"
        y="14.5"
        width="147"
        height="127"
        rx="25.5"
        stroke="#E0EAFF"
        strokeWidth="1.5"
      />

      <rect x="48" y="42" width="60" height="9" rx="4.5" fill="#0057FF" opacity="0.55" />
      <rect x="48" y="62" width="104" height="7" rx="3.5" fill="#94A3B8" opacity="0.3" />
      <rect x="48" y="79" width="86" height="7" rx="3.5" fill="#94A3B8" opacity="0.22" />
      <rect x="48" y="96" width="94" height="7" rx="3.5" fill="#94A3B8" opacity="0.16" />

      {/* A coin settling into place */}
      <circle cx="140" cy="112" r="22" fill="#0057FF" opacity="0.14" />
      <circle cx="140" cy="112" r="15" fill="#0057FF" opacity="0.85" />
      <path
        d="M140 103v18M134 107.5h12M134 116.5h12"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
};

/** Shown when all balances are square. Green celebration badge with checkmark and confetti. */
export const AllSettledIllustration: React.FC<IllustrationProps> = ({ size = 150, className = '' }) => {
  return (
    <svg
      width={size}
      height={size * 0.9}
      viewBox="0 0 180 162"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="okFill" x1="20" y1="18" x2="160" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10B981" stopOpacity="0.03" />
        </linearGradient>
      </defs>

      <circle cx="90" cy="80" r="56" fill="url(#okFill)" />
      <circle cx="90" cy="80" r="38" fill="#10B981" opacity="0.16" />
      <circle cx="90" cy="80" r="30" fill="#10B981" />

      <path
        d="M76 80.5 86 90.5 106 69"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Confetti marks */}
      <path d="M28 42v12M22 48h12" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <path d="M152 108v12M146 114h12" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
      <circle cx="140" cy="36" r="5" fill="#8B5CF6" opacity="0.6" />
    </svg>
  );
};

/** Shown on insights when there's not enough data. */
export const EmptyInsightsIllustration: React.FC<IllustrationProps> = ({ size = 170, className = '' }) => {
  return (
    <svg
      width={size}
      height={size * 0.84}
      viewBox="0 0 190 160"
      fill="none"
      className={className}
    >
      <rect x="18" y="20" width="154" height="120" rx="24" fill="#0057FF" fillOpacity="0.04" />
      <rect
        x="18.5"
        y="20.5"
        width="153"
        height="119"
        rx="23.5"
        stroke="#E2E8F0"
        strokeWidth="1.5"
      />

      <g opacity="0.6">
        <rect x="42" y="96" width="16" height="28" rx="8" fill="#0057FF" />
        <rect x="66" y="80" width="16" height="44" rx="8" fill="#3B82F6" />
        <rect x="90" y="104" width="16" height="20" rx="8" fill="#10B981" />
        <rect x="114" y="64" width="16" height="60" rx="8" fill="#F59E0B" />
        <rect x="138" y="88" width="16" height="36" rx="8" fill="#8B5CF6" />
      </g>

      <path d="M38 62c10-12 22 6 32-6s20 2 30-8" stroke="#0057FF" strokeWidth="2.6" strokeLinecap="round" opacity="0.6" />
      <circle cx="100" cy="48" r="4" fill="#0057FF" opacity="0.7" />
    </svg>
  );
};

/** Shown when no members or family invited yet. Overlapping silhouettes. */
export const EmptyFamilyIllustration: React.FC<IllustrationProps> = ({ size = 170, className = '' }) => {
  return (
    <svg
      width={size}
      height={size * 0.84}
      viewBox="0 0 190 160"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient id="famFill" x1="30" y1="24" x2="160" y2="146" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0057FF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <rect x="22" y="22" width="146" height="118" rx="28" fill="url(#famFill)" />
      <rect x="22.5" y="22.5" width="145" height="117" rx="27.5" stroke="#E2E8F0" strokeWidth="1.5" />

      {/* Two overlapping silhouettes */}
      <circle cx="76" cy="70" r="20" fill="#0057FF" opacity="0.6" />
      <path d="M46 122a30 30 0 0 1 60 0z" fill="#0057FF" opacity="0.6" />

      <circle cx="118" cy="76" r="17" fill="#3B82F6" opacity="0.5" />
      <path d="M93 122a25 25 0 0 1 50 0z" fill="#3B82F6" opacity="0.5" />
    </svg>
  );
};
