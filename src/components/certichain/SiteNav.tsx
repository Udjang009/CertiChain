import { Link } from "@tanstack/react-router";
import { Logo, WalletButton } from "./common";

export function SiteNav() {
  const cls = "text-sm text-muted-foreground hover:text-foreground";
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/verify" className={cls} activeProps={{ className: "text-foreground font-medium" }}>Verifikasi</Link>
            <Link to="/admin" className={cls}>Admin</Link>
            <Link to="/student" className={cls}>Mahasiswa</Link>
          </nav>
        </div>
        <WalletButton />
      </div>
    </header>
  );
}
