import { QRCodeSVG } from "qrcode.react";
import { ExternalLink } from "lucide-react";
import { explorerTx } from "@/lib/solana";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatDate, type Certificate } from "@/lib/certs";
import { CopyHash, StatusBadge } from "./common";

export function CertDetailDialog({ cert, onOpenChange, showPrivate = true }: { cert: Certificate | null; onOpenChange: (o: boolean) => void; showPrivate?: boolean }) {
  return (
    <Dialog open={!!cert} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {cert && (
          <>
            <DialogHeader>
              <div className="flex flex-wrap items-center gap-2">
                <code className="font-mono text-sm text-muted-foreground">{cert.code}</code>
                <StatusBadge status={cert.status} />
              </div>
              <DialogTitle className="text-2xl">{cert.activity}</DialogTitle>
              <DialogDescription>Diterbitkan oleh {cert.issuer}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
              <div className="space-y-4">
                <section className="rounded-lg bg-muted p-4">
                  <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Off-Chain · data aplikasi</div>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    {showPrivate && <><dt className="text-muted-foreground">Penerima</dt><dd className="font-medium">{cert.recipientName}</dd>
                    <dt className="text-muted-foreground">NIM</dt><dd className="font-mono">{cert.nim}</dd></>}
                    <dt className="text-muted-foreground">Tgl. kegiatan</dt><dd>{formatDate(cert.activityDate)}</dd>
                    <dt className="text-muted-foreground">Tgl. terbit</dt><dd>{formatDate(cert.issueDate)}</dd>
                  </dl>
                </section>
                <section className="space-y-3 rounded-lg border border-chain/40 bg-accent/40 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-accent-foreground">On-Chain · Solana Devnet</div>
                  <CopyHash label="Hash SHA-256" value={cert.hash} />
                  <CopyHash label="Transaction signature" value={cert.txId} />
                  <CopyHash label="Wallet penerbit" value={cert.wallet} />
                  <CopyHash label="Timestamp" value={cert.timestamp} />
                  {cert.txId ? (
                    <a href={explorerTx(cert.txId)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-accent-foreground hover:underline">Lihat di Solana Explorer <ExternalLink className="h-3 w-3" /></a>
                  ) : <p className="text-xs text-muted-foreground">Belum dicatat ke blockchain.</p>}
                </section>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="rounded-lg border bg-card p-3">
                  <QRCodeSVG value={`certichain:verify:${cert.code}`} size={132} />
                </div>
                <span className="text-xs text-muted-foreground">QR verifikasi</span>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
