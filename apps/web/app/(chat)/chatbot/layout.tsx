import { redirect } from "next/navigation";
import { ChatbotShell } from "@/components/cityfarm/layout/AppShell";
import { getUser } from "@/lib/auth-server";
import { isAuthenticated } from "@/lib/types/auth";

export default async function ChatbotLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();

  if (!isAuthenticated(user)) {
    redirect("/login");
  }

  if (user.requiresPasswordSetup) {
    redirect("/setup-password");
  }

  return <ChatbotShell>{children}</ChatbotShell>;
}
