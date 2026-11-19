"""Genera tokens.json (formato DTCG de tres capas) para el sistema de diseño de Helu.

Uso (desde esta carpeta):
    python build-tokens.py
    node <skill design-system>/scripts/generate-tokens.cjs --config tokens.json -o tokens.css

Editar los valores aquí, no en tokens.json/tokens.css.
"""
import json
from pathlib import Path

C = lambda v: {"$value": v, "$type": "color"}
D = lambda v: {"$value": v, "$type": "dimension"}
F = lambda v: {"$value": v, "$type": "fontFamily"}
W = lambda v: {"$value": v, "$type": "fontWeight"}
T = lambda v: {"$value": v, "$type": "duration"}
B = lambda v: {"$value": v, "$type": "cubicBezier"}

SCALES = {
    "blue": {"50": "#EFF6FF", "100": "#DBEAFE", "200": "#BFDBFE", "300": "#93C5FD", "400": "#60A5FA",
             "500": "#3B82F6", "600": "#2563EB", "700": "#1D4ED8", "800": "#1E40AF", "900": "#1E3A8A"},
    "slate": {"50": "#F8FAFC", "100": "#F1F5F9", "200": "#E2E8F0", "300": "#CBD5E1", "400": "#94A3B8",
              "500": "#64748B", "600": "#475569", "700": "#334155", "800": "#1E293B", "900": "#0F172A",
              "950": "#0C1222"},
    "gray": {"500": "#6B7280"},
    "green": {"50": "#F0FDF4", "100": "#DCFCE7", "200": "#BBF7D0", "400": "#4ADE80", "500": "#22C55E",
              "600": "#16A34A", "700": "#15803D", "800": "#166534"},
    "red": {"50": "#FEF2F2", "200": "#FECACA", "400": "#F87171", "500": "#EF4444", "600": "#DC2626",
            "700": "#B91C1C", "800": "#991B1B"},
    "amber": {"50": "#FFFBEB", "100": "#FEF3C7", "200": "#FDE68A", "300": "#FCD34D", "400": "#FBBF24",
              "500": "#F59E0B", "700": "#B45309", "800": "#92400E"},
    "orange": {"50": "#FFF7ED", "200": "#FED7AA", "300": "#FCD34D", "400": "#FB923C", "500": "#F97316",
               "700": "#C2410C", "800": "#9A3412"},
    "pink": {"50": "#FDF2F8", "300": "#F9A8D4", "500": "#EC4899", "700": "#BE185D"},
    "sky": {"50": "#F0F9FF", "300": "#7DD3FC", "500": "#0EA5E9", "700": "#0369A1"},
    "teal": {"50": "#F0FDFA", "300": "#5EEAD4", "500": "#14B8A6", "700": "#0F766E"},
    "violet": {"50": "#F5F3FF", "300": "#C4B5FD", "500": "#8B5CF6", "700": "#6D28D9"},
    "emerald": {"50": "#ECFDF5", "300": "#6EE7B7", "500": "#10B981", "700": "#047857"},
}


def R(path):
    return "{primitive.color." + path + "}"


def tones(scale):
    return {"bg": C(R(scale + ".50")), "fg": C(R(scale + ".700")), "solid": C(R(scale + ".500"))}


primitive = {
    "color": {**{k: {s: C(x) for s, x in v.items()} for k, v in SCALES.items()}, "white": C("#FFFFFF")},
    "space": {k: D(v) for k, v in {"1": "4px", "2": "8px", "3": "12px", "4": "16px",
                                   "5": "20px", "6": "24px", "8": "32px", "12": "48px"}.items()},
    "radius": {k: D(v) for k, v in {"chip": "999px", "sm": "10px", "md": "14px", "lg": "18px",
                                    "xl": "24px", "sheet": "28px"}.items()},
    "font": {"heading": F("Nunito, Inter, system-ui, sans-serif"), "body": F("Inter, system-ui, sans-serif")},
}

FEATURES = {"mission": "blue", "medication": "amber", "appointment": "pink", "document": "sky",
            "backpack": "teal", "ai": "violet", "treatment": "violet", "wellbeing": "emerald",
            "notification": "blue"}
RGB = {"blue": "59, 130, 246", "amber": "245, 158, 11", "pink": "236, 72, 153", "sky": "14, 165, 233",
       "teal": "20, 184, 166", "violet": "139, 92, 246", "emerald": "16, 185, 129"}

semantic = {
    "color": {
        "brand": {"solid": C(R("blue.600")), "edge": C(R("blue.800")), "tint": C(R("blue.50")),
                  "tint-border": C(R("blue.200")), "text": C(R("blue.700")), "focus": C(R("blue.500"))},
        "bg": C("#F6F8FC"), "surface": C(R("white")), "surface-muted": C(R("slate.100")),
        "border": C(R("slate.200")),
        "text": {"primary": C(R("slate.900")), "secondary": C(R("gray.500")), "muted": C(R("slate.500")),
                 "on-solid": C(R("white"))},
        "success": {"bg": C(R("green.50")), "fg": C(R("green.700")), "solid": C(R("green.700")),
                    "edge": C(R("green.800")), "graphic": C(R("green.500"))},
        "warning": {"bg": C(R("amber.50")), "fg": C(R("amber.700"))},
        "danger": {"bg": C(R("red.50")), "fg": C(R("red.700")), "solid": C(R("red.600")),
                   "edge": C(R("red.800")), "border": C(R("red.200"))},
        "info": {"bg": C(R("sky.50")), "fg": C(R("sky.700"))},
        "feature": {k: tones(s) for k, s in FEATURES.items()},
        "motivation": {"streak": C(R("orange.500")), "streak-light": C(R("orange.300")),
                       "streak-bg": C(R("orange.50")), "streak-border": C(R("orange.200")),
                       "streak-solid": C(R("orange.700")), "streak-edge": C(R("orange.800")),
                       "streak-text": C(R("orange.700")), "level": C(R("amber.500")),
                       "level-edge": C(R("amber.700")), "progress": C(R("green.500")),
                       "track": C(R("slate.200"))},
        "overlay": C("rgba(15, 23, 42, 0.5)"),
    },
    "font": {"heading": F("{primitive.font.heading}"), "body": F("{primitive.font.body}")},
}

