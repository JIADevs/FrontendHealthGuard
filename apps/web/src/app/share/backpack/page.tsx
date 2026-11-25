"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { FileText, Globe, Link2, ShieldCheck } from "lucide-react";
import { consumeSharedBackpack, getSharedBackpackDocumentUrl, isApiError, type SharedBackpack } from "@helu/api";
import { Button, Chip, IconTile, Typography } from "@helu/ui";

/**
 * Public page of a shared backpack (PRD Misiones RF-67, DU-13; mockups m5 «Vista pública (móvil)» and
 * «Vista pública · enlace vencido»). No account: the token is the capability. Shows who shared, the
 * documents (read only) and when the link ends. Expired and revoked links look the same and never
 * show patient data.
 */

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"];

const page: React.CSSProperties = { minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column" };
const top: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px clamp(16px, 4vw, 40px)",
  borderBottom: "1px solid var(--border)",
  background: "var(--bg-card)",
};
const main: React.CSSProperties = {
  width: "100%",
  maxWidth: 640,
  margin: "0 auto",
  padding: "24px 16px 48px",
  display: "flex",
  flexDirection: "column",
  gap: 16,
};
const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border)",
  borderBottomWidth: 4,
  borderRadius: 18,
  padding: "14px 16px",
};


/** Page-local CSS: skeleton shimmer (one for the screen, 1,4 s), «Ver» states, content fade-in (§6c). */
const PAGE_CSS = `
.sb-skel { background: var(--border); border-radius: 6px; animation: sb-shimmer 1.4s linear infinite; }
@keyframes sb-shimmer { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
.sb-enter { animation: sb-fade 150ms cubic-bezier(0.2, 0, 0, 1) both; }
@keyframes sb-fade { from { opacity: 0; } to { opacity: 1; } }
.sb-ver { border: 0; background: transparent; color: var(--brand-600); font-weight: 700; font-size: 14px;
  min-width: 44px; min-height: 44px; padding: 0 12px; border-radius: 12px; cursor: pointer;
  transition: filter 150ms ease-out, background-color 100ms ease-out; }
.sb-ver:hover { filter: brightness(1.07); background: var(--brand-50); }
.sb-ver:active { background: var(--brand-100); }
.sb-ver:focus-visible { outline: 3px solid #3B82F6; outline-offset: 2px; }
.sb-ver:disabled { cursor: progress; }
@media (prefers-reduced-motion: reduce) { .sb-skel, .sb-enter { animation: none; } }
`;


/** «application/pdf» → «PDF», «image/jpeg» → «JPG», «pdf» → «PDF». */
function formatLabel(format?: string | null): string | null {
  if (!format) return null;
  const kind = format.includes("/") ? format.split("/").pop()! : format;
  return (kind === "jpeg" ? "jpg" : kind).toUpperCase();
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === new Date().getFullYear() ? base : `${base} ${d.getFullYear()}`;
}

function expiryLabel(expiresAt: string | null | undefined): string {
  if (!expiresAt) return "Enlace seguro · sin vencimiento";
  const ms = new Date(expiresAt).getTime() - Date.now();
  const hours = Math.round(ms / 3_600_000);
  if (hours < 1) return "Vence en menos de 1 h";
  if (hours < 48) return `Vence en ${hours} h`;
  return `Vence el ${dayLabel(expiresAt)}`;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function Logo() {
  return <Image src="/helu-logo.png" alt="Helu" width={72} height={24} style={{ height: 24, width: "auto" }} priority />;
}

/** Expired, revoked or wrong token: same message, no patient data (mockup «enlace vencido»). */
function Unavailable({ missingToken = false }: { missingToken?: boolean }) {
  return (
    <div style={page}>
      <header style={top}>
        <Logo />
      </header>
      <main style={{ ...main, alignItems: "center", textAlign: "center", paddingTop: 90, gap: 12 }}>
        <IconTile round size="lg" tone="neutral" icon={<Link2 size={24} strokeWidth={2.2} />} />
        <Typography variant="h2">{missingToken ? "Enlace incompleto" : "Este enlace ya no está disponible"}</Typography>
        <div style={{ maxWidth: 320 }}>
          <Typography variant="body" color="secondary">
            {missingToken
              ? "Pídele a quien te lo compartió que te envíe el enlace completo."
              : "Venció o la persona lo revocó. Pídele a quien te lo compartió que genere uno nuevo desde Helu."}
          </Typography>
        </div>
      </main>
    </div>
  );
}

function DocumentRow({ token, doc }: { token: string; doc: SharedBackpack["documents"][number] }) {
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState(false);
  const isLink = doc.kind === "LINK";

  const open = async () => {
    setFailed(false);
    setOpening(true);
    // Opened in the click so the browser does not block it; filled once the signed URL arrives.
    const tab = window.open("", "_blank");
    try {
      const { url } = await getSharedBackpackDocumentUrl(token, doc.id);
      if (tab) {
        tab.opener = null;
        tab.location.href = url;
      } else {
        window.location.href = url;
      }
    } catch {
      tab?.close();
      setFailed(true);
    } finally {
      setOpening(false);
    }
  };

  const meta = [doc.uploadedAt ? dayLabel(doc.uploadedAt) : null, isLink ? "Portal del laboratorio" : formatLabel(doc.format)]
    .filter(Boolean)
    .join(" · ");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
      <IconTile tone="document" icon={isLink ? <Globe size={19} strokeWidth={2.2} /> : <FileText size={19} strokeWidth={2.2} />} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)", overflowWrap: "anywhere" }}>{doc.title}</div>
        <Typography variant="bodySm" color={failed ? "error" : "secondary"}>
          {failed ? "No se pudo abrir. Intenta de nuevo." : meta}
        </Typography>
      </div>
      <button type="button" className="sb-ver" onClick={() => void open()} disabled={opening} aria-label={`Ver ${doc.title}`}>
        {opening ? "Abriendo…" : "Ver"}
      </button>
    </div>
  );
}

