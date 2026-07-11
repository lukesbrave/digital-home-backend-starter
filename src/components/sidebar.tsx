'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV_ITEMS = [
  {
    href: '/content',
    label: 'Content',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 256 256" fill="currentColor">
        <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40ZM40,56H216V96H40ZM40,200V112H216v88Z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Leads',
    disabled: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 256 256" fill="currentColor">
        <path d="M230.92,212c-15.23-26.33-38.7-45.21-66.09-54.16a72,72,0,1,0-73.66,0C63.78,166.78,40.31,185.66,25.08,212a8,8,0,1,0,13.85,8C55.71,192.47,78.63,176,128,176s72.29,16.47,89.07,44a8,8,0,1,0,13.85-8ZM72,96a56,56,0,1,1,56,56A56.06,56.06,0,0,1,72,96Z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Email',
    disabled: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 256 256" fill="currentColor">
        <path d="M224,48H32a8,8,0,0,0-8,8V192a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A8,8,0,0,0,224,48ZM203.43,64,128,133.15,52.57,64ZM216,192H40V74.19l82.59,75.71a8,8,0,0,0,10.82,0L216,74.19V192Z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Stats',
    disabled: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 256 256" fill="currentColor">
        <path d="M224,200h-8V40a8,8,0,0,0-8-8H152a8,8,0,0,0-8,8V80H96a8,8,0,0,0-8,8v40H48a8,8,0,0,0-8,8v64H24a8,8,0,0,0,0,16H224a8,8,0,0,0,0-16ZM160,48h40V200H160ZM104,96h40V200H104ZM56,144H88v56H56Z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Agents',
    disabled: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 256 256" fill="currentColor">
        <path d="M200,48H136V16a8,8,0,0,0-16,0V48H56A32,32,0,0,0,24,80V192a32,32,0,0,0,32,32H200a32,32,0,0,0,32-32V80A32,32,0,0,0,200,48Zm16,144a16,16,0,0,1-16,16H56a16,16,0,0,1-16-16V80A16,16,0,0,1,56,64H200a16,16,0,0,1,16,16ZM104,120a12,12,0,1,1-12-12A12,12,0,0,1,104,120Zm72,0a12,12,0,1,1-12-12A12,12,0,0,1,176,120Zm-24,36H104a8,8,0,0,0,0,16h48a8,8,0,0,0,0-16Z" />
      </svg>
    ),
  },
  {
    href: '#',
    label: 'Graph',
    disabled: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 256 256" fill="currentColor">
        <path d="M200,152a31.84,31.84,0,0,0-19.53,6.68l-23.11-18A31.65,31.65,0,0,0,160,128a31.65,31.65,0,0,0-2.64-12.68l23.11-18A31.84,31.84,0,0,0,200,104a32,32,0,1,0-32-32,31.65,31.65,0,0,0,2.64,12.68l-23.11,18A31.84,31.84,0,0,0,128,96a31.84,31.84,0,0,0-19.53,6.68l-23.11-18A31.65,31.65,0,0,0,88,72a32,32,0,1,0-32,32,31.84,31.84,0,0,0,19.53-6.68l23.11,18A31.65,31.65,0,0,0,96,128a31.65,31.65,0,0,0,2.64,12.68l-23.11,18A31.84,31.84,0,0,0,56,152a32,32,0,1,0,32,32,31.65,31.65,0,0,0-2.64-12.68l23.11-18A31.84,31.84,0,0,0,128,160a31.84,31.84,0,0,0,19.53-6.68l23.11,18A31.65,31.65,0,0,0,168,184a32,32,0,1,0,32-32ZM200,56a16,16,0,1,1-16,16A16,16,0,0,1,200,56ZM56,88A16,16,0,1,1,72,72,16,16,0,0,1,56,88Zm0,112a16,16,0,1,1,16-16A16,16,0,0,1,56,200Zm72-56a16,16,0,1,1,16-16A16,16,0,0,1,128,144Zm72,56a16,16,0,1,1,16-16A16,16,0,0,1,200,200Z" />
      </svg>
    ),
  },
];

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(!document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !light;
    setLight(next);
    document.documentElement.classList.toggle('dark', !next);
    try {
      localStorage.setItem('dh-theme', next ? 'light' : 'dark');
    } catch {}
  };

  return (
    <button
      onClick={toggle}
      title={light ? 'Switch to dark mode' : 'Switch to light mode'}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-minimal-muted hover:text-white hover:bg-minimal-row transition-colors w-full ${
        collapsed ? 'justify-center' : ''
      }`}
    >
      {light ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 256 256" fill="currentColor">
          <path d="M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 256 256" fill="currentColor">
          <path d="M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z" />
        </svg>
      )}
      {!collapsed && <span className="text-[14px] font-medium">{light ? 'Dark mode' : 'Light mode'}</span>}
    </button>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem('dh-sidebar') === 'collapsed');
    } catch {}
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem('dh-sidebar', next ? 'collapsed' : 'expanded');
    } catch {}
  };

  // Don't show sidebar on login page
  if (pathname === '/login') return null;

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-60'} shrink-0 border-r border-minimal-border flex flex-col py-4 transition-[width] duration-200`}
    >
      {/* Wordmark + collapse toggle */}
      <div className={`flex items-center px-3 mb-6 ${collapsed ? 'flex-col gap-3' : 'justify-between'}`}>
        <Link href="/content" className="flex items-center gap-2.5 px-1.5" title="Brave — Digital Home">
          <span className="w-6 h-6 rounded-md bg-white text-black text-[11px] font-bold flex items-center justify-center shrink-0">
            B
          </span>
          {!collapsed && <span className="text-[14px] font-semibold text-white">Brave</span>}
        </Link>
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="text-minimal-muted hover:text-white p-1.5 rounded-md hover:bg-minimal-row transition-colors"
        >
          {collapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
              <path d="M181.66,133.66l-80,80a8,8,0,0,1-11.32-11.32L164.69,128,90.34,53.66a8,8,0,0,1,11.32-11.32l80,80A8,8,0,0,1,181.66,133.66Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 256 256" fill="currentColor">
              <path d="M165.66,202.34a8,8,0,0,1-11.32,11.32l-80-80a8,8,0,0,1,0-11.32l80-80a8,8,0,0,1,11.32,11.32L91.31,128Z" />
            </svg>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 px-3 flex-1">
        {NAV_ITEMS.map((item) => {
          if (item.disabled) {
            return (
              <div
                key={item.label}
                title={collapsed ? `${item.label} (coming soon)` : 'Coming soon'}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-minimal-muted opacity-40 cursor-default select-none ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                {item.icon}
                {!collapsed && <span className="text-[14px] font-medium">{item.label}</span>}
              </div>
            );
          }

          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.label}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                collapsed ? 'justify-center' : ''
              } ${
                isActive
                  ? 'bg-minimal-row text-white'
                  : 'text-minimal-muted hover:text-white hover:bg-minimal-row'
              }`}
            >
              {item.icon}
              {!collapsed && <span className="text-[14px] font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Theme + version */}
      <div className="px-3 flex flex-col gap-1">
        <ThemeToggle collapsed={collapsed} />
        {!collapsed && <div className="px-3 py-1 text-xs text-zinc-600">v0.2</div>}
      </div>
    </aside>
  );
}
