"use client";

import { useState } from "react";
import { Bell, Calendar, ChevronRight, FileText, Pill, Plus, Trash2, X, Backpack, Sparkles, Check } from "lucide-react";
import {
  Button,
  IconButton,
  IconTile,
  Typography,
  Chip,
  Card,
  ListRow,
  DangerLink,
  type Tone,
  type ButtonVariant,
} from "@helu/ui";

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "success", "streak", "danger", "ghost"];
const TONES: Tone[] = ["neutral", "brand", "success", "warning", "danger", "info", "ai", "streak", "mission", "medication", "appointment", "document", "backpack", "treatment", "wellbeing", "notification"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Typography variant="eyebrow" color="secondary">{title}</Typography>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>{children}</div>
    </section>
  );
}

export function ComponentsPreview() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [selected, setSelected] = useState("1 día antes");

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: 32, display: "flex", flexDirection: "column", gap: 32, background: "var(--color-bg)", minHeight: "100vh" }}>
      <header style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <Typography variant="h1">Componentes v2</Typography>
          <Typography variant="meta">@helu/ui · Fase 0.2a (issue #35). Solo en desarrollo.</Typography>
        </div>
        <Button variant="secondary" size="sm" onPress={toggleTheme}>{theme === "light" ? "Modo oscuro" : "Modo claro"}</Button>
      </header>

      <Section title="Button · variantes (md)">
        {VARIANTS.map((v) => <Button key={v} variant={v}>{v}</Button>)}
      </Section>
      <Section title="Button · tamaños, ícono y estados">
        <Button size="sm" icon={<Plus size={16} />}>Nueva cita</Button>
        <Button size="md" icon={<Check size={16} />} variant="success">Tomar</Button>
        <Button size="lg" iconPosition="end" icon={<ChevronRight size={18} />}>Continuar</Button>
        <Button loading loadingLabel="Guardando…">Guardar</Button>
        <Button disabled>Deshabilitado</Button>
      </Section>

      <Section title="IconButton e IconTile">
        <IconButton icon={<Bell size={18} />} accessibilityLabel="Notificaciones" badge />
        <IconButton icon={<Bell size={18} />} accessibilityLabel="Notificaciones" badge={12} />
        <IconButton icon={<X size={18} />} accessibilityLabel="Cerrar" tone="tint" />
        <IconTile icon={<Pill size={19} />} tone="medication" />
        <IconTile icon={<Calendar size={19} />} tone="appointment" />
        <IconTile icon={<FileText size={19} />} tone="document" />
        <IconTile icon={<Backpack size={19} />} tone="backpack" />
        <IconTile icon={<Sparkles size={24} />} tone="ai" size="lg" round />
      </Section>

      <Section title="Typography · roles v2">
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <Typography variant="display">12 días</Typography>
          <Typography variant="eyebrow" color="brand">Paso 4 de 6 · ahora</Typography>
          <Typography variant="h2">Título de sección</Typography>
          <Typography variant="data">Metformina 850 mg</Typography>
          <Typography variant="meta">1:00 p. m. · 1 tableta</Typography>
          <Typography variant="body" color="error">Elige la fecha de la cita.</Typography>
        </div>
      </Section>

      <Section title="Chip · tonos">
        {TONES.map((t) => <Chip key={t} label={t} tone={t} />)}
      </Section>
      <Section title="Chip · opción (44 px, ✓)">
        {["Sin recordatorio", "1 hora antes", "1 día antes"].map((o) => (
          <Chip key={o} variant="option" label={o} selected={selected === o} onPress={() => setSelected(o)} />
        ))}
        <Chip label="v1 green" color="green" />
        <Chip label="v1 amber" color="amber" />
      </Section>

      <Section title="Card · variantes y tonos">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, width: "100%" }}>
          <Card title="Control de odontología" subtitle="Jue 5 nov · 10:00 a. m." icon={<Calendar size={19} color="var(--color-feature-appointment-fg)" />} iconBackground="var(--color-feature-appointment-bg)" />
          <Card title="Seleccionada" subtitle="Abierta en el panel de detalle" variant="selected" />
          <Card title="Compacta" subtitle="Padding 12" variant="compact" />
          <Card title="12 días de racha" subtitle="Tono streak" tone="streak" />
          <Card title="Clasificado por IA" subtitle="Tono ai" tone="ai" />
          <Card title="Check-in hecho" subtitle="Tono success" tone="success" />
        </div>
      </Section>

      <Section title="ListRow y DangerLink">
        <div style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: 12, background: "var(--color-surface)", padding: 16, borderRadius: 18 }}>
          <ListRow icon={<Pill size={19} />} tone="medication" title="Metformina 850 mg" meta="1:00 p. m. · 1 tableta" trailing={<Button size="sm" variant="success">Tomar</Button>} />
          <ListRow icon={<FileText size={19} />} tone="document" title="Orden médica · Resonancia de rodilla derecha con contraste" meta="28 oct · Orden" trailing={<ChevronRight size={18} color="var(--color-text-muted)" />} onPress={() => {}} />
          <ListRow icon={<Backpack size={19} />} tone="backpack" title="Cita de ortopedia" meta="3 documentos" />
          <DangerLink label="Eliminar documento" icon={<Trash2 size={16} />} onPress={() => {}} />
        </div>
      </Section>
    </main>
  );
}
