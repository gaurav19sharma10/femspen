import React from 'react';

interface VectorProps {
  className?: string;
  size?: number;
}

/**
 * Official FemSpen Geometric Shield & Financial Growth Mark
 * Primary Electric Cobalt (#0057FF) with Crisp Chalk (#F8F7F4)
 */
export const FemSpenLogo: React.FC<VectorProps> = ({ className = '', size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="femspen-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#0057FF" />
      </linearGradient>
      <linearGradient id="femspen-accent" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="100%" stopColor="#0057FF" />
      </linearGradient>
      <filter id="femspen-shadow" x="0" y="2" width="100" height="98" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0057FF" floodOpacity="0.28" />
      </filter>
    </defs>

    {/* Modern Rounded Hex-Shield Base */}
    <path
      d="M50 8L86 26V58C86 75 70 90 50 96C30 90 14 75 14 58V26L50 8Z"
      fill="url(#femspen-grad)"
      filter="url(#femspen-shadow)"
    />

    {/* Inner Ambient Depth */}
    <path
      d="M50 16L78 30V56C78 69 66 81 50 86C34 81 22 69 22 56V30L50 16Z"
      fill="#0046D1"
      fillOpacity="0.35"
    />

    {/* Stylized "F" with Upward Financial Trend Arrow */}
    {/* Vertical Stem */}
    <rect x="36" y="32" width="8" height="38" rx="4" fill="#FFFFFF" />

    {/* Top Bar with Ascending Growth Bevel */}
    <path
      d="M40 32H66C68.2 32 70 33.8 70 36C70 38.2 68.2 40 66 40H44V36C44 33.8 42.2 32 40 32Z"
      fill="#FFFFFF"
    />

    {/* Middle Bar */}
    <path
      d="M44 47H60C61.7 47 63 48.3 63 50C63 51.7 61.7 53 60 53H44V47Z"
      fill="#FFFFFF"
      fillOpacity="0.9"
    />

    {/* Trending Growth Arrowhead at Top Right */}
    <circle cx="70" cy="36" r="4.5" fill="#93C5FD" />
    <path
      d="M66 28L75 28L75 37"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Handcrafted 2FA Security Vault Vector Art
 * Features primary cobalt blue (#0057FF) and subtle warm chalk accents
 */
export const FemSpenVaultArt: React.FC<VectorProps> = ({ className = '', size = 160 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="vault-plate" x1="50" y1="50" x2="150" y2="150" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F1F5F9" />
      </linearGradient>
      <linearGradient id="dial-grad" x1="80" y1="80" x2="120" y2="120" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#0057FF" />
      </linearGradient>
      <filter id="vault-glow" x="20" y="20" width="160" height="160" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0057FF" floodOpacity="0.2" />
      </filter>
    </defs>

    {/* Ambient Glow Aura */}
    <circle cx="100" cy="100" r="88" fill="#0057FF" fillOpacity="0.05" />
    <circle cx="100" cy="100" r="72" fill="#F8F7F4" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="5 5" />

    {/* Heavy Reinforced Vault Body */}
    <rect
      x="48"
      y="48"
      width="104"
      height="104"
      rx="30"
      fill="url(#vault-plate)"
      stroke="#0057FF"
      strokeWidth="3.5"
      filter="url(#vault-glow)"
    />
    <rect x="56" y="56" width="88" height="88" rx="22" fill="#F8F7F4" stroke="#E2E8F0" strokeWidth="1.5" />

    {/* Corner Steel Bolting */}
    <circle cx="64" cy="64" r="3" fill="#94A3B8" />
    <circle cx="136" cy="64" r="3" fill="#94A3B8" />
    <circle cx="64" cy="136" r="3" fill="#94A3B8" />
    <circle cx="136" cy="136" r="3" fill="#94A3B8" />

    {/* 4-PIN Status LED Indicators */}
    <g transform="translate(0, 2)">
      <circle cx="79" cy="74" r="4" fill="#0057FF" />
      <circle cx="93" cy="74" r="4" fill="#0057FF" />
      <circle cx="107" cy="74" r="4" fill="#0057FF" />
      <circle cx="121" cy="74" r="4" fill="#0057FF" />
    </g>

    {/* Central Rotary Vault Dial */}
    <circle cx="100" cy="108" r="28" fill="#0057FF" fillOpacity="0.1" />
    <circle cx="100" cy="108" r="22" fill="url(#dial-grad)" stroke="#FFFFFF" strokeWidth="2" />
    <circle cx="100" cy="108" r="9" fill="#FFFFFF" />
    <circle cx="100" cy="108" r="4" fill="#0057FF" />

    {/* Dial Precision Ticks */}
    <line x1="100" y1="88" x2="100" y2="92" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    <line x1="120" y1="108" x2="116" y2="108" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    <line x1="100" y1="128" x2="100" y2="124" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
    <line x1="80" y1="108" x2="84" y2="108" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />

    {/* Top Security Crest / Badge */}
    <path
      d="M100 24L118 33V44C118 55 110 64 100 68C90 64 82 55 82 44V33L100 24Z"
      fill="#0057FF"
    />
    <path
      d="M94 45L98 49L106 41"
      stroke="#FFFFFF"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Sparkles */}
    <path d="M156 46L158 52L164 54L158 56L156 62L154 56L148 54L154 52L156 46Z" fill="#0057FF" fillOpacity="0.8" />
    <path d="M42 142L43.5 146.5L48 148L43.5 149.5L42 154L40.5 149.5L36 148L40.5 146.5L42 142Z" fill="#0057FF" fillOpacity="0.5" />
  </svg>
);

// Backward-compatible alias for existing imports
export const KeepVaultArt = FemSpenVaultArt;

/**
 * Handcrafted Google Keep-style Empty Ledger Vector Art
 */
export const FemSpenEmptyFeedArt: React.FC<VectorProps> = ({ className = '', size = 180 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <ellipse cx="100" cy="170" rx="72" ry="12" fill="#E2E8F0" fillOpacity="0.6" />

    {/* Background Tilted Pastel Note Card (Sky Blue) */}
    <g transform="rotate(-6 85 95)">
      <rect x="42" y="45" width="84" height="100" rx="16" fill="#E3F2FD" stroke="#90CAF9" strokeWidth="2" />
      <rect x="54" y="60" width="46" height="6" rx="3" fill="#1E88E5" fillOpacity="0.5" />
      <rect x="54" y="74" width="60" height="4" rx="2" fill="#1E88E5" fillOpacity="0.25" />
      <rect x="54" y="84" width="50" height="4" rx="2" fill="#1E88E5" fillOpacity="0.25" />
      <circle cx="108" cy="120" r="10" fill="#1E88E5" fillOpacity="0.2" />
    </g>

    {/* Middle Tilted Pastel Note Card (Soft Peach) */}
    <g transform="rotate(7 120 100)">
      <rect x="80" y="52" width="84" height="100" rx="16" fill="#FFF0E0" stroke="#FFCC80" strokeWidth="2" />
      <rect x="92" y="66" width="38" height="6" rx="3" fill="#FB8C00" fillOpacity="0.5" />
      <rect x="92" y="80" width="60" height="4" rx="2" fill="#FB8C00" fillOpacity="0.25" />
      <rect x="92" y="90" width="45" height="4" rx="2" fill="#FB8C00" fillOpacity="0.25" />
    </g>

    {/* Foreground Note Card (Google Keep Primary Clean Chalk Card) */}
    <g transform="translate(15, 0)">
      <rect x="55" y="60" width="86" height="102" rx="18" fill="#FFFFFF" stroke="#0057FF" strokeWidth="2.5" />
      <rect x="68" y="76" width="36" height="6" rx="3" fill="#0057FF" />
      <rect x="68" y="90" width="58" height="4" rx="2" fill="#CBD5E1" />
      <rect x="68" y="100" width="44" height="4" rx="2" fill="#CBD5E1" />

      {/* Keep Pushpin Badge */}
      <circle cx="126" cy="74" r="5" fill="#0057FF" />
      <line x1="126" y1="74" x2="132" y2="68" stroke="#0057FF" strokeWidth="2.5" strokeLinecap="round" />

      {/* Floating Price Pill */}
      <rect x="68" y="122" width="46" height="18" rx="9" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
      <text x="76" y="135" fill="#0057FF" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
        $0.00
      </text>
    </g>

    {/* Floating Golden Coin */}
    <circle cx="156" cy="46" r="18" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2.5" />
    <circle cx="156" cy="46" r="13" fill="#FDE68A" />
    <text x="151" y="52" fill="#B45309" fontSize="15" fontWeight="bold" fontFamily="sans-serif">
      $
    </text>

    {/* Sparkles */}
    <path d="M38 72L40 78L46 80L40 82L38 88L36 82L30 80L36 78L38 72Z" fill="#0057FF" fillOpacity="0.7" />
  </svg>
);

export const EmptyFeedArt = FemSpenEmptyFeedArt;

/**
 * Handcrafted Family Collaborative Vector Art
 */
export const FemSpenFamilyArt: React.FC<VectorProps> = ({ className = '', size = 160 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="100" cy="100" r="78" fill="#10B981" fillOpacity="0.1" />

    {/* House Architecture */}
    <path
      d="M100 42L44 88V152C44 157.5 48.5 162 54 162H146C151.5 162 156 157.5 156 152V88L100 42Z"
      fill="#FFFFFF"
      stroke="#0057FF"
      strokeWidth="3"
    />

    {/* Roof Trim */}
    <path
      d="M38 92L100 40L162 92"
      stroke="#0057FF"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Family Avatars Badges */}
    {/* Member 1 (Left) */}
    <circle cx="75" cy="116" r="13" fill="#E3F2FD" stroke="#0057FF" strokeWidth="2" />
    <circle cx="75" cy="112" r="5.5" fill="#0057FF" />
    <path d="M67 125C67 121 70.5 118 75 118C79.5 118 83 121 83 125" stroke="#0057FF" strokeWidth="1.8" />

    {/* Member 2 (Right) */}
    <circle cx="125" cy="116" r="13" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="2" />
    <circle cx="125" cy="112" r="5.5" fill="#D97706" />
    <path d="M117 125C117 121 120.5 118 125 118C129.5 118 133 121 133 125" stroke="#D97706" strokeWidth="1.8" />

    {/* Member 3 (Junior Center) */}
    <circle cx="100" cy="130" r="10" fill="#E8F5E9" stroke="#10B981" strokeWidth="2" />
    <circle cx="100" cy="127" r="4" fill="#059669" />
    <path d="M93 137C93 134 96 132 100 132C104 132 107 134 107 137" stroke="#059669" strokeWidth="1.5" />

    {/* Heart Crest */}
    <circle cx="100" cy="72" r="15" fill="#0057FF" />
    <path
      d="M100 79L95.5 74.5C93 72 93 68.5 95.5 66.5C97.5 64.5 100 65.5 100 66.5C100 65.5 102.5 64.5 104.5 66.5C107 68.5 107 72 104.5 74.5L100 79Z"
      fill="#FFFFFF"
    />
  </svg>
);

export const FamilyModeArt = FemSpenFamilyArt;

/**
 * Handcrafted Spend Analytics Vector Art
 */
export const FemSpenAnalyticsArt: React.FC<VectorProps> = ({ className = '', size = 150 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="80" cy="80" r="64" fill="#EFF6FF" stroke="#DBEAFE" strokeWidth="1.5" />

    {/* Bar 1 */}
    <rect x="42" y="90" width="16" height="35" rx="6" fill="#93C5FD" />
    {/* Bar 2 */}
    <rect x="64" y="65" width="16" height="60" rx="6" fill="#3B82F6" />
    {/* Bar 3 (Primary Peak) */}
    <rect x="86" y="44" width="16" height="81" rx="6" fill="#0057FF" />
    {/* Bar 4 */}
    <rect x="108" y="75" width="16" height="50" rx="6" fill="#60A5FA" />

    {/* Spline Trend Curve */}
    <path
      d="M44 88Q72 50 94 40T122 70"
      stroke="#1E40AF"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <circle cx="94" cy="40" r="4.5" fill="#FFFFFF" stroke="#0057FF" strokeWidth="3" />

    {/* Sparkle */}
    <path d="M125 35L127 39L131 40L127 41L125 45L123 41L119 40L123 39L125 35Z" fill="#F59E0B" />
  </svg>
);

/**
 * Handcrafted Recurring Bills Piggybank Vector Art
 */
export const FemSpenRecurringArt: React.FC<VectorProps> = ({ className = '', size = 150 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 160 160"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <circle cx="80" cy="80" r="65" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1.5" />

    {/* Piggy Body */}
    <ellipse cx="80" cy="85" rx="42" ry="32" fill="#FFFFFF" stroke="#10B981" strokeWidth="3" />
    {/* Snout */}
    <ellipse cx="44" cy="88" rx="8" ry="11" fill="#E8F5E9" stroke="#10B981" strokeWidth="2.5" />
    <circle cx="43" cy="85" r="2" fill="#059669" />
    <circle cx="43" cy="91" r="2" fill="#059669" />

    {/* Ear */}
    <path d="M60 62L68 50L75 62Z" fill="#C8E6C9" stroke="#10B981" strokeWidth="2.5" strokeLinejoin="round" />
    {/* Eye */}
    <circle cx="62" cy="74" r="3" fill="#10B981" />

    {/* Legs */}
    <rect x="58" y="112" width="9" height="12" rx="4" fill="#10B981" />
    <rect x="94" y="112" width="9" height="12" rx="4" fill="#10B981" />

    {/* Coin Slot */}
    <line x1="74" y1="58" x2="90" y2="58" stroke="#059669" strokeWidth="3.5" strokeLinecap="round" />

    {/* Falling Gold Coin */}
    <circle cx="82" cy="44" r="11" fill="#FCD34D" stroke="#D97706" strokeWidth="2" />
    <text x="79" y="48" fill="#B45309" fontSize="10" fontWeight="bold" fontFamily="sans-serif">$</text>

    {/* Subscriptions Cycle Badge */}
    <circle cx="120" cy="65" r="14" fill="#0057FF" />
    <path
      d="M116 65A4 4 0 1 1 124 65"
      stroke="#FFFFFF"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);
