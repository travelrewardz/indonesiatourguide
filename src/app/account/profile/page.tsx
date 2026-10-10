import ProfileForms from "@/components/ProfileForms";
import { getSessionUser } from "@/lib/auth";
import { get } from "@/lib/db";
import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = (await getSessionUser())!;
  const user = get<User>("SELECT * FROM users WHERE id = ?", session.id)!;

  return (
    <div>
      <h2 className="font-display mb-4 text-xl font-medium">Profile settings</h2>
      <ProfileForms
        user={{
          name: user.name,
          email: user.email,
          phone: user.phone,
          country: user.country,
          preferred_language: user.preferred_language,
        }}
      />
    </div>
  );
}