/** §6c: skeleton with the shape of the page (header real, cards as grey blocks); never a full-screen spinner. */
function LoadingSkeleton() {
  return (
    <div style={page} aria-busy="true">
      <style>{PAGE_CSS}</style>
      <span className="sr-only">Cargando documentos</span>
      <header style={top}>
        <Logo />
      </header>
      <main style={main}>
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 14 }}>
          <div className="sb-skel" style={{ width: 48, height: 48, borderRadius: "50%" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="sb-skel" style={{ width: "70%", height: 16 }} />
            <div className="sb-skel" style={{ width: "45%", height: 12 }} />
          </div>
        </div>
        <section style={{ ...card, paddingTop: 6, paddingBottom: 6 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
              <div className="sb-skel" style={{ width: 40, height: 40, borderRadius: 13 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className="sb-skel" style={{ width: "70%", height: 14 }} />
                <div className="sb-skel" style={{ width: "45%", height: 12 }} />
              </div>
              <div className="sb-skel" style={{ width: 44, height: 20 }} />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

function ShareBackpackInner() {
  const token = useSearchParams().get("token");
  const query = useQuery({
    queryKey: ["shared-backpack", token],
    queryFn: () => consumeSharedBackpack(token!),
    enabled: Boolean(token),
    retry: (count, err) => !(isApiError(err) && (err.status === 400 || err.status === 404)) && count < 2,
    // Each read records a view: do not refetch on focus.
    refetchOnWindowFocus: false,
  });

  if (!token) return <Unavailable missingToken />;

  if (query.isLoading) return <LoadingSkeleton />;

  if (query.isError) {
    const err = query.error;
    if (isApiError(err) && (err.status === 400 || err.status === 404)) return <Unavailable />;
    return (
      <div style={page}>
        <header style={top}>
          <Logo />
        </header>
        <main style={{ ...main, alignItems: "center", textAlign: "center", paddingTop: 90, gap: 12 }}>
          <Typography variant="h2">No pudimos cargar los documentos</Typography>
          <Typography variant="body" color="secondary">
            Revisa tu conexión e intenta de nuevo.
          </Typography>
          <Button variant="primary" onPress={() => void query.refetch()} loading={query.isFetching} loadingLabel="Reintentando…">
            Reintentar
          </Button>
        </main>
      </div>
    );
  }

  const data = query.data!;
  const who = data.sharedByName?.trim() || "Alguien";
  const count = data.documents.length;

  return (
    <div style={page}>
      <style>{PAGE_CSS}</style>
      <header style={top}>
        <Logo />
        <span style={{ flex: 1 }} />
        <Chip label={expiryLabel(data.expiresAt)} tone="success" icon={<ShieldCheck size={12} />} />
      </header>
      <main style={main} className="sb-enter">
        <div style={{ ...card, display: "flex", alignItems: "center", gap: 14 }}>
          <div
            aria-hidden
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--brand-100)",
              color: "var(--brand-700)",
              display: "grid",
              placeItems: "center",
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {initials(who) || "H"}
          </div>
          <div style={{ minWidth: 0 }}>
            <Typography variant="h3">{who} compartió contigo</Typography>
            <Typography variant="bodySm" color="secondary">
              {data.name} · {count} {count === 1 ? "documento" : "documentos"} · solo lectura
            </Typography>
          </div>
        </div>

        <section style={{ ...card, paddingTop: 6, paddingBottom: 6 }} aria-label="Documentos">
          {count === 0 ? (
            <div style={{ padding: "12px 0" }}>
              <Typography variant="body" color="secondary">
                Esta mochila no tiene documentos por ahora.
              </Typography>
            </div>
          ) : (
            data.documents.map((doc) => <DocumentRow key={doc.id} token={token} doc={doc} />)
          )}
        </section>

        <div style={{ textAlign: "center" }}>
          <Typography variant="bodySm" color="secondary">
            Helu protege estos datos: el acceso vence y la persona puede revocarlo.
          </Typography>
        </div>
      </main>
    </div>
  );
}

export default function ShareBackpackPage() {
  return (
    <Suspense
      fallback={<LoadingSkeleton />}
    >
      <ShareBackpackInner />
    </Suspense>
  );
}
