import { requirePhotographer } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requirePhotographer();
  } catch {
    redirect("/");
  }

  return (
    <div className="dashboard-dark flex min-h-screen text-white">
      {/* Sidebar Navigation */}
      <Sidebar user={{ name: user.name, email: user.email, avatarUrl: user.avatarUrl }} />

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 min-w-0">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-8 pt-20 sm:px-6 lg:px-10 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
