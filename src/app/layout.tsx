import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Digital Home Platform',
  description: 'The operating system for your digital presence.',
  robots: 'noindex, nofollow',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Sidebar */}
          <aside
            style={{
              width: '240px',
              borderRight: '1px solid #1a1a1a',
              padding: '1.5rem 0',
              flexShrink: 0,
            }}
          >
            {/* Logo */}
            <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#f5f0e8',
                }}
              >
                Digital Home
              </div>
              <div
                style={{
                  fontSize: '0.6rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: '#555',
                  marginTop: '0.15rem',
                }}
              >
                Platform
              </div>
            </div>

            {/* Nav */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <NavItem href="/content" label="Content Pipeline" active />
              <NavItem href="#" label="Leads" disabled />
              <NavItem href="#" label="Email Sequences" disabled />
              <NavItem href="#" label="Analytics" disabled />
              <NavItem href="#" label="Agents" disabled />
              <NavItem href="#" label="Knowledge Graph" disabled />
            </nav>

            {/* Footer */}
            <div
              style={{
                position: 'absolute',
                bottom: '1.5rem',
                left: 0,
                width: '240px',
                padding: '0 1.5rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.65rem',
                  color: '#444',
                  borderTop: '1px solid #1a1a1a',
                  paddingTop: '1rem',
                }}
              >
                Digital Home Platform v0.1
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main style={{ flex: 1, overflow: 'auto' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

function NavItem({
  href,
  label,
  active = false,
  disabled = false,
}: {
  href: string;
  label: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <a
      href={disabled ? undefined : href}
      style={{
        display: 'block',
        padding: '0.5rem 1.5rem',
        fontSize: '0.8rem',
        color: disabled ? '#333' : active ? '#f5f0e8' : '#888',
        background: active ? '#ffffff08' : 'transparent',
        borderLeft: active ? '2px solid #c084fc' : '2px solid transparent',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {label}
      {disabled && (
        <span
          style={{
            marginLeft: '0.5rem',
            fontSize: '0.6rem',
            color: '#333',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          soon
        </span>
      )}
    </a>
  );
}
