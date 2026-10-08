import React from 'react';

interface VectorProps {
  className?: string;
  size?: number;
}

/**
 * Handcrafted 2FA Security Vault Vector Art
 * Features primary cobalt blue (#0057FF) and subtle warm chalk accents
 */
export const KeepVaultArt: React.FC<VectorProps> = ({ className = '', size = 160 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Soft ambient background glow */}
    <circle cx="100" cy="100" r="85" fill="#0057FF" fillOpacity="0.06" />
    <circle cx="100" cy="100" r="68" fill="#F8F7F4" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="4 4" />

    {/* Vault Body Outer Plate */}
    <rect x="52" y="52" width="96" height="96" rx="28" fill="#FFFFFF" stroke="#0057FF" strokeWidth="3" />
    <rect x="60" y="60" width="80" height="80" rx="20" fill="#F8F7F4" />

    {/* Dynamic Dial Rings */}
    <circle cx="100" cy="100" r="26" fill="#0057FF" fillOpacity="0.12" />
    <circle cx="100" cy="100" r="20" fill="#0057FF" />
    <circle cx="100" cy="100" r="7" fill="#FFFFFF" />

    {/* Keyhole / Biometric Notch */}
    <path
      d="M100 95V105M95 100H105"
      stroke="#0057FF"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* 4-PIN Dot Status Indicators */}
    <circle cx="78" cy="74" r="3.5" fill="#0057FF" />
    <circle cx="92" cy="74" r="3.5" fill="#0057FF" />
    <circle cx="108" cy="74" r="3.5" fill="#0057FF" />
    <circle cx="122" cy="74" r="3.5" fill="#0057FF" />

    {/* Decorative Shield Emblem */}
    <path
      d="M100 32L116 40V50C116 60 109 68 100 71C91 68 84 60 84 50V40L100 32Z"
      fill="#0057FF"
    />
    <path
      d="M100 42V61M94 51L100 57L106 51"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Subtle Star Sparkles */}
    <path d="M152 44L154 50L160 52L154 54L152 60L150 54L144 52L150 50L152 44Z" fill="#0057FF" fillOpacity="0.7" />
    <path d="M42 136L43.5 140.5L48 142L43.5 143.5L42 148L40.5 143.5L36 142L40.5 140.5L42 136Z" fill="#0057FF" fillOpacity="0.5" />
  </svg>
);

/**
 * Handcrafted Google Keep Empty Ledger Vector Art
 */
