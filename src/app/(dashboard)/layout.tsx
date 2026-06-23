import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  try {
    user = await requireUser();
  } catch (error) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar Navigation */}
      <Sidebar user={{ name: user.name, email: user.email, avatarUrl: user.avatarUrl }} />

      {/* Main Content Area */}
      <main className="flex-1 lg:pl-64 min-w-0">
        <div className="p-6 lg:p-10 max-w-7xl mx-auto min-h-screen flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
