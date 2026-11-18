# Helu Frontend — Arquitectura técnica

Cómo está construido el frontend de Helu: monorepo, flujo de datos, estado, navegación y estrategia multiplataforma.

El producto y las features (PRDs, flujos, detalle de frontend por módulo) viven en el repo **`BackendHealthGuard`**, en [`.docs/`](https://github.com/JIADevs/BackendHealthGuard/tree/main/.docs). Este directorio documenta solo lo transversal al frontend.

## Por dónde empezar

1. [Arquitectura](./architecture/README.md): estructura del monorepo, reglas de dependencia y decisiones técnicas.
2. [Técnico](./technical/README.md): setup, build, testing y problemas conocidos.
3. [Diseño](./design/README.md): sistema de diseño objetivo (rediseño B) y mockups de todas las pantallas.

## Estructura

| Carpeta | Contenido | Pregunta que responde |
|---------|-----------|-----------------------|
| `architecture/` | Monorepo, datos, estado, navegación, multiplataforma, design system | ¿Cómo está construido el frontend? |
| `architecture/packages/` | Un documento por paquete (`api`, `ui`, `stores`, `config`) | ¿Qué responsabilidad tiene cada paquete? |
| `architecture/apps/` | Un documento por app (`mobile`, `web`) | ¿Cómo está organizada cada app? |
| `architecture/adr/` | Decisiones técnicas del frontend | ¿Por qué se decidió así? |
| `technical/` | Setup, build y release, testing, troubleshooting | ¿Cómo trabajo en el frontend? |
| `design/` | Sistema de diseño (MASTER, reglas por módulo, tokens, componentes) y mockups HTML | ¿Cómo debe verse y comportarse la interfaz? |

## Relación con otras fuentes

| Fuente | Rol |
|--------|-----|
| `.docs/` | Estado actual de la arquitectura del frontend |
| `AGENTS.md` + `.agents/skills/` | Instrucciones y convenciones para agentes; apuntan a `.docs/`, nunca al revés |
| `openspec/` | Artefactos por cambio; al archivar un change, reflejar el resultado en `.docs/` |
| `BackendHealthGuard/.docs/` | Producto, features y arquitectura general del sistema |
