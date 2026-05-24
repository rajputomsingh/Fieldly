// app/(protected)/admin/layout.tsx

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { requireAdmin } from "@/lib/server/admin-guard";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./_components/AdminSidebar";
import { AdminDockProvider } from "./_components/AdminDockContext";
import { AdminMainContent } from "./_components/AdminMainContent";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let admin;
  
  try {
    admin = await requireAdmin();
  } catch {
    redirect("/");
  }

  if (!admin) {
    redirect("/");
  }

  return (
    <AdminDockProvider>
      <div className="min-h-screen">
        <AdminSidebar adminRole={admin.role} />
        <AdminMainContent>
          <div className="p-4 lg:p-8 pt-20">
            {children}
          </div>
        </AdminMainContent>
      </div>
    </AdminDockProvider>
  );
}