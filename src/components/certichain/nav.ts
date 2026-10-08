import { LayoutDashboard, FileStack, FilePlus2, ShieldCheck, GraduationCap } from "lucide-react";
import type { NavItem } from "./DashboardShell";

export const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/certificates", label: "Daftar Sertifikat", icon: FileStack },
  { to: "/admin/new", label: "Tambah Sertifikat", icon: FilePlus2 },
  { to: "/verify", label: "Verifikasi Publik", icon: ShieldCheck },
];
export const studentNav: NavItem[] = [
  { to: "/student", label: "Sertifikat Saya", icon: GraduationCap },
  { to: "/verify", label: "Verifikasi Publik", icon: ShieldCheck },
];
