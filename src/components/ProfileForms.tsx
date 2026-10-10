"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction } from "@/lib/actions";

const LANGS = ["en", "es", "fr", "de", "it", "nl", "id"];

export default function ProfileForms({ user }: { user: { name: string; email: string; phone: string | null; country: string | null; preferred_language: string } }) {
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, {});
  const [pwState, pwAction, pwPending] = useActionState(changePasswordAction, {});

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={profileAction} className="card p-6">
        <h2 className="font-bold">Profile</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="pf-name">Name</label>
            <input id="pf-name" name="name" required defaultValue={user.name} className="input" />
          </div>
          <div>
            <label className="label" htmlFor="pf-email">Email</label>
            <input id="pf-email" value={user.email} disabled className="input bg-gray-50" />
            <p className="mt-1 text-xs text-gray-400">Email changes require verification — contact support.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="pf-phone">Phone</label>
              <input id="pf-phone" name="phone" defaultValue={user.phone ?? ""} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="pf-country">Country</label>
              <input id="pf-country" name="country" defaultValue={user.country ?? ""} className="input" />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="pf-lang">Preferred language</label>
            <select id="pf-lang" name="preferred_language" defaultValue={user.preferred_language} className="input">
              {LANGS.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
        {profileState.error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{profileState.error}</p>}
        {profileState.ok && <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">Profile saved.</p>}
        <button type="submit" disabled={profilePending} className="btn-primary mt-4">
          {profilePending ? "Saving…" : "Save changes"}
        </button>
      </form>

      <form action={pwAction} className="card p-6">
        <h2 className="font-bold">Change password</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label" htmlFor="pw-current">Current password</label>
            <input id="pw-current" name="current" type="password" required autoComplete="current-password" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="pw-next">New password</label>
            <input id="pw-next" name="next" type="password" required minLength={8} autoComplete="new-password" className="input" />
          </div>
        </div>
        {pwState.error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{pwState.error}</p>}
        {pwState.ok && <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">Password updated.</p>}
        <button type="submit" disabled={pwPending} className="btn-outline mt-4">
          {pwPending ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
