"use client";

import { useActionState } from "react";
import { updateSupplierProfileAction } from "@/lib/actions";

// Mirrors SUPPORTED_CURRENCIES in lib/currency (kept literal here so this
// client component never imports the server-only db-backed currency module).
const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "SGD", "IDR"];

export default function SupplierProfileForm({
  supplier,
}: {
  supplier: {
    company_name: string;
    contact_person: string;
    email: string;
    phone: string | null;
    address: string | null;
    preferred_currency: string;
  };
}) {
  const [state, action, pending] = useActionState(updateSupplierProfileAction, {});

  return (
    <form action={action} className="card p-6">
      <h2 className="font-bold">Profile settings</h2>
      <div className="mt-4 space-y-4">
        <div>
          <label className="label" htmlFor="sp-company">Company name</label>
          <input id="sp-company" name="company_name" required minLength={2} defaultValue={supplier.company_name} className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="sp-contact">Contact person</label>
            <input id="sp-contact" name="contact_person" required minLength={2} defaultValue={supplier.contact_person} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="sp-email">Contact email</label>
            <input id="sp-email" name="email" type="email" required defaultValue={supplier.email} className="input" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="sp-phone">Phone</label>
            <input id="sp-phone" name="phone" defaultValue={supplier.phone ?? ""} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="sp-currency">Preferred currency</label>
            <select id="sp-currency" name="preferred_currency" defaultValue={supplier.preferred_currency} className="input">
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-400">
              Applied automatically as the pricing currency when you create tours.
            </p>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="sp-address">Address</label>
          <textarea id="sp-address" name="address" rows={2} defaultValue={supplier.address ?? ""} className="input" />
        </div>
      </div>
      {state.error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.ok && <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">Profile saved.</p>}
      <button type="submit" disabled={pending} className="btn-primary mt-4">
        {pending ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
