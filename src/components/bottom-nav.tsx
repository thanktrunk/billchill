"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bell, User } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/groups", label: "Groups", icon: Home },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-10 border-t bg-background/80 backdrop-blur-sm pb-safe">
      <div className="flex h-16 items-center justify-around max-w-2xl mx-auto px-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[64px] py-1 rounded-lg transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                className={cn("size-6", active && "stroke-[2.5]")}
                aria-hidden
              />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
