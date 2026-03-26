'use client';

/**
 * Auto-rotating emerald glow border for cards in the "writing" state.
 * Place inside a relative-positioned parent with rounded-lg.
 */
export function WritingGlow() {
  return (
    <div
      className="writing-glow-border pointer-events-none absolute inset-0 rounded-[inherit]"
      aria-hidden="true"
    />
  );
}
