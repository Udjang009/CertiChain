import { createFileRoute, Link } from "@tanstack/react-router";
import { FileStack, ShieldCheck, Hourglass, Send, Plus } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { DashboardShell } from "@/components/certichain/DashboardShell";
import { StatCard, StatusBadge } from "@/components/certichain/common";
import { adminNav } from "@/components/certichain/nav";
import { formatDate, shorten, useCertificates } from "@/lib/certs";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard Admin — CertiChain" },
      { name: "description", content: "Statistik penerbitan dan status sertifikat kegiatan kampus." },
      { property: "og:title", content: "Dashboard Admin — CertiChain" },
      { property: "og:description", content: "Kelola dan pantau penerbitan sertifikat." },
    ],
  }),
  component: AdminDashboard,
});

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function AdminDashboard() {
  const certs = useCertificates();
  const valid = certs.filter((c) => c.status === "valid").length;
  const pending = certs.filter((c) => c.status === "pending").length;
  const invalid = certs.filter((c) => c.status === "invalid").length;
  const issued = certs.filter((c) => c.txId).length;
  const monthly = MONTHS.slice(0, 10).map((m, i) => ({ m, n: certs.filter((c) => new Date(c.issueDate).getMonth() === i).length }));
  const dist = [
    { name: "Valid", value: valid, color: "var(--color-chart-2)" },
    { name: "Menunggu", value: pending, color: "var(--color-chart-3)" },
    { name: "Tidak Valid", value: invalid, color: "var(--color-chart-4)" },
  ];

  return (
    <DashboardShell items={adminNav} role="Admin / Penerbit" title="Dashboard"
      actions={<Button variant="ink" size="sm" asChild className="hidden sm:inline-flex"><Link to="/admin/new"><Plus /> Tambah Sertifikat</Link></Button>}>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Sertifikat" value={certs.length} icon={FileStack} tone="ink" />
        <StatCard label="Sertifikat Valid" value={valid} icon={ShieldCheck} tone="success" />
        <StatCard label="Menunggu Verifikasi" value={pending} icon={Hourglass} tone="warning" />
        <StatCard label="Total Penerbitan" value={issued} icon={Send} tone="chain" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="card-surface p-5">
          <h2 className="font-semibold">Sertifikat diterbitkan per bulan</h2>
          <div className="mt-4 h-64">
            <ResponsiveContainer><BarChart data={monthly}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" />
              <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} width={24} />
              <Tooltip cursor={{ fill: "var(--color-muted)" }} />
              <Bar dataKey="n" name="Sertifikat" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart></ResponsiveContainer>
          </div>
        </div>
        <div className="card-surface p-5">
          <h2 className="font-semibold">Distribusi status</h2>
          <div className="mt-4 h-48">
            <ResponsiveContainer><PieChart>
              <Pie data={dist} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={3}>
                {dist.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie><Tooltip />
            </PieChart></ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1 text-sm">{dist.map((d) => <li key={d.name} className="flex justify-between"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />{d.name}</span><b>{d.value}</b></li>)}</ul>
        </div>
      </div>
      <div className="card-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Audit trail terbaru</h2>
          <Button variant="outline" size="sm" asChild><Link to="/admin/certificates">Lihat Daftar Sertifikat</Link></Button>
        </div>
        <ul className="mt-4 divide-y">
          {certs.slice(0, 5).map((c) => (
            <li key={c.code} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div className="min-w-0"><div className="font-medium">{c.activity}</div><div className="font-mono text-xs text-muted-foreground">{c.code} · tx {shorten(c.txId)}</div></div>
              <div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">{formatDate(c.issueDate)}</span><StatusBadge status={c.status} /></div>
            </li>
          ))}
        </ul>
      </div>
    </DashboardShell>
  );
}
