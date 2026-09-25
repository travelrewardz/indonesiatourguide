import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionPartner } from "@/lib/session";

export const metadata = { title: "Become a Partner" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const partner = await getSessionPartner();
  if (partner) redirect("/partners/dashboard");
  const sp = await searchParams;

  return (
    <div className="py-16">
      <div className="mx-auto max-w-xl px-4">
        <div className="text-center">
          <h1 className="text-3xl font-black tracking-tight">
            Create your trade account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            For licensed travel agencies, tour operators and corporate travel
            buyers. Approvals typically within one business day.
          </p>
        </div>

        <form action="/api/partners/register" method="post" className="card mt-8 p-7">
          {sp.error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {sp.error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="companyName">Company name *</label>
              <input id="companyName" name="companyName" required className="input" placeholder="Atlas Tours Ltd" />
            </div>
            <div>
              <label className="label" htmlFor="contactName">Contact name *</label>
              <input id="contactName" name="contactName" required className="input" placeholder="Jane Doe" />
            </div>
            <div>
              <label className="label" htmlFor="email">Work email *</label>
              <input id="email" name="email" type="email" required className="input" placeholder="jane@agency.com" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password * (min 8 chars)</label>
              <input id="password" name="password" type="password" required minLength={8} className="input" placeholder="••••••••" />
            </div>
            <div>
              <label className="label" htmlFor="country">Country *</label>
              <input id="country" name="country" required className="input" placeholder="Spain" />
            </div>
            <div>
              <label className="label" htmlFor="phone">Phone / WhatsApp</label>
              <input id="phone" name="phone" className="input" placeholder="+34 ..." />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="website">Website</label>
              <input id="website" name="website" className="input" placeholder="https://..." />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-6 w-full">
            Request trade account
          </button>
          <p className="mt-5 text-center text-sm text-gray-600">
            Already registered?{" "}
            <Link href="/partners/login" className="font-semibold text-brand-600 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
