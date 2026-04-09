export default function ChatbotLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /* Nền từ body (globals); padding ngang do ChatbotScreen */
  return <div className="min-h-screen">{children}</div>;
}
