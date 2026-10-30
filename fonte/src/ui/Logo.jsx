export default function Logo({ className = "h-9 w-9" }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#logo-g)" />
      <path d="M17 30.5 32 18l15 12.5V46a3 3 0 0 1-3 3H20a3 3 0 0 1-3-3z" fill="#fff" />
      <circle cx="32" cy="38" r="5.5" fill="#10b981" />
      <path d="M32 35.5v5M30 38h4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
