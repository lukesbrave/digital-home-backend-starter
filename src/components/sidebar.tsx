'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/content',
    label: 'Content',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
        <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216V96H40ZM40,200V112H216v88Z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Leads',
    disabled: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
        <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8C55.71,192.47,78.63,176,128,176s72.29,16.47,89.07,44a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Email',
    disabled: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
        <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Stats',
    disabled: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
        <path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H24a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Agents',
    disabled: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
        <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16ZM104,120a12,12,0,1,1-12-12A12,12,0,0,1,104,120Zm72,0a12,12,0,1,1-12-12A12,12,0,0,1,176,120Zm-24,36H104a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Graph',
    disabled: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 256 256" fill="currentColor">
        <path d="M200,152a31.84,31.84,0,0,0-19.53,6.68l-23.11-18A31.65,31.65,0,0,0,160,128a31.65,31.65,0,0,0-2.64-12.68l23.11-18A31.84,31.84,0,0,0,200,104a32,32,0,1,0-32-32,31.65,31.65,0,0,0,2.64,12.68l-23.11,18A31.84,31.84,0,0,0,128,96a31.84,31.84,0,0,0-19.53,6.68l-23.11-18A31.65,31.65,0,0,0,88,72a32,32,0,1,0-32,32,31.84,31.84,0,0,0,19.53-6.68l23.11,18A31.65,31.65,0,0,0,96,128a31.65,31.65,0,0,0,2.64,12.68l-23.11,18A31.84,31.84,0,0,0,56,152a32,32,0,1,0,32,32,31.65,31.65,0,0,0-2.64-12.68l23.11-18A31.84,31.84,0,0,0,128,160a31.84,31.84,0,0,0,19.53-6.68l23.11,18A31.65,31.65,0,0,0,168,184a32,32,0,1,0,32-32ZM200,56a16,16,0,1,1-16,16A16,16,0,0,1,200,56ZM56,88A16,16,0,1,1,72,72,16,16,0,0,1,56,88Zm0,112a16,16,0,1,1,16-16A16,16,0,0,1,56,200Zm72-56a16,16,0,1,1,16-16A16,16,0,0,1,128,144Zm72,56a16,16,0,1,1,16-16A16,16,0,0,1,200,200Z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();

  // Don't show sidebar on login page
  if (pathname === '/login') return null;

  return (
    <aside className="w-20 shrink-0 border-r border-minimal-border flex flex-col items-center py-6 gap-8">
      {/* Logo */}
      <div className="flex items-center justify-center mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
          Brave
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-6 flex-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname?.startsWith(item.href) && item.href !== '#';
          const isDisabled = item.disabled;

          return (
            <Link
              key={item.label}
              href={isDisabled ? '#' : item.href}
              className={`flex flex-col items-center gap-1.5 transition-colors ${
                isActive
                  ? 'text-white'
                  : isDisabled
                  ? 'cursor-default opacity-35'
                  : 'text-minimal-muted hover:text-white'
              }`}
              onClick={isDisabled ? (e) => e.preventDefault() : undefined}
            >
              {item.icon}
              <span className="text-[9px] font-medium uppercase tracking-[0.15em]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Version */}
      <div className="text-[8px] text-minimal-muted uppercase tracking-widest">
        v0.1
      </div>
    </aside>
  );
}