export const EmptyFeedArt: React.FC<VectorProps> = ({ className = '', size = 180 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <ellipse cx="100" cy="165" rx="65" ry="10" fill="#E2E8F0" fillOpacity="0.5" />

    {/* Background Tilt Note Card */}
    <g transform="rotate(-7 85 95)">
      <rect x="45" y="45" width="80" height="95" rx="14" fill="#BBDEFB" stroke="#90CAF9" strokeWidth="2" />
      <rect x="55" y="60" width="45" height="6" rx="3" fill="#1565C0" fillOpacity="0.4" />
      <rect x="55" y="73" width="60" height="4" rx="2" fill="#1565C0" fillOpacity="0.25" />
      <rect x="55" y="83" width="50" height="4" rx="2" fill="#1565C0" fillOpacity="0.25" />
      <circle cx="105" cy="115" r="9" fill="#1565C0" fillOpacity="0.3" />
    </g>

    {/* Foreground Note Card (Google Keep Primary Card) */}
    <g transform="rotate(5 115 105)">
      <rect x="75" y="55" width="85" height="100" rx="16" fill="#FFFFFF" stroke="#0057FF" strokeWidth="2.5" />
      <rect x="87" y="70" width="30" height="6" rx="3" fill="#0057FF" />
      <rect x="87" y="83" width="60" height="4" rx="2" fill="#CBD5E1" />
      <rect x="87" y="93" width="45" height="4" rx="2" fill="#CBD5E1" />
      
      {/* Pinned Pushpin Graphic */}
      <circle cx="145" cy="67" r="4" fill="#0057FF" />
      <path d="M145 67L150 62" stroke="#0057FF" strokeWidth="2" strokeLinecap="round" />

      {/* Pill Badge */}
      <rect x="87" y="115" width="34" height="16" rx="8" fill="#EBF2FF" />
      <text x="94" y="127" fill="#0057FF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">$0.00</text>
    </g>

    {/* Floating Coin with Subtle Shine */}
    <circle cx="150" cy="50" r="18" fill="#FFE0B2" stroke="#FFB74D" strokeWidth="2" />
    <circle cx="150" cy="50" r="13" fill="#FFF3E0" />
    <text x="145" y="55" fill="#E65100" fontSize="14" fontWeight="bold" fontFamily="sans-serif">$</text>

    {/* Floating Sparkles */}
    <path d="M40 70L42 76L48 78L42 80L40 86L38 80L32 78L38 76L40 70Z" fill="#0057FF" fillOpacity="0.6" />
  </svg>
);

/**
 * Handcrafted Family Mode Collaborative Vector Art
 */
export const FamilyModeArt: React.FC<VectorProps> = ({ className = '', size = 160 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="100" cy="100" r="75" fill="#C8E6C9" fillOpacity="0.25" />

    {/* Home Outline */}
    <path
      d="M100 45L45 90V150C45 155.5 49.5 160 55 160H145C150.5 160 155 155.5 155 150V90L100 45Z"
      fill="#FFFFFF"
      stroke="#0057FF"
      strokeWidth="3"
    />

    {/* Roof Accent */}
    <path
      d="M40 93L100 43L160 93"
      stroke="#0057FF"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Family Avatars Badges */}
    {/* Parent 1 (Left) */}
    <circle cx="75" cy="115" r="12" fill="#BBDEFB" stroke="#0057FF" strokeWidth="2" />
    <circle cx="75" cy="111" r="5" fill="#0057FF" />
    <path d="M68 123C68 119.5 71 117 75 117C79 117 82 119.5 82 123" stroke="#0057FF" strokeWidth="1.5" />

    {/* Parent 2 (Right) */}
    <circle cx="125" cy="115" r="12" fill="#FFE0B2" stroke="#F57C00" strokeWidth="2" />
    <circle cx="125" cy="111" r="5" fill="#E65100" />
    <path d="M118 123C118 119.5 121 117 125 117C129 117 132 119.5 132 123" stroke="#E65100" strokeWidth="1.5" />

    {/* Junior / Child (Center) */}
    <circle cx="100" cy="128" r="9" fill="#DCEDC8" stroke="#33691E" strokeWidth="2" />
    <circle cx="100" cy="125" r="3.5" fill="#33691E" />
    <path d="M94 134C94 131.5 96.5 129.5 100 129.5C103.5 129.5 106 131.5 106 134" stroke="#33691E" strokeWidth="1.2" />

    {/* Heart Badge at Top */}
    <circle cx="100" cy="72" r="14" fill="#0057FF" />
    <path
      d="M100 78L96 74C94 72 94 69 96 67C98 65 100 66 100 67C100 66 102 65 104 67C106 69 106 72 104 74L100 78Z"
      fill="#FFFFFF"
    />
  </svg>
);

/**
 * Handcrafted Budget Health & Target Graphic
 */
export const BudgetMeterArt: React.FC<VectorProps> = ({ className = '', size = 140 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="80" cy="80" r="60" fill="#F8F7F4" stroke="#E2E8F0" strokeWidth="8" />
    {/* Animated Meter Arc */}
    <path
      d="M38 122C26.5 110.5 20 95 20 80C20 46.8 46.8 20 80 20C113.2 20 140 46.8 140 80C140 95 133.5 110.5 122 122"
      stroke="#0057FF"
      strokeWidth="9"
      strokeLinecap="round"
    />
    <circle cx="80" cy="80" r="36" fill="#0057FF" fillOpacity="0.08" />
    <circle cx="80" cy="80" r="26" fill="#FFFFFF" stroke="#0057FF" strokeWidth="2.5" />
    <text x="73" y="87" fill="#0057FF" fontSize="20" fontWeight="bold" fontFamily="sans-serif">%</text>
  </svg>
);
