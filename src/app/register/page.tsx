import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import RegisterForm from "@/components/RegisterForm";
import { getSessionUser } from "@/lib/auth";
import { buildMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Create your account",
  description: "Register as a traveller, travel agency or tour operator on Indonesia Tour Guide.",
  path: "/register",
  noIndex: true,
});

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/account");

  return (
    <div className="bg-gray-50 py-14">
      <div className="container-x max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="font-display text-3xl font-medium">Join Indonesia Tour Guide</h1>
          <p className="mt-1 text-sm text-gray-600">One account — booking, vouchers, net rates or operator tools.</p>
        </div>
        <Suspense>
          <RegisterForm />
        </Suspense>
        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account? <Link href="/login" className="font-medium text-brand-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
