import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-server";
import { isAuthenticated } from "@/lib/types/auth";

export default async function Home() {
  const user = await getUser();

  if (!isAuthenticated(user)) {
    redirect("/login");
  }

  if (user.requiresPasswordSetup) {
    redirect("/setup-password");
  }

  redirect("/home");
}
