import { useSyncExternalStore } from "react";

/**
 * Real Phantom wallet + Solana Devnet integration.
 * The Solana library is loaded from a CDN in the browser only, so it never enters the server bundle.
 * No private keys or seed phrases are ever requested or stored — Phantom signs every transaction.
 */
export const NETWORK = "Solana Devnet";
export const DEVNET_RPC = "https://api.devnet.solana.com";
export const EXPECTED_WALLET = "5FRgsVonKt8rgaFyCi8RcwVP2cEcWyR265HrfdkHDz2Y";
const MEMO_PROGRAM = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
export const explorerTx = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
export const explorerAddr = (a: string) => `https://explorer.solana.com/address/${a}?cluster=devnet`;
/** Memo carries only non-personal references: never names, NIM, or other personal data. */
export const issueMemo = (code: string, hash: string) => `CERTICHAIN|CERTIFICATE_ISSUED|${code}|${hash}`;

interface PhantomProvider {
  isPhantom?: boolean;
  publicKey: { toString(): string } | null;
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signAndSendTransaction(tx: unknown): Promise<{ signature: string }>;
  on(ev: string, cb: (...a: unknown[]) => void): void;
}

export function getPhantom(): PhantomProvider | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { phantom?: { solana?: PhantomProvider }; solana?: PhantomProvider };
  const p = w.phantom?.solana ?? w.solana;
  return p?.isPhantom ? p : null;
}

type Web3 = typeof import("@solana/web3.js");
const WEB3_URL = "https://esm.sh/@solana/web3.js@1.98.0?bundle";
const BUFFER_URL = "https://esm.sh/buffer@6.0.3";
async function web3() {
  const { Buffer } = (await import(/* @vite-ignore */ BUFFER_URL)) as typeof import("buffer");
  const g = globalThis as unknown as { Buffer?: unknown };
  if (!g.Buffer) g.Buffer = Buffer;
  const mod = (await import(/* @vite-ignore */ WEB3_URL)) as Web3;
  return { ...mod, Buffer };
}

export async function getBalance(address: string) {
  const { Connection, PublicKey, LAMPORTS_PER_SOL } = await web3();
  const conn = new Connection(DEVNET_RPC, "confirmed");
  return (await conn.getBalance(new PublicKey(address))) / LAMPORTS_PER_SOL;
}

export class TxError extends Error {
  constructor(public kind: "rejected" | "failed", message: string, public signature?: string) { super(message); }
}

function isRejection(e: unknown) {
  const err = e as { code?: number; message?: string };
  return err?.code === 4001 || /reject|declin|cancel/i.test(err?.message ?? "");
}

/** Sends a memo transaction signed by Phantom and waits for RPC confirmation. Only the network fee is paid. */
export async function sendMemo(address: string, memo: string) {
  const provider = getPhantom();
  if (!provider) throw new TxError("failed", "Phantom tidak terpasang. Pasang ekstensi Phantom lalu buka aplikasi di tab baru.");
  const { Connection, PublicKey, Transaction, TransactionInstruction, Buffer } = await web3();
  const conn = new Connection(DEVNET_RPC, "confirmed");
  const payer = new PublicKey(address);
  const before = await conn.getBalance(payer);
  const tx = new Transaction().add(new TransactionInstruction({
    keys: [{ pubkey: payer, isSigner: true, isWritable: true }],
    programId: new PublicKey(MEMO_PROGRAM),
    data: Buffer.from(memo, "utf8"),
  }));
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = payer;

  let signature: string;
  try {
    ({ signature } = await provider.signAndSendTransaction(tx));
  } catch (e) {
    if (isRejection(e)) throw new TxError("rejected", "Transaksi ditolak di Phantom.");
    throw new TxError("failed", `Gagal mengirim transaksi: ${(e as Error)?.message ?? "unknown"}`);
  }

  try {
    const res = await conn.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
    if (res.value.err) throw new TxError("failed", "Transaksi gagal dieksekusi di Devnet.", signature);
  } catch (e) {
    if (e instanceof TxError) throw e;
    throw new TxError("failed", "Konfirmasi transaksi timeout atau kedaluwarsa. Cek status di Explorer.", signature);
  }

  const parsed = await conn.getTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 }).catch(() => null);
  const after = await conn.getBalance(payer);
  return {
    signature,
    blockTime: parsed?.blockTime ? new Date(parsed.blockTime * 1000).toISOString() : null,
    fee: (parsed?.meta?.fee ?? before - after) / 1e9,
    before: before / 1e9,
    after: after / 1e9,
  };
}

