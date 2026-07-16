// Admin email — used server-side to identify the superadmin.
// ADMIN_EMAIL (no NEXT_PUBLIC_) is preferred for server/API routes as it is reliably available.
// NEXT_PUBLIC_ADMIN_EMAIL is the fallback for client-side contexts.
export const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL ||
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
  ''
).toLowerCase().trim();

