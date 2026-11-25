import type { SVGProps } from 'react';

/** Minimal stroke icons (16px, currentColor). */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const SunIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Icon>
);

export const MoonIcon = () => (
  <Icon>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
  </Icon>
);

export const UploadIcon = () => (
  <Icon>
    <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </Icon>
);

export const DownloadIcon = () => (
  <Icon>
    <path d="M12 4v12M7 11l5 5 5-5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </Icon>
);

export const CloseIcon = () => (
  <Icon>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const CheckIcon = () => (
  <Icon strokeWidth="2.4">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

export const AlertIcon = () => (
  <Icon strokeWidth="2.2">
    <path d="M12 8v5M12 16.5v.01" />
  </Icon>
);

export const FileIcon = () => (
  <Icon>
    <path d="M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7z" />
    <path d="M14 3v4h4M9 13h6M9 17h4" />
  </Icon>
);

export const LogoMark = () => (
  <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
    <rect width="32" height="32" rx="8" fill="currentColor" />
    <rect x="8" y="16" width="4" height="9" rx="1" fill="var(--surface)" />
    <rect x="14" y="11" width="4" height="14" rx="1" fill="var(--surface)" />
    <rect x="20" y="7" width="4" height="18" rx="1" fill="var(--surface)" />
  </svg>
);
