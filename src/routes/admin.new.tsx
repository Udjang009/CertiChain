import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Loader2, Circle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DashboardShell } from "@/components/certichain/DashboardShell";
import { CopyHash } from "@/components/certichain/common";
import { adminNav } from "@/components/certichain/nav";
import { certPayload, certStore, ISSUER, ISSUER_WALLET, nextCode, randomBase58, sha256, useCertificates, useWallet, type Certificate } from "@/lib/certs";

export const Route = createFileRoute("/admin/new")({
  head: () => ({
    meta: [
      { title: "Tambah Sertifikat — CertiChain" },
      { name: "description", content: "Terbitkan sertifikat dummy dan simulasikan pencatatan hash ke blockchain." },
      { property: "og:title", content: "Tambah Sertifikat — CertiChain" },
      { property: "og:description", content: "Form penerbitan sertifikat dengan simulasi Solana Devnet." },
    ],
  }),
  component: NewCert,
});

const STEPS = ["Data sertifikat dibuat", "Menghasilkan hash SHA-256", "Hash dicatat sebagai bukti blockchain", "Menghasilkan timestamp", "Menetapkan wallet penerbit", "Menghasilkan transaction ID", "Status sertifikat: Valid"];

function NewCert() {
  const certs = useCertificates();
  const wallet = useWallet();
  const [form, setForm] = useState({ recipientName: "", nim: "", activity: "", activityDate: "", issueDate: new Date().toISOString().slice(0, 10), code: "" });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(-1);
  const [done, setDone] = useState<Certificate | null>(null);
  const code = form.code || nextCode(certs);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  function validate() {
    const e: Record<string, string> = {};
    if (form.recipientName.trim().length < 3) e.recipientName = "Minimal 3 karakter";
    if (!/^\d{5,12}$/.test(form.nim)) e.nim = "NIM dummy 5–12 digit angka";
    if (form.activity.trim().length < 3) e.activity = "Wajib diisi";
    if (!form.activityDate) e.activityDate = "Wajib diisi";
    if (!form.issueDate) e.issueDate = "Wajib diisi";
    else if (form.activityDate && form.issueDate < form.activityDate) e.issueDate = "Tidak boleh sebelum tanggal kegiatan";
    if (!/^CC-\d{4}-\d{4}$/.test(code)) e.code = "Format CC-YYYY-NNNN";
    else if (certs.some((c) => c.code === code)) e.code = "Kode sudah digunakan";
    if (file && (file.type !== "application/pdf" || file.size > 5e6)) e.file = "PDF maks. 5 MB";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!wallet) { toast.error("Hubungkan wallet terlebih dahulu"); return; }
    if (!validate()) { toast.error("Periksa kembali isian form"); return; }
    const base = { code, recipientName: form.recipientName.trim(), nim: form.nim, activity: form.activity.trim(), activityDate: form.activityDate, issueDate: form.issueDate };
    const wait = () => new Promise((r) => setTimeout(r, 450));
    setDone(null);
    setStep(0); await wait();
    const hash = await sha256(certPayload(base));
    setStep(1); await wait(); setStep(2); await wait();
    const timestamp = new Date().toISOString();
    setStep(3); await wait(); setStep(4); await wait();
    const txId = randomBase58(88);
    setStep(5); await wait(); setStep(6); await wait();
    const cert: Certificate = { ...base, issuer: ISSUER, fileName: file?.name, status: "valid", hash, txId, wallet: ISSUER_WALLET, timestamp };
    certStore.add(cert);
    setStep(7); setDone(cert);
    toast.success(`Sertifikat ${code} diterbitkan`);
  }

  const busy = step >= 0 && step < 7;
  const fieldErr = (k: string) => errors[k] && <p className="text-xs text-destructive">{errors[k]}</p>;

  return (
    <DashboardShell items={adminNav} role="Admin / Penerbit" title="Tambah Sertifikat">
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={submit} className="card-surface grid gap-4 p-6 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Nama penerima</Label><Input value={form.recipientName} onChange={set("recipientName")} maxLength={80} placeholder="Nama dummy" />{fieldErr("recipientName")}</div>
          <div className="space-y-1.5"><Label>NIM dummy</Label><Input value={form.nim} onChange={set("nim")} inputMode="numeric" maxLength={12} placeholder="2201099" />{fieldErr("nim")}</div>
          <div className="space-y-1.5"><Label>Kode sertifikat</Label><Input value={form.code} onChange={set("code")} placeholder={nextCode(certs)} className="font-mono" maxLength={12} />{fieldErr("code")}</div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Nama kegiatan</Label><Input value={form.activity} onChange={set("activity")} maxLength={120} />{fieldErr("activity")}</div>
          <div className="space-y-1.5"><Label>Tanggal kegiatan</Label><Input type="date" value={form.activityDate} onChange={set("activityDate")} />{fieldErr("activityDate")}</div>
          <div className="space-y-1.5"><Label>Tanggal penerbitan</Label><Input type="date" value={form.issueDate} onChange={set("issueDate")} />{fieldErr("issueDate")}</div>
          <div className="space-y-1.5 sm:col-span-2"><Label>File sertifikat dummy (PDF, off-chain)</Label><Input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />{fieldErr("file")}</div>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button variant="hero" disabled={busy}>{busy && <Loader2 className="animate-spin" />} Terbitkan & catat ke blockchain</Button>
            {!wallet && <span className="text-xs text-muted-foreground">Wallet belum terhubung</span>}
          </div>
        </form>
        <div className="card-surface p-6">
          <h2 className="font-semibold">Simulasi pencatatan · Solana Devnet</h2>
          <ol className="mt-4 space-y-3">
            {STEPS.map((s, i) => {
              const state = step > i ? "done" : step === i ? "active" : "idle";
              return (
                <li key={s} className="flex items-center gap-3 text-sm">
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${state === "done" ? "bg-chain text-chain-foreground" : state === "active" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                    {state === "done" ? <Check className="h-3.5 w-3.5" /> : state === "active" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Circle className="h-2 w-2" />}
                  </span>
                  <span className={state === "idle" ? "text-muted-foreground" : ""}>{s}</span>
                </li>
              );
            })}
          </ol>
          {done && (
            <div className="mt-6 space-y-3 rounded-lg border border-chain/40 bg-accent/40 p-4">
              <CopyHash label="Hash" value={done.hash} />
              <CopyHash label="Transaction ID" value={done.txId} />
              <CopyHash label="Timestamp" value={done.timestamp} />
              <Button variant="outline" size="sm" asChild><Link to="/admin/certificates">Lihat di daftar</Link></Button>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
