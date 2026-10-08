import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileStack, ShieldCheck, Sparkles } from "lucide-react";
import { DashboardShell } from "@/components/certichain/DashboardShell";
import { EmptyState, StatCard, StatusBadge } from "@/components/certichain/common";
import { CertDetailDialog } from "@/components/certichain/CertDetailDialog";
import { studentNav } from "@/components/certichain/nav";
import { CURRENT_STUDENT_NIM, formatDate, shorten, useCertificates, type Certificate } from "@/lib/certs";

export const Route = createFileRoute("/student/")({
  head: () => ({
    meta: [
      { title: "Sertifikat Saya — CertiChain" },
      { name: "description", content: "Lihat sertifikat kegiatan milik mahasiswa beserta bukti blockchain dan QR verifikasi." },
      { property: "og:title", content: "Sertifikat Saya — CertiChain" },
      { property: "og:description", content: "Dashboard mahasiswa CertiChain." },
    ],
  }),
  component: Student,
});

function Student() {
  const mine = useCertificates().filter((c) => c.nim === CURRENT_STUDENT_NIM);
  const [sel, setSel] = useState<Certificate | null>(null);
  const latest = [...mine].sort((a, b) => b.issueDate.localeCompare(a.issueDate))[0];
  return (
    <DashboardShell items={studentNav} role="Mahasiswa · Andi Pratama (dummy)" title="Sertifikat Saya">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total sertifikat" value={mine.length} icon={FileStack} tone="ink" />
        <StatCard label="Sertifikat valid" value={mine.filter((c) => c.status === "valid").length} icon={ShieldCheck} tone="success" />
        <StatCard label="Terbaru" value={latest ? formatDate(latest.issueDate) : "—"} icon={Sparkles} tone="chain" />
      </div>
      {mine.length === 0 ? <EmptyState title="Belum ada sertifikat" desc="Sertifikat yang diterbitkan untuk NIM kamu akan muncul di sini." /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mine.map((c) => (
            <button key={c.code} onClick={() => setSel(c)} className="card-surface group p-5 text-left transition hover:-translate-y-0.5 hover:border-chain">
              <div className="flex items-center justify-between"><code className="font-mono text-xs text-muted-foreground">{c.code}</code><StatusBadge status={c.status} /></div>
              <div className="mt-3 font-display text-lg font-semibold">{c.activity}</div>
              <div className="text-sm text-muted-foreground">{formatDate(c.activityDate)}</div>
              <div className="mt-4 rounded-md bg-muted px-3 py-2 font-mono text-xs">tx {shorten(c.txId, 8, 6)}</div>
              <div className="mt-3 text-xs font-medium text-accent-foreground group-hover:underline">Lihat detail & QR →</div>
            </button>
          ))}
        </div>
      )}
      <CertDetailDialog cert={sel} onOpenChange={(o) => !o && setSel(null)} />
    </DashboardShell>
  );
}
