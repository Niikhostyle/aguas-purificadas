import { redirect } from "next/navigation";
import { LandingNav } from "@/components/admin/landing/landing-nav";
import { requireSuperAdmin } from "@/lib/auth";

export default async function LandingAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireSuperAdmin();
  if (!admin) redirect("/admin/login?tenant=plataforma");

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <LandingNav />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
