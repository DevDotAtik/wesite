import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Wesite bookmark library.",
};

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
