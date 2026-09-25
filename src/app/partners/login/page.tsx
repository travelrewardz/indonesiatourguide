import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionPartner } from "@/lib/session";

export const metadata = { title: "Partner Login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const partner = await getSessionPartner();
  if (partner) redirect("/partners/dashboard");
  const sp = await searchParams;

  return (
    <div className="py-16">
      <div className="mx-auto max-w-md px-4">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight">
            Partner portal login
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Net rates, quotes and bookings for registered trade partners.
          </p>
        </div>

        <form action="/api/partners/login" method="post" className="card mt-8 p-7">
          {sp.registered && (
            <div className="mb-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
              Account created — you can sign in now.
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Work email</label>
            <input id="email" name="email" type="email" required className="input" placeholder="you@agency.com" />
          </div>
          <div className="mt-4">
            <label className="label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required className="input" placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-primary mt-6 w-full">
            Sign in
          </button>
          <p className="mt-5 text-center text-sm text-gray-600">
            No trade account yet?{" "}
            <Link href="/partners/register" className="font-semibold text-brand-600 hover:underline">
              Register your agency
            </Link>
          </p>
        </form>

        <div className="card mt-6 bg-sand-50 p-5 text-sm text-gray-600">
          <div className="font-semibold text-gray-800">Demo accounts</div>
          <div className="mt-2 space-y-1 font-mono text-xs">
            <div>demo@wisataagencies.com · demo1234 (Gold, 20%)</div>
            <div>maria@atlastours.es · demo1234 (Silver, 15%)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
