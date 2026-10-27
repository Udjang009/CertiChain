import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search, Eye, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardShell } from "@/components/certichain/DashboardShell";
import { EmptyState, StatusBadge } from "@/components/certichain/common";
import { CertDetailDialog } from "@/components/certichain/CertDetailDialog";
import { adminNav } from "@/components/certichain/nav";
import { certPayload, certStore, formatDate, sha256, shorten, useCertificates, walletStore, type Certificate } from "@/lib/certs";
import { Loader2 } from "lucide-react";
import { issueCertificateOnChain } from "@/lib/solana";

export const Route = createFileRoute("/admin/certificates")({
  head: () => ({
    meta: [
      { title: "Daftar Sertifikat — CertiChain" },
      { name: "description", content: "Cari, filter, dan periksa bukti blockchain setiap sertifikat." },
      { property: "og:title", content: "Daftar Sertifikat — CertiChain" },
      { property: "og:description", content: "Tabel sertifikat dengan hash dan transaction ID." },
    ],
  }),
  component: CertList,
});

function CertList() {
  const certs = useCertificates();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [sel, setSel] = useState<Certificate | null>(null);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const rows = certs.filter((c) =>
    (status === "all" || c.status === status) &&
    [c.code, c.recipientName, c.activity].some((v) => v.toLowerCase().includes(q.toLowerCase())));

  async function record(c: Certificate) {
    const wallet = walletStore.get();
    if (!wallet) { toast.error("Hubungkan Phantom terlebih dahulu"); return; }
    if (busyCode) return;
    setBusyCode(c.code);
    try {
      const hash = await sha256(certPayload(c));
      const r = await issueCertificateOnChain({ code: c.code, hash, wallet, type: "Pencatatan sertifikat" });
      certStore.update(c.code, { hash, txId: r.signature, wallet, timestamp: r.blockTime ?? new Date().toISOString(), status: "valid" });
      toast.success(`${c.code} terkonfirmasi di Devnet`, { description: `Biaya jaringan ${r.fee.toFixed(6)} SOL` });
    } catch (e) { toast.error(e instanceof Error ? e.message : "Transaksi gagal"); }
    finally { setBusyCode(null); }
  }

  return (
    <DashboardShell items={adminNav} role="Admin / Penerbit" title="Daftar Sertifikat"
      actions={<Button variant="ink" size="sm" asChild className="hidden sm:inline-flex"><Link to="/admin/new"><Plus /> Tambah</Link></Button>}>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari kode, nama, atau kegiatan…" className="bg-card pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="bg-card sm:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            <SelectItem value="valid">Valid</SelectItem>
            <SelectItem value="pending">Menunggu</SelectItem>
            <SelectItem value="invalid">Tidak Valid</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {rows.length === 0 ? <EmptyState title="Tidak ada sertifikat" desc="Coba ubah kata kunci atau filter status." /> : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>{["Kode", "Penerima", "Kegiatan", "Terbit", "Status", "Hash", "Tx ID", "Aksi"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((c) => (
                <tr key={c.code} className="hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-xs">{c.code}</td>
                  <td className="px-4 py-3">{c.recipientName}</td>
                  <td className="px-4 py-3">{c.activity}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(c.issueDate)}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 font-mono text-xs">{shorten(c.hash)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{shorten(c.txId)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setSel(c)}><Eye /> Detail</Button>
                      {c.status === "pending" && <Button size="sm" variant="outline" disabled={!!busyCode} onClick={() => record(c)}>{busyCode === c.code ? <Loader2 className="animate-spin" /> : <ShieldCheck />} Catat</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CertDetailDialog cert={sel} onOpenChange={(o) => !o && setSel(null)} />
    </DashboardShell>
  );
}
