import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient } from "@/lib/supabase/server";

export type AuthResult =
  | { authenticated: true; mode: "session"; userId: string }
  | { authenticated: true; mode: "api-key"; agent: string }
  | { authenticated: false; error: string };

const DEFAULT_SIGNATURE_TTL_SECONDS = 300;

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

function getSignatureTtlSeconds(): number {
  const raw = Number(process.env.API_REQUEST_SIGNATURE_TTL_SECONDS || DEFAULT_SIGNATURE_TTL_SECONDS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_SIGNATURE_TTL_SECONDS;
}

function signaturesMatch(expected: string, actual: string): boolean {
  const normalizedActual = actual.replace(/^sha256=/, "").trim().toLowerCase();
  const normalizedExpected = expected.trim().toLowerCase();

  if (!normalizedActual || normalizedActual.length !== normalizedExpected.length) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(normalizedExpected, "utf8"),
    Buffer.from(normalizedActual, "utf8")
  );
}

async function validateApiSignature(request: NextRequest): Promise<AuthResult> {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return { authenticated: false, error: "Missing x-api-key" };
  }

  const keyValidation = validateApiKey(apiKey);
  if (!keyValidation.authenticated) {
    return keyValidation;
  }

  const signatureRequired = (process.env.API_SIGNATURE_REQUIRED || "true").toLowerCase() !== "false";
  if (!signatureRequired) {
    return keyValidation;
  }

  const timestamp = request.headers.get("x-timestamp");
  const signature = request.headers.get("x-signature");

  if (!timestamp || !signature) {
    return {
      authenticated: false,
      error: "Missing x-timestamp or x-signature for machine request",
    };
  }

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return { authenticated: false, error: "Invalid x-timestamp" };
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const maxAge = getSignatureTtlSeconds();
  if (Math.abs(nowSeconds - timestampSeconds) > maxAge) {
    return { authenticated: false, error: "Expired x-timestamp" };
  }

  const signingSecret = process.env.API_REQUEST_SIGNING_SECRET || process.env.API_SECRET_KEY;
  if (!signingSecret) {
    return { authenticated: false, error: "API request signing secret is not configured" };
  }

  const bodyText = await request.clone().text();
  const pathname = new URL(request.url).pathname;
  const signingPayload = [
    request.method.toUpperCase(),
    pathname,
    timestamp,
    bodyText,
  ].join(":");

  const expectedSignature = createHmac("sha256", signingSecret)
    .update(signingPayload)
    .digest("hex");

  if (!signaturesMatch(expectedSignature, signature)) {
    return { authenticated: false, error: "Invalid x-signature" };
  }

  return keyValidation;
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
    return validateApiSignature(request);
  }

  return validateSession();
}

export function unauthorizedResponse(error: string = "Unauthorized") {
  return Response.json({ error }, { status: 401 });
}
