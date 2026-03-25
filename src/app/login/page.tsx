'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = '/content';
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#0a0a0a',
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: '100%',
          maxWidth: '360px',
          padding: '2.5rem',
        }}
      >
        <div style={{ marginBottom: '2rem' }}>
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

        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="email"
            style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              background: '#111',
              border: '1px solid #222',
              borderRadius: '4px',
              color: '#f5f0e8',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="password"
            style={{ display: 'block', fontSize: '0.7rem', color: '#888', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              background: '#111',
              border: '1px solid #222',
              borderRadius: '4px',
              color: '#f5f0e8',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.75rem', marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.6rem',
            background: loading ? '#222' : '#f5f0e8',
            color: loading ? '#555' : '#0a0a0a',
            border: 'none',
            borderRadius: '4px',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
