import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

/** Turn known Prisma errors into friendly HTTP responses. */
export function handle(e: unknown) {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return fail("That receipt number is already used. Change the receipt number.", 409);
    if (e.code === "P2025") return fail("Record not found. It may have been deleted.", 404);
    if (e.code === "P2003") return fail("This record is still referenced by receipts.", 409);
  }
  console.error(e);
  return fail("Something went wrong on the server.", 500);
}

export async function readJson<T>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T;
  } catch {
    return null;
  }
}

export const str = (v: unknown) => String(v ?? "").trim();
