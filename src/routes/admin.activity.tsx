import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Loader2, RefreshCw, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/certichain/DashboardShell";
import { EmptyState } from "@/components/certichain/common";
import { adminNav } from "@/components/certichain/nav";
import { shorten, useWallet } from "@/lib/certs";
import { activityStore, explorerAddr, explorerTx, getBalance, sendMemo, useActivities } from "@/lib/solana";

export const Route = createFileRoute("/admin/activity")({
  head: () => ({
    meta: [
      { title: "Wallet & Riwayat Aktivitas — CertiChain" },
      { name: "description", content: "Saldo wallet Phantom Devnet dan riwayat transaksi aktivitas CertiChain." },
      { property: "og:title", content: "Wallet & Riwayat Aktivitas — CertiChain" },
      { property: "og:description", content: "Rekap aktivitas on-chain dan pengurangan saldo SOL Devnet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ActivityPage,
});

function ActivityPage() {
  const wallet = useWallet();
  const acts = useActivities();
  const [balance, setBalance] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!wallet) { setBalance(null); return; }
    try { setBalance(await getBalance(wallet)); } catch { toast.error("Gagal membaca saldo Devnet"); }
  }, [wallet]);
  useEffect(() => { void refresh(); }, [refresh]);

  async function testActivity() {
    if (!wallet) return toast.error("Hubungkan Phantom terlebih dahulu");
    setBusy(true);
    try {
      const r = await sendMemo(wallet, `CertiChain: aktivitas uji ${new Date().toISOString()}`);
      activityStore.add({ id: r.signature, time: new Date().toISOString(), type: "Aktivitas uji", description: "Pencatatan memo uji ke Devnet", wallet, signature: r.signature, fee: r.fee, balanceBefore: r.before, balanceAfter: r.after, status: "success" });
      setBalance(r.after);
      toast.success(`Tercatat · biaya ${r.fee.toFixed(6)} SOL`);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Transaksi gagal"); }
    finally { setBusy(false); }
  }

  const totalFee = acts.reduce((s, a) => s + a.fee, 0);

  return (
    <DashboardShell items={adminNav} role="Admin / Penerbit" title="Wallet & Riwayat">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card-surface p-5">
          <div className="text-sm text-muted-foreground">Saldo (Devnet)</div>
          <div className="mt-2 font-display text-3xl font-bold">{balance === null ? "—" : `${balance.toFixed(6)} SOL`}</div>
          {wallet && <a href={explorerAddr(wallet)} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:underline">{shorten(wallet, 6, 6)} <ExternalLink className="h-3 w-3" /></a>}
        </div>
        <div className="card-surface p-5"><div className="text-sm text-muted-foreground">Total aktivitas</div><div className="mt-2 font-display text-3xl font-bold">{acts.length}</div></div>
        <div className="card-surface p-5"><div className="text-sm text-muted-foreground">Total biaya terpakai</div><div className="mt-2 font-display text-3xl font-bold">{totalFee.toFixed(6)} SOL</div></div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={refresh} disabled={!wallet}><RefreshCw /> Perbarui saldo</Button>
        <Button variant="hero" size="sm" onClick={testActivity} disabled={!wallet || busy}>{busy ? <Loader2 className="animate-spin" /> : <Send />} Catat aktivitas uji</Button>
      </div>
      {acts.length === 0 ? <EmptyState title="Belum ada riwayat" desc="Terbitkan sertifikat atau catat aktivitas uji. Setiap transaksi memotong biaya jaringan dari saldo wallet." /> : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase text-muted-foreground">
              <tr><th className="p-3">Waktu</th><th className="p-3">Aktivitas</th><th className="p-3">Biaya</th><th className="p-3">Saldo sebelum → sesudah</th><th className="p-3">Transaksi</th></tr>
            </thead>
            <tbody>
              {acts.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="p-3 whitespace-nowrap">{new Date(a.time).toLocaleString("id-ID")}</td>
                  <td className="p-3"><div className="font-medium">{a.type}</div><div className="text-xs text-muted-foreground">{a.description}</div></td>
                  <td className="p-3 font-mono text-destructive">-{a.fee.toFixed(6)}</td>
                  <td className="p-3 font-mono text-xs">{a.balanceBefore.toFixed(6)} → {a.balanceAfter.toFixed(6)}</td>
                  <td className="p-3"><a href={explorerTx(a.signature)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs hover:underline">{shorten(a.signature, 6, 6)} <ExternalLink className="h-3 w-3" /></a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
