export function decodeJwtPayload(token: string): Record<string, unknown> {
    try {
        const [, payload] = token.split(".");
        if (!payload) {
            return {};
        }

        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
        const decoded = atob(padded);
        return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
        return {};
    }
}

export function isJwtExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);
    const exp = typeof payload.exp === "number" ? payload.exp : null;

    if (!exp) {
        return false;
    }

    return exp * 1000 <= Date.now();
}
