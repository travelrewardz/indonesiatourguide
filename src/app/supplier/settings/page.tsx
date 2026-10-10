import SupplierProfileForm from "@/components/SupplierProfileForm";
import { getSessionUser } from "@/lib/auth";
import { get } from "@/lib/db";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SupplierSettingsPage() {
  const user = (await getSessionUser())!;
  const supplier = get<{
    company_name: string;
    contact_person: string;
    email: string;
    phone: string | null;
    address: string | null;
    preferred_currency: string;
  }>(
    "SELECT company_name, contact_person, email, phone, address, preferred_currency FROM suppliers WHERE user_id = ?",
    user.id,
  );
  if (!supplier) redirect("/supplier");

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-medium">Profile settings</h2>
        <p className="mt-1 text-sm text-gray-500">
          Your preferred currency is used automatically as the pricing currency for tours you create.
        </p>
      </div>
      <SupplierProfileForm supplier={supplier} />
    </div>
  );
}
