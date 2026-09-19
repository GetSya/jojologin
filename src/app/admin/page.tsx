import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminToken } from "@/lib/auth";
import AdminLoginForm from "@/components/AdminLoginForm";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;
  if (token && (await verifyAdminToken(token))) {
    redirect("/admin/dashboard");
  }
  return <AdminLoginForm />;
}

