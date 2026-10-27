import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Info, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/certichain/DashboardShell";
import { EmptyState } from "@/components/certichain/common";
import { adminNav } from "@/components/certichain/nav";
import { shorten, useWallet } from "@/lib/certs";
import { explorerAddr, explorerTx, getBalance, NETWORK, useActivities, type TxStatus } from "@/lib/solana";

export const Route = createFileRoute("/admin/activity")({
  head: () => ({
    meta: [
      { title: "Wallet & Audit Trail — CertiChain" },
      { name: "description", content: "Saldo wallet Phantom Devnet dan audit trail transaksi penerbitan sertifikat CertiChain." },
      { property: "og:title", content: "Wallet & Audit Trail — CertiChain" },
      { property: "og:description", content: "Riwayat transaksi Memo di Solana Devnet beserta status konfirmasi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ActivityPage,
});

const statusCls: Record<TxStatus, string> = {
  pending: "bg-warning/20 text-foreground border-warning/40",
  confirmed: "bg-success/15 text-success border-success/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  rejected: "bg-muted text-muted-foreground border-border",
};
const statusLabel: Record<TxStatus, string> = { pending: "Pending", confirmed: "Confirmed", failed: "Failed", rejected: "Rejected" };

function ActivityPage() {
  const wallet = useWallet();
  const acts = useActivities();
  const [balance, setBalance] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    if (!wallet) { setBalance(null); return; }
    try { setBalance(await getBalance(wallet)); } catch { toast.error("Gagal membaca saldo Devnet"); }
  }, [wallet]);
  useEffect(() => { void refresh(); }, [refresh, acts.length]);

  const confirmed = acts.filter((a) => a.status === "confirmed");
  const totalFee = confirmed.reduce((s, a) => s + (a.fee ?? 0), 0);

  return (
    <DashboardShell items={adminNav} role="Admin / Penerbit" title="Wallet & Audit Trail">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-surface p-5">
          <div className="text-sm text-muted-foreground">Saldo · {NETWORK}</div>
          <div className="mt-2 font-display text-3xl font-bold">{balance === null ? "—" : `${balance.toFixed(6)} SOL`}</div>
          {wallet ? <a href={explorerAddr(wallet)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:underline">{shorten(wallet, 6, 6)} <ExternalLink className="h-3 w-3" /></a>
            : <div className="mt-2 text-xs text-muted-foreground">Wallet belum terhubung</div>}
        </div>
        <div className="card-surface p-5"><div className="text-sm text-muted-foreground">Transaksi terkonfirmasi</div><div className="mt-2 font-display text-3xl font-bold">{confirmed.length}</div></div>
        <div className="card-surface p-5"><div className="text-sm text-muted-foreground">Total biaya jaringan</div><div className="mt-2 font-display text-3xl font-bold">{totalFee.toFixed(6)} SOL</div></div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={refresh} disabled={!wallet}><RefreshCw /> Perbarui saldo</Button>
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />Riwayat ini disimpan di localStorage — hanya ada di browser/perangkat ini, bukan database bersama. Bukti sebenarnya ada di Solana Explorer.</p>
      </div>
      {acts.length === 0 ? <EmptyState title="Belum ada riwayat" desc="Terbitkan atau catat sertifikat. Setiap transaksi hanya membayar biaya jaringan Devnet." /> : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>{["ID Sertifikat", "Hash", "Wallet penerbit", "Signature", "Timestamp", "Jaringan", "Status", "Biaya", "Explorer"].map((h) => <th key={h} className="px-3 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {acts.map((a) => (
                <tr key={a.id}>
                  <td className="px-3 py-3"><div className="font-mono text-xs">{a.certificateId}</div><div className="text-xs text-muted-foreground">{a.type}</div></td>
                  <td className="px-3 py-3 font-mono text-xs">{shorten(a.hash, 8, 6)}</td>
                  <td className="px-3 py-3 font-mono text-xs">{shorten(a.wallet, 4, 4)}</td>
                  <td className="px-3 py-3 font-mono text-xs">{shorten(a.signature, 6, 6)}</td>
                  <td className="px-3 py-3 whitespace-nowrap text-xs">{new Date(a.blockTime ?? a.time).toLocaleString("id-ID")}{!a.blockTime && <div className="text-muted-foreground">(waktu lokal)</div>}</td>
                  <td className="px-3 py-3 text-xs">{a.network}</td>
                  <td className="px-3 py-3">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusCls[a.status]}`}>{statusLabel[a.status]}</span>
                    {a.error && <div className="mt-1 max-w-[180px] text-xs text-muted-foreground">{a.error}</div>}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{a.fee != null ? `-${a.fee.toFixed(6)}` : "—"}</td>
                  <td className="px-3 py-3">{a.signature ? <a href={explorerTx(a.signature)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium hover:underline">Buka <ExternalLink className="h-3 w-3" /></a> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
