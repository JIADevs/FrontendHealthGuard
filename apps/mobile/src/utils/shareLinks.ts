import { env } from "@helu/config";

/**
 * Reemplaza localhost / 127.0.0.1 en la URL por el host público de la web (IP LAN, etc.)
 * cuando `EXPO_PUBLIC_WEB_APP_URL` está definido (típico en Docker + teléfono físico).
 */
export function resolveExpoReachableUrl(url: string): string {
    const base = env.WEB_APP_PUBLIC_URL?.trim();
    if (!base || !url) return url;
    try {
        const u = new URL(url);
        if (u.hostname !== "localhost" && u.hostname !== "127.0.0.1") return url;
        const normalizedBase = base.replace(/\/$/, "");
        const b = new URL(normalizedBase);
        u.protocol = b.protocol;
        u.hostname = b.hostname;
        u.port = b.port;
        return u.toString();
    } catch {
        return url;
    }
}

/** Misma fuente que el backend para el QR, pero con el enlace ya reescrito para el dispositivo. */
export function qrCodeImageUriForShareUrl(shareUrl: string): string {
    const data = encodeURIComponent(resolveExpoReachableUrl(shareUrl));
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${data}`;
}
