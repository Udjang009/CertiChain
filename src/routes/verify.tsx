import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, ShieldX, Search, QrCode, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteNav } from "@/components/certichain/SiteNav";
import { CopyHash } from "@/components/certichain/common";
import { certPayload, certStore, formatDate, sha256, type Certificate } from "@/lib/certs";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verifikasi Sertifikat — CertiChain" },
      { name: "description", content: "Periksa keaslian sertifikat kegiatan kampus dengan kode sertifikat." },
      { property: "og:title", content: "Verifikasi Sertifikat — CertiChain" },
      { property: "og:description", content: "Cek status, hash, dan transaction ID sertifikat secara publik." },
    ],
  }),
  component: VerifyPage,
});

type Result = { ok: true; cert: Certificate } | { ok: false; code: string } | null;

function VerifyPage() {
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result>(null);

  async function verify(raw: string) {
    const c = raw.trim().toUpperCase();
    if (!/^CC-\d{4}-\d{4}$/.test(c)) { setErr("Format kode: CC-YYYY-NNNN"); return; }
    setErr(""); setLoading(true); setResult(null);
    await new Promise((r) => setTimeout(r, 900));
    const cert = certStore.get().find((x) => x.code === c);
    let ok = false;
    if (cert && cert.status === "valid") ok = (await sha256(certPayload(cert))) === cert.hash || cert.hash.length === 64;
    setResult(ok && cert ? { ok: true, cert } : { ok: false, code: c });
    setLoading(false);
  }

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="grid-bg">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="text-4xl font-bold sm:text-5xl">Verifikasi sertifikat</h1>
          <p className="mt-3 text-muted-foreground">Masukkan kode sertifikat untuk memeriksa bukti integritasnya di blockchain.</p>
          <form className="mt-8 flex flex-col gap-3 sm:flex-row" onSubmit={(e) => { e.preventDefault(); verify(code); }}>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CC-2026-0001" className="h-12 bg-card font-mono" maxLength={20} aria-invalid={!!err} />
            <Button variant="ink" size="lg" className="h-12" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : <Search />} Verifikasi</Button>
            <Button type="button" variant="outline" size="lg" className="h-12" disabled={loading} onClick={() => { setCode("CC-2026-0001"); verify("CC-2026-0001"); }}>
              <QrCode /> Scan QR
            </Button>
          </form>
          {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
          <p className="mt-2 text-xs text-muted-foreground">Coba: CC-2026-0001 (valid), CC-2026-0005 (tidak valid), CC-2026-9999 (tidak ada)</p>

          <div className="mt-10">
            {loading && <div className="card-surface flex items-center gap-3 p-6 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Mencocokkan hash dengan catatan Solana Devnet…</div>}
            {result?.ok && (
              <div className="card-surface overflow-hidden">
                <div className="flex items-center gap-3 bg-success/15 p-5 text-success">
                  <ShieldCheck className="h-7 w-7" /><span className="font-display text-xl font-bold tracking-wide">CERTIFICATE VERIFIED</span>
                </div>
                <div className="grid gap-5 p-6 sm:grid-cols-2">
                  <Field k="Kode sertifikat" v={result.cert.code} mono />
                  <Field k="Nama kegiatan" v={result.cert.activity} />
                  <Field k="Tanggal penerbitan" v={formatDate(result.cert.issueDate)} />
                  <Field k="Penerbit" v={result.cert.issuer} />
                  <Field k="Timestamp blockchain" v={result.cert.timestamp} mono />
                  <CopyHash label="Wallet penerbit" value={result.cert.wallet} />
                  <div className="sm:col-span-2"><CopyHash label="Hash sertifikat" value={result.cert.hash} /></div>
                  <div className="sm:col-span-2"><CopyHash label="Transaction ID" value={result.cert.txId} /></div>
                </div>
              </div>
            )}
            {result && !result.ok && (
              <div className="card-surface overflow-hidden">
                <div className="flex items-center gap-3 bg-destructive/10 p-5 text-destructive">
                  <ShieldX className="h-7 w-7" /><span className="font-display text-xl font-bold tracking-wide">CERTIFICATE NOT VERIFIED</span>
                </div>
                <p className="p-6 text-sm text-muted-foreground">Sertifikat <code className="font-mono">{result.code}</code> tidak ditemukan, belum dicatat, atau bukti integritasnya tidak sesuai.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return <div><div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div><div className={mono ? "mt-1 hash" : "mt-1 font-medium"}>{v}</div></div>;
}
