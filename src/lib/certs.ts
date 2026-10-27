import { useSyncExternalStore } from "react";

export type CertStatus = "valid" | "invalid" | "pending";

/** Off-chain data (application storage) + simulated on-chain proof. */
export interface Certificate {
  code: string;
  // off-chain
  recipientName: string;
  nim: string;
  activity: string;
  activityDate: string;
  issueDate: string;
  fileName?: string | undefined;
  issuer: string;
  // simulated on-chain (Solana Devnet)
  status: CertStatus;
  hash: string;
  txId: string;
  wallet: string;
  timestamp: string;
}

export const ISSUER = "Biro Kemahasiswaan Universitas Demo";
export const ISSUER_WALLET = "5FRgsVonKt8rgaFyCi8RcwVP2cEcWyR265HrfdkHDz2Y";
export const CURRENT_STUDENT_NIM = "2201001";

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
export function randomBase58(len: number) {
  let s = "";
  for (let i = 0; i < len; i++) s += B58[Math.floor(Math.random() * B58.length)];
  return s;
}

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function certPayload(c: Pick<Certificate, "code" | "recipientName" | "nim" | "activity" | "activityDate" | "issueDate">) {
  return JSON.stringify([c.code, c.recipientName, c.nim, c.activity, c.activityDate, c.issueDate]);
}

const seedRaw: Array<[string, string, string, string, string, CertStatus]> = [
  ["CC-2026-0001", "Andi Pratama", "2201001", "Seminar Nasional AI 2026", "2026-01-15", "valid"],
  ["CC-2026-0002", "Siti Rahayu", "2201002", "Workshop UI/UX Design", "2026-02-03", "valid"],
  ["CC-2026-0003", "Budi Santoso", "2201003", "Hackathon Kampus Hijau", "2026-02-20", "pending"],
  ["CC-2026-0004", "Andi Pratama", "2201001", "Pelatihan Kepemimpinan BEM", "2026-03-11", "valid"],
  ["CC-2026-0005", "Dewi Lestari", "2201004", "Lomba Karya Tulis Ilmiah", "2026-04-02", "invalid"],
  ["CC-2026-0006", "Rizky Maulana", "2201005", "Webinar Blockchain 101", "2026-04-28", "valid"],
  ["CC-2026-0007", "Andi Pratama", "2201001", "Bootcamp Web3 Developer", "2026-05-19", "valid"],
  ["CC-2026-0008", "Nurul Hidayah", "2201006", "Kompetisi Debat Bahasa Inggris", "2026-06-07", "pending"],
  ["CC-2026-0009", "Fajar Nugroho", "2201007", "Seminar Kewirausahaan Digital", "2026-07-14", "valid"],
  ["CC-2026-0010", "Siti Rahayu", "2201002", "Pameran Proyek Akhir", "2026-08-22", "valid"],
];

function pseudoHex(seed: string, len = 64) {
  let h = 2166136261;
  let out = "";
  while (out.length < len) {
    for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
    out += (h >>> 0).toString(16).padStart(8, "0");
    seed += out;
  }
  return out.slice(0, len);
}
function pseudoB58(seed: string, len: number) {
  const hex = pseudoHex(seed, len * 2);
  let s = "";
  for (let i = 0; i < len; i++) s += B58[parseInt(hex.slice(i * 2, i * 2 + 2), 16) % 58];
  return s;
}

// Seed certificates carry NO fake blockchain proof: they start "pending" (or "invalid")
// and only become "valid" after a real, confirmed Devnet transaction.
const SEED: Certificate[] = seedRaw.map(([code, name, nim, activity, date, status]) => ({
  code, recipientName: name, nim, activity, activityDate: date, issueDate: date,
  issuer: ISSUER, status: status === "invalid" ? "invalid" : "pending",
  hash: "", txId: "", wallet: "", timestamp: "",
  fileName: `${code}.pdf`,
}));
void pseudoB58;

// ---- tiny store (localStorage-backed; swap for API/backend later) ----
const KEY = "certichain.certs.v2";
let state: Certificate[] = SEED;
let hydrated = false;
const listeners = new Set<() => void>();
function emit() { listeners.forEach((l) => l()); }
function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { state = JSON.parse(raw); emit(); }
  } catch { /* ignore */ }
}
function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ } }

export const certStore = {
  subscribe(l: () => void) { listeners.add(l); queueMicrotask(hydrate); return () => listeners.delete(l); },
  get: () => state,
  add(c: Certificate) { state = [c, ...state]; persist(); emit(); },
  update(code: string, patch: Partial<Certificate>) {
    state = state.map((c) => (c.code === code ? { ...c, ...patch } : c)); persist(); emit();
  },
};

export function useCertificates() {
  return useSyncExternalStore(certStore.subscribe, certStore.get, () => SEED);
}

export function nextCode(list: Certificate[]) {
  const n = list.reduce((m, c) => Math.max(m, parseInt(c.code.split("-")[2] || "0", 10)), 0) + 1;
  return `CC-2026-${String(n).padStart(4, "0")}`;
}

export function shorten(s: string, a = 6, b = 4) {
  if (!s) return "—";
  return s.length > a + b + 3 ? `${s.slice(0, a)}…${s.slice(-b)}` : s;
}

export function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// ---- Phantom wallet (Solana Devnet). No keys ever requested; Phantom signs. ----
const wl = new Set<() => void>();
let wallet: string | null = null;
let wired = false;
function setWallet(w: string | null) { wallet = w; wl.forEach((x) => x()); }
export const walletStore = {
  subscribe(l: () => void) {
    wl.add(l);
    queueMicrotask(async () => {
      if (wired) return; wired = true;
      const { getPhantom } = await import("./solana");
      const p = getPhantom();
      if (!p) return;
      p.on("disconnect", () => setWallet(null));
      p.on("accountChanged", (pk) => setWallet(pk ? String(pk) : null));
      try { const r = await p.connect({ onlyIfTrusted: true }); setWallet(r.publicKey.toString()); } catch { /* not trusted yet */ }
    });
    return () => wl.delete(l);
  },
  get: () => wallet,
  async connect() {
    const { getPhantom } = await import("./solana");
    const p = getPhantom();
    if (!p) {
      window.open("https://phantom.app/", "_blank", "noopener");
      throw new Error("Phantom belum terpasang. Buka aplikasi di tab baru dengan ekstensi Phantom aktif.");
    }
    const r = await p.connect();
    setWallet(r.publicKey.toString());
    return wallet!;
  },
  async disconnect() {
    const { getPhantom } = await import("./solana");
    await getPhantom()?.disconnect().catch(() => {});
    setWallet(null);
  },
};
export function useWallet() {
  return useSyncExternalStore(walletStore.subscribe, walletStore.get, () => null);
}
