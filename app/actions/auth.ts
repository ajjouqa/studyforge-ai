"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AUTH_COOKIE, checkPassword, createToken } from "@/lib/auth";

export type LoginState = { error?: string };

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = String(formData.get("password") ?? "");
  if (!checkPassword(password)) {
    return { error: "Incorrect password." };
  }
  const token = await createToken();
  const store = await cookies();
  store.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/courses");
}

export async function logout() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
  redirect("/login");
}
