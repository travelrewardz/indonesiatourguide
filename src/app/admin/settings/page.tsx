import { all } from "@/lib/db";
import { updateSettingsAction } from "@/lib/actions";

export const dynamic = "force-dynamic";

const FIELDS: { key: string; label: string; type?: string }[] = [
  { key: "company_name", label: "Company name" },
  { key: "contact_email", label: "Contact email", type: "email" },
  { key: "contact_phone", label: "Contact phone" },
  { key: "whatsapp_number", label: "WhatsApp number (digits only, e.g. 6281234567890)" },
  { key: "address", label: "Address" },
  { key: "instagram", label: "Instagram URL" },
  { key: "facebook", label: "Facebook URL" },
  { key: "license", label: "Operating licence" },
];

export default function AdminSettingsPage() {
  const rows = all<{ key: string; value: string }>("SELECT key, value FROM settings");
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Site-wide contact details used across pages, emails and vouchers.</p>
      </div>

      <form action={updateSettingsAction} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.key === "address" ? "sm:col-span-2" : ""}>
              <label className="label">{f.label}</label>
              <input name={f.key} type={f.type ?? "text"} defaultValue={map.get(f.key) ?? ""} className="input" />
            </div>
          ))}
        </div>
        <button type="submit" className="btn-primary">Save settings</button>
      </form>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-bold">Payment configuration</h2>
        <p className="mt-1 text-sm text-gray-600">
          Providers are configured through environment variables (never in the database or code):
        </p>
        <ul className="mt-3 space-y-1 font-mono text-xs text-gray-600">
          <li>PAYMENT_PROVIDER = sandbox | midtrans | bank_transfer</li>
          <li>MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY / MIDTRANS_SANDBOX</li>
          <li>PAYMENT_WEBHOOK_SECRET</li>
          <li>SMTP_HOST / SMTP_USER / SMTP_PASSWORD (transactional email)</li>
          <li>AUTH_SECRET, NEXT_PUBLIC_SITE_URL</li>
        </ul>
        <p className="mt-3 text-xs text-gray-500">See .env.example and docs/deployment.md for the full list.</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="font-bold">FX rates (display only)</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-3 py-2">Currency</th><th className="px-3 py-2">Rate to USD</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {all<{ currency: string; rate_to_usd: number }>("SELECT currency, rate_to_usd FROM fx_rates ORDER BY rate_to_usd DESC").map((r) => (
              <tr key={r.currency}><td className="px-3 py-2 font-medium">{r.currency}</td><td className="px-3 py-2">{r.rate_to_usd}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-gray-500">
          Bookings are always charged in USD server-side; other currencies are display-only.
        </p>
      </div>
    </div>
  );
}
