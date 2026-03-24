// Auth route group layout — wraps login, register, forgot-password
// NOTE: the root <html>/<body> is already in src/app/layout.tsx
// This layout must NOT re-define html/body — just provide the visual wrapper.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {children}
    </div>
  );
}
