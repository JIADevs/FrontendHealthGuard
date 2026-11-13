---
name: navigation-setup
description: >
  Configura y extiende la navegación en la app Helu.
  Mobile usa React Navigation (native-stack + bottom-tabs).
  Web usa Next.js App Router (file-based).
  Usar cuando se agregue una nueva pantalla, se configure autenticación con rutas protegidas,
  se implemente deep linking, se armen tabs o stacks, o se pase parámetros entre pantallas.
---

# Navigation Setup — Helu

## Arquitectura de navegación

| Plataforma | Librería | Patrón |
|-----------|----------|--------|
| **Mobile** | `@react-navigation/native-stack` + `bottom-tabs` | Stack-based, programático |
| **Web** | Next.js App Router | File-based, `app/` directory |

---

## Mobile — React Navigation

### Estructura de archivos

```
apps/mobile/src/
├── navigation/
│   ├── RootNavigator.tsx    ← Stack principal (auth + app)
│   ├── TabNavigator.tsx     ← Bottom tabs (Dashboard, Agenda, Docs, Backpacks)
│   └── navigationRef.ts    ← Ref global para navegación desde hooks
├── screens/
│   ├── LoginScreen.tsx
│   ├── SignupScreen.tsx
│   ├── DashboardScreen.tsx
│   ├── AgendaScreen.tsx
│   ├── DocumentsScreen.tsx
│   ├── BackpacksScreen.tsx
│   └── ...DetailScreen.tsx
```

### RootNavigator — Stack con auth guard

```tsx
// apps/mobile/src/navigation/RootNavigator.tsx
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "@helu/stores";

export type RootStackParamList = {
  Auth: undefined;
  Signup: undefined;
  MainTabs: undefined;
  Scanner: { backpackId?: string } | undefined;
  DocumentUpload: { backpackId?: string } | undefined;
  DocumentDetail: { id: string; title?: string } | undefined;
  DocumentEdit: { id: string } | undefined;
  Notifications: undefined;
  Profile: undefined;
  BackpackDetail: { id: string };
  BackpackEdit: { id?: string } | undefined;
  BackpackAddDocuments: { id: string };
  ShareDocuments: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const token = useAuthStore((s) => s.token);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="DocumentDetail"
            component={DocumentDetailScreen}
            options={{ headerShown: true, title: "Documento" }}
          />
          {/* ... más pantallas autenticadas */}
        </>
      ) : (
        <>
          <Stack.Screen name="Auth" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}
```

### Patrón de auth guard

El guard es implícito: el `RootNavigator` renderiza condicionalmente según `token`:
- `token` existe → pantallas autenticadas (MainTabs + stacks)
- `token` es null → pantallas de auth (Login, Signup)

**No** se usa middleware ni redirects — Zustand reactivo maneja la transición automáticamente.

### Agregar una pantalla nueva

1. Agregar tipo en `RootStackParamList`:
   ```ts
   NewFeature: { id: string };
   ```

2. Crear pantalla en `src/screens/NewFeatureScreen.tsx`

3. Registrar en `RootNavigator.tsx`:
   ```tsx
   <Stack.Screen
     name="NewFeature"
     component={NewFeatureScreen}
     options={{ headerShown: true, title: "Nueva Feature" }}
   />
   ```

4. Navegar desde cualquier pantalla:
   ```tsx
   navigation.navigate("NewFeature", { id: "123" });
   ```

### Presentación de modales

```tsx
<Stack.Screen
  name="Scanner"
  component={ScannerScreen}
  options={{
    presentation: "fullScreenModal",
    animation: "slide_from_bottom",
  }}
/>
```

### Navigation ref (para usar fuera de componentes)

```tsx
// apps/mobile/src/navigation/navigationRef.ts
import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./RootNavigator";

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Uso desde un hook o servicio:
navigationRef.navigate("DocumentDetail", { id: "abc" });
```

---

## Web — Next.js App Router

### Estructura de archivos

```
apps/web/src/app/
├── layout.tsx              ← RootLayout (providers, CSS vars)
├── login/page.tsx          ← Login (no autenticado)
├── signup/page.tsx         ← Signup (no autenticado)
├── (app)/                  ← Grupo autenticado
│   ├── layout.tsx          ← AppLayout (sidebar + auth guard)
│   ├── dashboard/page.tsx
│   ├── agenda/page.tsx
│   ├── documents/
│   │   ├── page.tsx
│   │   └── _components/    ← Componentes colocados
│   ├── backpacks/page.tsx
│   ├── profile/page.tsx
│   └── share/page.tsx
```

### Auth guard en web

El layout del grupo `(app)` verifica el token y redirige:

```tsx
// apps/web/src/app/(app)/layout.tsx
"use client";
import { useAuthStore } from "@helu/stores";
import { useRouter } from "next/navigation";

export default function AppLayout({ children }) {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  if (!token) {
    router.replace("/login");
    return null;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

### Agregar una página nueva

1. Crear carpeta en `src/app/(app)/nueva-feature/`
2. Crear `page.tsx` con `"use client"` si necesita estado
3. La ruta se genera automáticamente: `/nueva-feature`

---

## Reglas

- **Mobile**: Siempre tipar `RootStackParamList` al agregar pantallas
- **Mobile**: Usar `options.presentation: "fullScreenModal"` para modales
- **Mobile**: Imports de pantallas siempre desde `../screens/`
- **Web**: Auth guard vive en `(app)/layout.tsx`, no en cada página
- **Web**: Componentes co-locados van en `_components/` dentro de la ruta
- **Ambos**: Deep linking scheme es `helu://` (configurar en app.json)
