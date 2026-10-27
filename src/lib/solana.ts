import { useSyncExternalStore } from "react";

/** Real Phantom wallet on Solana Devnet. Libraries are loaded lazily in the browser only. */
export const DEVNET_RPC = "https://api.devnet.solana.com";
export const EXPECTED_WALLET = "5FRgsVonKt8rgaFyCi8RcwVP2cEcWyR265HrfdkHDz2Y";
const MEMO_PROGRAM = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
export const explorerTx = (sig: string) => `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
export const explorerAddr = (a: string) => `https://explorer.solana.com/address/${a}?cluster=devnet`;

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

async function web3() {
  const { Buffer } = await import("buffer");
  const g = globalThis as unknown as { Buffer?: unknown };
  if (!g.Buffer) g.Buffer = Buffer;
  return { ...(await import("@solana/web3.js")), Buffer };
}

export async function getBalance(address: string) {
  const { Connection, PublicKey, LAMPORTS_PER_SOL } = await web3();
  const conn = new Connection(DEVNET_RPC, "confirmed");
  return (await conn.getBalance(new PublicKey(address))) / LAMPORTS_PER_SOL;
}

/** Writes a memo transaction to Devnet, signed by Phantom. The network fee is deducted from the wallet. */
export async function sendMemo(address: string, memo: string) {
  const provider = getPhantom();
  if (!provider) throw new Error("Phantom tidak ditemukan");
  const { Connection, PublicKey, Transaction, TransactionInstruction, Buffer } = await web3();
  const conn = new Connection(DEVNET_RPC, "confirmed");
  const payer = new PublicKey(address);
  const before = await conn.getBalance(payer);
  const tx = new Transaction().add(new TransactionInstruction({
    keys: [{ pubkey: payer, isSigner: true, isWritable: true }],
    programId: new PublicKey(MEMO_PROGRAM),
    data: Buffer.from(memo, "utf8"),
  }));
  const { blockhash, lastValidBlockHeight } = await conn.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = payer;
  const { signature } = await provider.signAndSendTransaction(tx);
  await conn.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  const after = await conn.getBalance(payer);
  return { signature, before: before / 1e9, after: after / 1e9, fee: (before - after) / 1e9 };
}

// ---- activity history (localStorage) ----
export interface Activity {
  id: string; time: string; type: string; description: string;
  wallet: string; signature: string; fee: number; balanceBefore: number; balanceAfter: number;
  status: "success" | "failed";
}
const AKEY = "certichain.activity.v1";
let acts: Activity[] = [];
let loaded = false;
const al = new Set<() => void>();
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
  add(a: Activity) { acts = [a, ...acts]; localStorage.setItem(AKEY, JSON.stringify(acts)); al.forEach((x) => x()); },
};
const EMPTY: Activity[] = [];
export function useActivities() { return useSyncExternalStore(activityStore.subscribe, activityStore.get, () => EMPTY); }