component = {
    "button": {"height": D("48px"), "height-sm": D("44px"), "radius": D("{primitive.radius.md}"),
               "edge-width": D("3px"), "font": F("{primitive.font.heading}"), "weight": W("800"),
               "primary-bg": C("{semantic.color.brand.solid}"), "primary-edge": C("{semantic.color.brand.edge}"),
               "success-bg": C("{semantic.color.success.solid}"), "success-edge": C("{semantic.color.success.edge}"),
               "streak-bg": C("{semantic.color.motivation.streak-solid}"),
               "streak-edge": C("{semantic.color.motivation.streak-edge}"),
               "danger-bg": C("{semantic.color.danger.solid}"), "danger-edge": C("{semantic.color.danger.edge}"),
               "secondary-bg": C("{semantic.color.surface}"), "secondary-fg": C("{semantic.color.brand.solid}"),
               "secondary-border": C("{semantic.color.border}")},
    "card": {"bg": C("{semantic.color.surface}"), "border": C("{semantic.color.border}"),
             "radius": D("{primitive.radius.lg}"), "padding": D("16px"), "edge-width": D("3px")},
    "input": {"bg": C("#F8FAFC"), "border": C("{semantic.color.border}"), "border-focus": C("{semantic.color.brand.focus}"),
              "radius": D("{primitive.radius.md}"), "height": D("48px")},
    "chip": {"radius": D("{primitive.radius.chip}"), "font-size": D("12.5px"), "height-option": D("44px")},
    "icon-button": {"size": D("44px")},
    "sheet": {"radius": D("{primitive.radius.sheet}")},
    "modal": {"radius": D("{primitive.radius.xl}"), "width": D("560px")},
    "tile": {"size": D("40px"), "radius": D("13px")},
    "touch": {"min": D("44px")},
    "focus-ring": {"width": D("3px"), "offset": D("2px")},
    "timeline": {"rail": D("3px"), "node": D("30px"), "node-current": D("40px"), "halo": D("5px")},
    "motion": {"instant": T("100ms"), "fast": T("150ms"), "base": T("250ms"), "slow": T("350ms"), "exit": T("220ms"),
               "emphasis": T("700ms"), "celebration": T("1200ms"), "stagger": T("40ms"),
               "ease-out": B("cubic-bezier(0.2, 0, 0, 1)"), "ease-in": B("cubic-bezier(0.4, 0, 1, 1)"),
               "ease-standard": B("cubic-bezier(0.2, 0, 0, 1)"), "ease-spring": B("cubic-bezier(0.34, 1.56, 0.64, 1)")},
}

dark = {
    "color": {
        "brand": {"solid": C(R("blue.500")), "edge": C(R("blue.700")), "tint": C("rgba(59, 130, 246, 0.14)"),
                  "tint-border": C("rgba(59, 130, 246, 0.3)"), "text": C(R("blue.300")), "focus": C(R("blue.400"))},
        "bg": C(R("slate.950")), "surface": C(R("slate.800")), "surface-muted": C(R("slate.900")),
        "border": C(R("slate.700")),
        "text": {"primary": C(R("slate.50")), "secondary": C(R("slate.400")), "muted": C(R("slate.400")),
                 "on-solid": C(R("white"))},
        "success": {"bg": C("rgba(34, 197, 94, 0.12)"), "fg": C(R("green.400"))},
        "warning": {"bg": C("rgba(245, 158, 11, 0.12)"), "fg": C(R("amber.400"))},
        "danger": {"bg": C("rgba(239, 68, 68, 0.12)"), "fg": C(R("red.400"))},
        "info": {"bg": C("rgba(14, 165, 233, 0.12)"), "fg": C(R("sky.300"))},
        "feature": {k: {"bg": C(f"rgba({RGB[s]}, 0.12)"), "fg": C(R(s + ".300"))} for k, s in FEATURES.items()},
        "motivation": {"streak-bg": C("rgba(249, 115, 22, 0.12)"), "streak-border": C("rgba(249, 115, 22, 0.35)"),
                       "streak-text": C(R("orange.400")), "track": C(R("slate.700"))},
    }
}

def as_var(node):
    """Los tokens de componente apuntan a variables semánticas (var(--color-…)) para seguir el modo oscuro."""
    for v in node.values():
        if isinstance(v, dict) and "$value" in v:
            val = v["$value"]
            if isinstance(val, str) and val.startswith("{semantic."):
                v["$value"] = "var(--" + val[len("{semantic."):-1].replace(".", "-") + ")"
        elif isinstance(v, dict):
            as_var(v)


as_var(component)

doc = {
    "$schema": "https://design-tokens.org/schema.json",
    "$description": "Helu · Sistema de diseño B (Equilibrada). Reglas en MASTER.md",
    "primitive": primitive, "semantic": semantic, "component": component, "dark": {"semantic": dark},
}
out = Path(__file__).with_name("tokens.json")
out.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
print("Generado:", out)
