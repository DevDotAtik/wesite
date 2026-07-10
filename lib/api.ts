import mongoose from "mongoose";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { getAuthUser } from "@/lib/auth";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400, details?: unknown) {
  return json({ error: message, details }, status);
}

export async function parseBody<T>(request: Request, schema: ZodSchema<T>) {
  try {
    const body = await request.json();
    return { data: schema.parse(body), error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return { data: null, error: apiError("Invalid request body", 422, error.flatten()) };
    }

    return { data: null, error: apiError("Invalid JSON body", 400) };
  }
}

export async function requireUser(request: NextRequest) {
  const user = await getAuthUser(request);

  if (!user) {
    return { user: null, response: apiError("Unauthorized", 401) };
  }

  return { user, response: null };
}

export function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export function serializeDocument<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
