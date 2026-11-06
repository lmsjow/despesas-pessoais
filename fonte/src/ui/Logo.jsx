import { useId } from "react";

export default function Logo({ className = "h-9 w-9" }) {
  // ids únicos: várias cópias do logo na página (algumas ocultas) não podem compartilhar o degradê
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#27272a" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6ee7b7" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill={`url(#${id}f)`} />
      <rect x=".75" y=".75" width="62.5" height="62.5" rx="15.25" fill="none" stroke="#fff" strokeOpacity=".12" strokeWidth="1.5" />
      <path d="M18 31 32 19.5 46 31v14.5a2.5 2.5 0 0 1-2.5 2.5h-23A2.5 2.5 0 0 1 18 45.5z" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinejoin="round" />
      <circle cx="32" cy="38.5" r="4.6" fill={`url(#${id}b)`} />
    </svg>
  );
}
