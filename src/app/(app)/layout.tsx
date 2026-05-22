import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm pt-safe">
        <div className="flex h-14 items-center justify-between px-4 max-w-2xl mx-auto w-full">
          <Link href="/groups" className="font-bold text-lg">
            BillChill
          </Link>
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground truncate max-w-32">
                {user.displayName}
              </span>
              <a
                href="/api/auth/logout"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Logout
              </a>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 pb-safe-nav">{children}</main>

      <BottomNav />
    </div>
  );
}
