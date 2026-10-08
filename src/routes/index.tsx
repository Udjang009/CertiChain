import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Hash, Clock, Wallet, Receipt, User, FileText, Database, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteNav } from "@/components/certichain/SiteNav";
import { WalletButton } from "@/components/certichain/common";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CertiChain — Verifikasi Sertifikat Kampus Berbasis Web3" },
      { name: "description", content: "Terbitkan dan verifikasi sertifikat kegiatan kampus dengan bukti integritas blockchain (Solana Devnet)." },
      { property: "og:title", content: "CertiChain — Verifikasi Sertifikat Kampus Berbasis Web3" },
      { property: "og:description", content: "Bukti hash, timestamp, dan transaction ID on-chain; data pribadi tetap off-chain." },
    ],
  }),
  component: Landing,
});

const onChain = [
  { icon: Hash, t: "Hash sertifikat" }, { icon: Clock, t: "Timestamp penerbitan" },
  { icon: Wallet, t: "Wallet penerbit" }, { icon: Receipt, t: "Transaction ID" },
];
const offChain = [
  { icon: User, t: "Nama & NIM penerima" }, { icon: FileText, t: "File PDF sertifikat" },
  { icon: Database, t: "Metadata kegiatan" },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <SiteNav />
      <section className="grid-bg border-b">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-chain" /> Prototype · Solana Devnet
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] sm:text-6xl">
              Sertifikat kampus yang <span className="text-chain">bisa dibuktikan</span>, bukan sekadar dipercaya.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              CertiChain mencatat sidik jari digital setiap sertifikat kegiatan ke blockchain. Siapa pun dapat memeriksa keasliannya hanya dengan kode sertifikat.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="ink" size="lg" asChild><Link to="/verify"><ShieldCheck /> Verify Certificate</Link></Button>
              <WalletButton />
            </div>
            <div className="mt-6 flex gap-4 text-sm">
              <Link to="/admin" className="text-muted-foreground underline-offset-4 hover:underline">Masuk sebagai Admin →</Link>
              <Link to="/student" className="text-muted-foreground underline-offset-4 hover:underline">Masuk sebagai Mahasiswa →</Link>
            </div>
          </div>
          <div className="card-surface relative self-center p-6">
            <div className="flex items-center justify-between">
              <code className="font-mono text-xs text-muted-foreground">CC-2026-0001</code>
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">VERIFIED</span>
            </div>
            <div className="mt-4 font-display text-2xl font-bold">Seminar Nasional AI 2026</div>
            <div className="text-sm text-muted-foreground">Biro Kemahasiswaan Universitas Demo</div>
            <div className="mt-6 space-y-3 rounded-lg bg-ink p-4 text-ink-foreground">
              {[["hash", "9f2c…e81a"], ["tx", "4Nd1…Kp9w"], ["wallet", "7xKX…gAsU"], ["block time", "2026-01-15 09:30"]].map(([k, v]) => (
                <div key={k} className="flex justify-between font-mono text-xs">
                  <span className="opacity-60">{k}</span><span className="text-chain">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="text-3xl font-bold sm:text-4xl">On-Chain vs Off-Chain</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">Hanya bukti integritas yang masuk blockchain. Data pribadi dan dokumen tidak pernah ditulis ke rantai.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-ink p-8 text-ink-foreground">
            <div className="text-xs font-semibold uppercase tracking-widest text-chain">On-Chain · publik & permanen</div>
            <ul className="mt-6 space-y-4">{onChain.map((i) => <li key={i.t} className="flex items-center gap-3"><i.icon className="h-5 w-5 text-chain" />{i.t}</li>)}</ul>
          </div>
          <div className="card-surface p-8">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Off-Chain · privat & terkelola</div>
            <ul className="mt-6 space-y-4">{offChain.map((i) => <li key={i.t} className="flex items-center gap-3"><i.icon className="h-5 w-5 text-muted-foreground" />{i.t}</li>)}</ul>
          </div>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[["01", "Terbitkan", "Admin mengisi data sertifikat."], ["02", "Catat bukti", "Hash SHA-256 dicatat sebagai transaksi."], ["03", "Verifikasi", "Publik memeriksa dengan kode atau QR."]].map(([n, t, d]) => (
            <div key={n} className="border-t-2 border-chain pt-4">
              <div className="font-mono text-sm text-chain">{n}</div>
              <div className="mt-1 font-display text-xl font-semibold">{t}</div>
              <p className="text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 flex justify-center">
          <Button variant="hero" size="lg" asChild><Link to="/verify">Coba verifikasi sekarang <ArrowRight /></Link></Button>
        </div>
      </section>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">CertiChain · prototype akademik dengan data sintetis. Tidak ada transaksi nyata.</footer>
    </div>
  );
}
