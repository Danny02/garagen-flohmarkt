export interface Env {
    GARAGEN_KV: KVNamespace;
    /**
     * Comma-separated list of allowed WebAuthn origins.
     * e.g. "https://garagen-flohmarkt.pages.dev,http://localhost:5173"
     * If unset, origin checking is skipped (dev-only).
     */
    ALLOWED_ORIGINS?: string;
}

export interface Stand {
    id: string;
    label?: string;
    address: string;
    plz: string;
    district: string;
    desc: string;
    categories: string[];
    time_from: string;
    time_to: string;
    lat?: number;
    lng?: number;
    open: boolean;
    approved: boolean;
    createdAt: string;
    editSecret: string;
}

export type StandPublic = Omit<Stand, "editSecret">;

export interface Challenge {
    challenge: string;
    expiresAt: number;
}

export interface StoredCredential {
    userToken: string;
    // legacy field kept for backwards compatibility with older stored data
    standId?: string;
    publicKey: string;
    alg?: number;
}

export interface Session {
    userToken: string;
    // legacy field kept for backwards compatibility with older sessions
    standId?: string;
    expiresAt: number;
}
