import type { Stand, StandPublic } from "./types";

async function listStandIds(kv: KVNamespace): Promise<string[]> {
    const ids: string[] = [];
    let cursor: string | undefined;

    do {
        const page = await kv.list({
            prefix: "stand:",
            cursor,
        });

        for (const key of page.keys) {
            const id = key.name.slice("stand:".length);
            if (id) ids.push(id);
        }

        cursor = page.list_complete ? undefined : page.cursor;
    } while (cursor);

    return ids;
}

async function getStand(kv: KVNamespace, id: string): Promise<Stand | null> {
    return kv.get<Stand>(`stand:${id}`, "json");
}

function toPublic(s: Stand): StandPublic {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { editSecret: _s, ...pub } = s;
    return pub;
}

export { listStandIds, getStand, toPublic };
