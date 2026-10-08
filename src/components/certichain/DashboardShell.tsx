import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Logo, WalletButton } from "./common";

export interface NavItem { to: string; label: string; icon: React.ComponentType<{ className?: string }> }

function SideNav({ items, role, onNav }: { items: NavItem[]; role: string; onNav?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 bg-sidebar p-5 text-sidebar-foreground">
      <Logo light />
      <div className="text-xs uppercase tracking-widest text-sidebar-foreground/60">{role}</div>
      <nav className="flex flex-col gap-1">
        {items.map((i) => (
          <Link key={i.to} to={i.to} onClick={onNav} activeOptions={{ exact: true }}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent"
            activeProps={{ className: "bg-sidebar-accent text-sidebar-primary font-semibold" }}>
            <i.icon className="h-4 w-4" /> {i.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto rounded-lg border border-sidebar-border p-3 text-xs text-sidebar-foreground/70">
        Prototype akademik · data dummy · Solana Devnet (simulasi)
      </div>
    </div>
  );
}

export function DashboardShell({ items, role, title, children, actions }: { items: NavItem[]; role: string; title: string; children: ReactNode; actions?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 hidden h-screen lg:block"><SideNav items={items} role={role} /></aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[260px] border-0 p-0">
          <SheetTitle className="sr-only">Navigasi</SheetTitle>
          <SideNav items={items} role={role} onNav={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="min-w-0">
        <header className="sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b bg-background/85 px-4 py-3 backdrop-blur sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button className="shrink-0 lg:hidden" aria-label="Buka menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
            <h1 className="truncate text-lg font-bold sm:text-xl">{title}</h1>
          </div>
          <div className="flex items-center gap-2">{actions}<WalletButton /></div>
        </header>
        <main className="space-y-6 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
