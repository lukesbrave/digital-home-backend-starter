/**
 * One-time script to create an admin user in Supabase Auth.
 * Usage: npx tsx scripts/create-user.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("Run with: npx tsx --env-file=.env.local scripts/create-user.ts");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL = process.argv[3] || "admin@yourdomain.com";
const PASSWORD = process.argv[2];

if (!PASSWORD) {
  console.error("Usage: npx tsx --env-file=.env.local scripts/create-user.ts <password>");
  process.exit(1);
}

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });

  if (error) {
    console.error("Failed to create user:", error.message);
    process.exit(1);
  }

  console.log(`User created: ${data.user.email} (${data.user.id})`);
}

main();
