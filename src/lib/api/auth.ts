import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type AuthResult =
  | { authenticated: true; mode: "session"; userId: string }
  | { authenticated: true; mode: "api-key"; agent: string }
  | { authenticated: false; error: string };

function validateApiKey(key: string): AuthResult {
  if (key === process.env.API_SECRET_KEY) {
    return { authenticated: true, mode: "api-key", agent: "master" };
  }

  const agentKeys: Record<string, string | undefined> = {
    content_agent: process.env.CONTENT_AGENT_API_KEY,
    seo_agent: process.env.SEO_AGENT_API_KEY,
    analytics_agent: process.env.ANALYTICS_AGENT_API_KEY,
    email_agent: process.env.EMAIL_AGENT_API_KEY,
    openclawd: process.env.OPENCLAWD_API_KEY,
  };

  for (const [agent, agentKey] of Object.entries(agentKeys)) {
    if (agentKey && key === agentKey) {
      return { authenticated: true, mode: "api-key", agent };
    }
  }

  return { authenticated: false, error: "Invalid API key" };
}

async function validateSession(): Promise<AuthResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { authenticated: false, error: "Not authenticated" };
    }

    return { authenticated: true, mode: "session", userId: user.id };
  } catch {
    return { authenticated: false, error: "Session validation failed" };
  }
}

export async function authenticateSession(
  _request: NextRequest
): Promise<AuthResult> {
  void _request;
  return validateSession();
}

export async function authenticateSessionOrApiKey(
  request: NextRequest
): Promise<AuthResult> {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey) {
    return validateApiKey(apiKey);
  }

  return validateSession();
}

export function unauthorizedResponse(error: string = "Unauthorized") {
  return Response.json({ error }, { status: 401 });
}
