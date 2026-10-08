import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";
import { getSessionUser } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Sign in",
  description: "Sign in to your Indonesia Tour Guide account to manage bookings, vouchers and profile.",
  path: "/login",
  noIndex: true,
});

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect("/account");

  return (
    <div className="bg-gray-50 py-14">
      <div className="container-x max-w-md">
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-medium">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-600">Sign in to manage your bookings and vouchers.</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-gray-500">
          New here? <Link href="/register" className="font-medium text-brand-600 hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
