// Restore Body.json() to Promise<any> behavior.
//
// @types/node@>=20.15 ships undici-types which narrows the Web Body.json()
// signature to Promise<unknown>. Many existing patterns (await req.json() into
// a destructured object, await res.json() then access .data) were written
// against the original Promise<any> signature. Re-widening here keeps the
// starter ergonomic without forcing every caller to thread types through.
//
// Callers who want stricter typing can still opt in with `as Type` casts.

export {};

declare global {
  interface Body {
    json(): Promise<any>;
  }
}
