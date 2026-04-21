import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "MANAGER") {
    redirect("/admin");
  } else {
    redirect("/pos");
  }

  return null;
}
