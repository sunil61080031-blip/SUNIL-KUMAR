import React from 'react';

/**
 * Artistic, semi-transparent educational doodle pattern over a blue-to-turquoise gradient.
 * Includes books, pencils, graduation caps, globes, rockets, calculators, stars, and math symbols.
 */
export const EducationalDoodleBackdrop: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none fixed inset-0 overflow-hidden z-0"
    >
      {/* Rich multi-stop blue to turquoise gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(155deg, #064fa8 0%, #0975cc 38%, #0d99d6 70%, #14bcc8 100%)'
        }}
      />

      {/* Soft artistic luminance pools for subtle depth */}
      <div
        className="absolute -top-24 -left-20 w-[26rem] h-[26rem] rounded-full opacity-35 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #38bdf8 0%, transparent 70%)'
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[34rem] rounded-full opacity-25 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #67e8f9 0%, transparent 72%)'
        }}
      />
      <div
        className="absolute -bottom-24 -right-16 w-[28rem] h-[28rem] rounded-full opacity-30 blur-3xl"
        style={{
          background: 'radial-gradient(circle, #2dd4bf 0%, transparent 70%)'
        }}
      />

      {/* Repeating transparent vector educational doodle SVG */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.17]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="edu-doodle-pattern"
            x="0"
            y="0"
            width="360"
            height="360"
            patternUnits="userSpaceOnUse"
          >
            {/* 1. Graduation Cap (top-left) */}
            <g
              transform="translate(26, 28) rotate(-14)"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="24,4 48,14 24,24 0,14" />
              <path d="M9,18 L9,29 C9,33 39,33 39,29 L39,18" />
              <line x1="44" y1="16" x2="44" y2="30" />
              <circle cx="44" cy="32" r="2.2" fill="#ffffff" />
            </g>

            {/* 2. Open Book (top-center) */}
            <g
              transform="translate(152, 22) rotate(8)"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2,8 C10,4 19,5 24,10 C29,5 38,4 46,8 L46,34 C38,30 29,31 24,36 C19,31 10,30 2,34 Z" />
              <line x1="24" y1="10" x2="24" y2="36" />
              <line x1="8" y1="15" x2="18" y2="16" strokeWidth="1.4" />
              <line x1="8" y1="21" x2="18" y2="22" strokeWidth="1.4" />
              <line x1="30" y1="16" x2="40" y2="15" strokeWidth="1.4" />
              <line x1="30" y1="22" x2="40" y2="21" strokeWidth="1.4" />
            </g>

            {/* 3. Rocket (top-right) */}
            <g
              transform="translate(284, 30) rotate(24)"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16,0 C24,10 26,22 22,34 L10,34 C6,22 8,10 16,0 Z" />
              <circle cx="16" cy="15" r="4" />
              <path d="M9,26 L2,34 L9,33" />
              <path d="M23,26 L30,34 L23,33" />
              <path d="M12,37 Q16,44 20,37" strokeWidth="1.6" />
            </g>

            {/* 4. Globe (mid-left) */}
            <g
              transform="translate(34, 146) rotate(-8)"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="20" cy="20" r="16" />
              <ellipse cx="20" cy="20" rx="7.5" ry="16" strokeWidth="1.5" />
              <line x1="4" y1="20" x2="36" y2="20" strokeWidth="1.5" />
              <path d="M7,11 Q20,14 33,11" strokeWidth="1.3" />
              <path d="M7,29 Q20,26 33,29" strokeWidth="1.3" />
              <path d="M20,36 L20,42 M12,42 L28,42" />
            </g>

            {/* 5. Pencil & Ruler Cross (center) */}
            <g
              transform="translate(166, 152) rotate(-28)"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="6" y="4" width="10" height="36" rx="1.5" />
              <polygon points="6,40 16,40 11,49" />
              <line x1="6" y1="11" x2="16" y2="11" strokeWidth="1.5" />
              <line x1="11" y1="11" x2="11" y2="40" strokeWidth="1.3" />
            </g>

            {/* 6. Pocket Calculator (mid-right) */}
            <g
              transform="translate(278, 154) rotate(12)"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="32" height="42" rx="4" />
              <rect x="7" y="7" width="22" height="9" rx="1.5" strokeWidth="1.6" />
              <rect x="7" y="21" width="5" height="4" rx="0.8" strokeWidth="1.4" />
              <rect x="15.5" y="21" width="5" height="4" rx="0.8" strokeWidth="1.4" />
              <rect x="24" y="21" width="5" height="4" rx="0.8" strokeWidth="1.4" />
              <rect x="7" y="29" width="5" height="4" rx="0.8" strokeWidth="1.4" />
              <rect x="15.5" y="29" width="5" height="4" rx="0.8" strokeWidth="1.4" />
              <rect x="24" y="29" width="5" height="10" rx="0.8" strokeWidth="1.4" />
              <rect x="7" y="36" width="13.5" height="3.5" rx="0.8" strokeWidth="1.4" />
            </g>

            {/* 7. Stacked Textbooks (bottom-left) */}
            <g
              transform="translate(40, 274) rotate(10)"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="22" width="42" height="12" rx="2" />
              <line x1="9" y1="22" x2="9" y2="34" strokeWidth="1.5" />
              <rect x="6" y="10" width="36" height="12" rx="2" />
              <line x1="13" y1="10" x2="13" y2="22" strokeWidth="1.5" />
              <rect x="11" y="0" width="28" height="10" rx="2" />
            </g>

            {/* 8. Lightbulb Idea (bottom-center) */}
            <g
              transform="translate(174, 266) rotate(-10)"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16,6 C9,6 4,11 4,18 C4,23 8,26 10,30 L22,30 C24,26 28,23 28,18 C28,11 23,6 16,6 Z" />
              <line x1="11" y1="34" x2="21" y2="34" />
              <line x1="13" y1="38" x2="19" y2="38" />
              <line x1="16" y1="0" x2="16" y2="3" strokeWidth="1.5" />
              <line x1="2" y1="10" x2="5" y2="12" strokeWidth="1.5" />
              <line x1="30" y1="10" x2="27" y2="12" strokeWidth="1.5" />
            </g>

            {/* 9. Ruler & Set Square (bottom-right) */}
            <g
              transform="translate(274, 274) rotate(-16)"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="4,40 4,4 42,40" />
              <polygon points="11,33 11,18 27,33" strokeWidth="1.4" />
              <line x1="4" y1="12" x2="8" y2="12" strokeWidth="1.3" />
              <line x1="4" y1="20" x2="8" y2="20" strokeWidth="1.3" />
              <line x1="4" y1="28" x2="8" y2="28" strokeWidth="1.3" />
            </g>

            {/* 10. Mathematical Symbols & Stars scattered cleanly */}
            <text
              x="104"
              y="98"
              fill="#ffffff"
              fontFamily="Outfit, sans-serif"
              fontWeight="700"
              fontSize="24"
              transform="rotate(-12 104 98)"
            >
              π
            </text>
            <text
              x="228"
              y="96"
              fill="#ffffff"
              fontFamily="Outfit, sans-serif"
              fontWeight="700"
              fontSize="22"
              transform="rotate(14 228 96)"
            >
              ∑
            </text>
            <text
              x="110"
              y="228"
              fill="#ffffff"
              fontFamily="Outfit, sans-serif"
              fontWeight="700"
              fontSize="18"
              transform="rotate(-8 110 228)"
            >
              a²+b²
            </text>
            <text
              x="226"
              y="236"
              fill="#ffffff"
              fontFamily="Outfit, sans-serif"
              fontWeight="700"
              fontSize="22"
              transform="rotate(10 226 236)"
            >
              √x
            </text>
            <text
              x="14"
              y="108"
              fill="#ffffff"
              fontFamily="Outfit, sans-serif"
              fontWeight="700"
              fontSize="19"
            >
              ÷
            </text>
            <text
              x="332"
              y="124"
              fill="#ffffff"
              fontFamily="Outfit, sans-serif"
              fontWeight="700"
              fontSize="20"
            >
              ∞
            </text>
            <text
              x="128"
              y="336"
              fill="#ffffff"
              fontFamily="Outfit, sans-serif"
              fontWeight="700"
              fontSize="18"
            >
              ±
            </text>

            {/* 5-point Stars */}
            <path
              d="M96,42 L98.5,47.5 L104.5,48.2 L100,52.3 L101.2,58.2 L96,55.2 L90.8,58.2 L92,52.3 L87.5,48.2 L93.5,47.5 Z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M244,142 L246,146.5 L251,147 L247.3,150.3 L248.3,155.2 L244,152.7 L239.7,155.2 L240.7,150.3 L237,147 L242,146.5 Z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M326,232 L328.2,237 L333.6,237.6 L329.5,241.3 L330.7,246.6 L326,243.9 L321.3,246.6 L322.5,241.3 L318.4,237.6 L323.8,237 Z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <path
              d="M24,226 L25.8,230 L30.2,230.5 L26.9,233.5 L27.8,237.8 L24,235.6 L20.2,237.8 L21.1,233.5 L17.8,230.5 L22.2,230 Z"
              fill="#ffffff"
              opacity="0.55"
            />
            <circle cx="256" cy="56" r="2.6" fill="#ffffff" opacity="0.6" />
            <circle cx="144" cy="126" r="2.2" fill="#ffffff" opacity="0.55" />
            <circle cx="236" cy="316" r="2.8" fill="#ffffff" opacity="0.55" />
            <circle cx="76" cy="242" r="2.2" fill="#ffffff" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#edu-doodle-pattern)" />
      </svg>
    </div>
  );
};
