import type { Session, Stand } from "./types";

async function isAuthorized(
    body: Record<string, unknown>,
    stand: Stand,
    kv: KVNamespace
): Promise<boolean> {
    if (body.editSecret && body.editSecret === stand.editSecret) return true;
    if (typeof body.sessionToken === "string") {
        const session = await kv.get<Session>(`session:${body.sessionToken}`, "json");
        if (
            session &&
            session.expiresAt > Date.now() &&
            (
                session.userToken === stand.editSecret ||
                session.standId === stand.id
            )
        ) {
            return true;
        }
    }
    return false;
}

export { isAuthorized };
