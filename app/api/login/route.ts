import { cookies } from "next/headers";
import { SESSION_COOKIE, createSession, passwordMatches } from "@/lib/auth";
import { fail, ok, readJson } from "@/lib/api";

export async function POST(req: Request) {
  const body = await readJson<{ password?: string }>(req);
  if (!process.env.ADMIN_PASSWORD) return fail("ADMIN_PASSWORD is not set on the server.", 500);
  if (!body?.password || !passwordMatches(body.password)) {
    await new Promise((r) => setTimeout(r, 600)); // slow down guessing
    return fail("That password isn't right.", 401);
  }
  const { token, maxAge } = await createSession();
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return ok({ ok: true });
}
