import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== "MANAGER") {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h2 className="text-xl font-bold">Cafe Admin</h2>
          <p className="text-sm text-gray-400">Welcome, {session.name}</p>
        </div>
        <nav className="mt-6">
          <Link
            href="/admin"
            className="block px-6 py-3 transition hover:bg-gray-800"
            prefetch={false}
          >
            Dashboard
          </Link>
          <Link
            href="/admin/menu"
            className="block px-6 py-3 transition hover:bg-gray-800"
            prefetch={false}
          >
            Menu Management
          </Link>
          <Link
            href="/admin/orders"
            className="block px-6 py-3 transition hover:bg-gray-800"
            prefetch={false}
          >
            Orders History
          </Link>
          <Link
            href="/admin/logs"
            className="block px-6 py-3 transition hover:bg-gray-800"
            prefetch={false}
          >
            Audit Logs
          </Link>
          <Link
            href="/pos"
            className="mt-10 mx-6 flex items-center justify-center gap-2 rounded-lg bg-orange-600 py-3 font-bold text-white hover:bg-orange-700 transition shadow-lg"
            prefetch={false}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            Switch to POS
          </Link>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
