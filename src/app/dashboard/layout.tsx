import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import DashboardShell from "./DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?redirect=/dashboard");

  return (
    <DashboardShell
      userName={session.userName}
      tenantName={session.tenantName}
    >
      {children}
    </DashboardShell>
  );
}