export type ChainCheck =
  | { ok: true; blockTime: string | null; signer: string }
  | { ok: false; reason: string };

/** Reads the transaction from Devnet and checks it succeeded, was signed by the issuer, and carries the expected memo. */
export async function verifyOnChain(signature: string, expectedMemo: string, expectedSigner: string): Promise<ChainCheck> {
  const { Connection } = await web3();
  const conn = new Connection(DEVNET_RPC, "confirmed");
  const tx = await conn.getParsedTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 });
  if (!tx) return { ok: false, reason: "Transaksi tidak ditemukan di Solana Devnet." };
  if (tx.meta?.err) return { ok: false, reason: "Transaksi tercatat gagal di Devnet." };
  const signer = tx.transaction.message.accountKeys.find((k) => k.signer)?.pubkey.toString() ?? "";
  if (signer !== expectedSigner) return { ok: false, reason: "Penanda tangan transaksi bukan wallet penerbit." };
  const logs = (tx.meta?.logMessages ?? []).join("\n");
  if (!logs.includes(expectedMemo)) return { ok: false, reason: "Memo transaksi tidak cocok dengan hash sertifikat." };
  return { ok: true, signer, blockTime: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : null };
}

// ---- activity history (localStorage; swap this module's store for a backend later) ----
export type TxStatus = "pending" | "confirmed" | "failed" | "rejected";
export interface Activity {
  id: string;
  time: string;
  type: string;
  certificateId: string;
  hash: string;
  wallet: string;
  signature: string;
  blockTime: string | null;
  network: string;
  status: TxStatus;
  error?: string | undefined;
  fee?: number | undefined;
  balanceBefore?: number | undefined;
  balanceAfter?: number | undefined;
}
const AKEY = "certichain.activity.v2";
let acts: Activity[] = [];
let loaded = false;
const al = new Set<() => void>();
function saveActs() { try { localStorage.setItem(AKEY, JSON.stringify(acts)); } catch { /* ignore */ } al.forEach((x) => x()); }
export const activityStore = {
  subscribe(l: () => void) {
    al.add(l);
    queueMicrotask(() => {
      if (loaded) return; loaded = true;
      try { acts = JSON.parse(localStorage.getItem(AKEY) || "[]"); al.forEach((x) => x()); } catch { /* ignore */ }
    });
    return () => al.delete(l);
  },
  get: () => acts,
  add(a: Activity) { acts = [a, ...acts]; saveActs(); },
  update(id: string, patch: Partial<Activity>) { acts = acts.map((a) => (a.id === id ? { ...a, ...patch } : a)); saveActs(); },
};
const EMPTY: Activity[] = [];
export function useActivities() { return useSyncExternalStore(activityStore.subscribe, activityStore.get, () => EMPTY); }

// ---- issuance flow with in-flight lock to prevent duplicate transactions ----
let inFlight = false;
export function isIssuing() { return inFlight; }

export async function issueCertificateOnChain(opts: { code: string; hash: string; wallet: string; type: string }) {
  if (inFlight) throw new TxError("failed", "Masih ada transaksi yang sedang diproses.");
  inFlight = true;
  const id = `${opts.code}-${Date.now()}`;
  activityStore.add({
    id, time: new Date().toISOString(), type: opts.type, certificateId: opts.code, hash: opts.hash,
    wallet: opts.wallet, signature: "", blockTime: null, network: NETWORK, status: "pending",
  });
  try {
    const r = await sendMemo(opts.wallet, issueMemo(opts.code, opts.hash));
    activityStore.update(id, { status: "confirmed", signature: r.signature, blockTime: r.blockTime, fee: r.fee, balanceBefore: r.before, balanceAfter: r.after });
    return r;
  } catch (e) {
    const err = e instanceof TxError ? e : new TxError("failed", (e as Error)?.message ?? "Transaksi gagal");
    activityStore.update(id, { status: err.kind, error: err.message, signature: err.signature ?? "" });
    throw err;
  } finally {
    inFlight = false;
  }
}
