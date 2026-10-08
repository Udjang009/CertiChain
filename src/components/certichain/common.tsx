import { Link } from "@tanstack/react-router";
import { Link2, Wallet, Copy, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { shorten, useWallet, walletStore, type CertStatus } from "@/lib/certs";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-chain text-chain-foreground">
        <Link2 className="h-4 w-4" />
      </span>
      <span className={cn("font-display text-lg font-bold tracking-tight", light ? "text-sidebar-accent-foreground" : "text-foreground")}>
        Certi<span className="text-chain">Chain</span>
      </span>
    </Link>
  );
}

const statusMap: Record<CertStatus, { label: string; cls: string }> = {
  valid: { label: "Valid", cls: "bg-success/15 text-success border-success/30" },
  invalid: { label: "Tidak Valid", cls: "bg-destructive/10 text-destructive border-destructive/30" },
  pending: { label: "Menunggu", cls: "bg-warning/20 text-foreground border-warning/40" },
};
export function StatusBadge({ status }: { status: CertStatus }) {
  const s = statusMap[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", s.cls)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}

export function WalletButton({ variant = "hero" as "hero" | "outline" | "ink" }) {
  const wallet = useWallet();
  if (wallet)
    return (
      <Button variant="outline" size="sm" onClick={() => { walletStore.disconnect(); toast("Wallet terputus"); }} className="font-mono">
        <span className="h-2 w-2 rounded-full bg-success" />
        {shorten(wallet, 4, 4)}
        <LogOut />
      </Button>
    );
  return (
    <Button variant={variant} size="sm" onClick={() => {
      walletStore.connect();
      toast.success("Wallet dummy terhubung (Solana Devnet)", { description: "Tidak ada private key atau seed phrase yang diminta." });
    }}>
      <Wallet /> Connect Wallet
    </Button>
  );
}

export function CopyHash({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-start gap-2">
        <code className="hash min-w-0 flex-1 text-foreground">{value || "—"}</code>
        {value && (
          <button aria-label={`Salin ${label}`} className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => { navigator.clipboard.writeText(value); toast.success(`${label} disalin`); }}>
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "chain" }: { label: string; value: number | string; icon: React.ComponentType<{ className?: string }>; tone?: "chain" | "success" | "warning" | "ink" }) {
  const toneCls = { chain: "bg-accent text-accent-foreground", success: "bg-success/15 text-success", warning: "bg-warning/20 text-foreground", ink: "bg-ink text-ink-foreground" }[tone];
  return (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={cn("grid h-9 w-9 place-items-center rounded-lg", toneCls)}><Icon className="h-4 w-4" /></span>
      </div>
      <div className="mt-3 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}

export function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed p-10 text-center">
      <div className="font-display text-lg font-semibold">{title}</div>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
