import { b64urlDecode } from "./base64url";

function parseAsn1Length(bytes: Uint8Array, offset: number): { length: number; next: number } | null {
    if (offset >= bytes.length) return null;
    const first = bytes[offset];
    if ((first & 0x80) === 0) {
        return { length: first, next: offset + 1 };
    }
    const numBytes = first & 0x7f;
    if (numBytes === 0 || numBytes > 2 || offset + 1 + numBytes > bytes.length) return null;
    let length = 0;
    for (let i = 0; i < numBytes; i++) {
        length = (length << 8) | bytes[offset + 1 + i];
    }
    return { length, next: offset + 1 + numBytes };
}

function derEcdsaToRawSignature(sig: Uint8Array, fieldSize = 32): Uint8Array | null {
    if (sig.length < 8 || sig[0] !== 0x30) return null;

    const seqLen = parseAsn1Length(sig, 1);
    if (!seqLen) return null;
    let idx = seqLen.next;
    if (idx + seqLen.length !== sig.length) return null;

    if (idx >= sig.length || sig[idx] !== 0x02) return null;
    const rLen = parseAsn1Length(sig, idx + 1);
    if (!rLen) return null;
    idx = rLen.next;
    const rEnd = idx + rLen.length;
    if (rEnd > sig.length) return null;
    let r = sig.slice(idx, rEnd);
    idx = rEnd;

    if (idx >= sig.length || sig[idx] !== 0x02) return null;
    const sLen = parseAsn1Length(sig, idx + 1);
    if (!sLen) return null;
    idx = sLen.next;
    const sEnd = idx + sLen.length;
    if (sEnd > sig.length) return null;
    let s = sig.slice(idx, sEnd);

    while (r.length > 0 && r[0] === 0x00) r = r.slice(1);
    while (s.length > 0 && s[0] === 0x00) s = s.slice(1);
    if (r.length > fieldSize || s.length > fieldSize) return null;

    const out = new Uint8Array(fieldSize * 2);
    out.set(r, fieldSize - r.length);
    out.set(s, fieldSize * 2 - s.length);
    return out;
}

async function verifyWebAuthnAssertion(
    assertion: {
        credentialId: string;
        authenticatorData: string;
        clientDataJSON: string;
        signature: string;
    },
    storedPublicKey: string,
    storedAlg: number | undefined,
    storedChallenge: string,
    allowedOrigins: string[] | null
): Promise<true | string> {
    const clientDataBytes = b64urlDecode(assertion.clientDataJSON);
    const clientData = JSON.parse(new TextDecoder().decode(clientDataBytes)) as {
        type: string;
        challenge: string;
        origin: string;
    };

    if (clientData.type !== "webauthn.get") return "clientData.type mismatch";
    if (clientData.challenge !== storedChallenge) return "challenge mismatch";
    if (allowedOrigins && !allowedOrigins.includes(clientData.origin)) {
        return `origin not allowed: ${clientData.origin}`;
    }

    const authDataBytes = new Uint8Array(b64urlDecode(assertion.authenticatorData));
    const rpId = new URL(clientData.origin).hostname;
    const expectedRpIdHash = new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rpId))
    );
    for (let i = 0; i < 32; i++) {
        if (authDataBytes[i] !== expectedRpIdHash[i]) return "rpId hash mismatch";
    }

    if (!(authDataBytes[32] & 0x01)) return "user not present";

    const clientDataHash = await crypto.subtle.digest("SHA-256", clientDataBytes);
    const verifyData = new Uint8Array(authDataBytes.length + 32);
    verifyData.set(authDataBytes);
    verifyData.set(new Uint8Array(clientDataHash), authDataBytes.length);

    const spki = b64urlDecode(storedPublicKey);
    const signatureBuffer = b64urlDecode(assertion.signature);

    async function verifyWithEcdsa(): Promise<boolean> {
        const publicKey = await crypto.subtle.importKey(
            "spki",
            spki,
            { name: "ECDSA", namedCurve: "P-256" },
            false,
            ["verify"]
        );

        const signatureBytes = new Uint8Array(signatureBuffer);
        const rawSignature = derEcdsaToRawSignature(signatureBytes);

        const candidates: Uint8Array[] = [];
        if (signatureBytes.length === 64) {
            candidates.push(signatureBytes);
        }
        if (rawSignature) {
            candidates.push(rawSignature);
        }
        if (signatureBytes.length !== 64) {
            candidates.push(signatureBytes);
        }

        for (const candidate of candidates) {
            try {
                const ok = await crypto.subtle.verify(
                    { name: "ECDSA", hash: "SHA-256" },
                    publicKey,
                    candidate,
                    verifyData
                );
                if (ok) return true;
            } catch {
                // try next candidate encoding
            }
        }

        return false;
    }

    async function verifyWithRsaPkcs1(): Promise<boolean> {
        const publicKey = await crypto.subtle.importKey(
            "spki",
            spki,
            { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
            false,
            ["verify"]
        );
        return crypto.subtle.verify(
            { name: "RSASSA-PKCS1-v1_5" },
            publicKey,
            signatureBuffer,
            verifyData
        );
    }

    try {
        if (storedAlg === -257) {
            return (await verifyWithRsaPkcs1()) ? true : "signature verification failed";
        }
        if (storedAlg === -7 || storedAlg == null) {
            try {
                return (await verifyWithEcdsa()) ? true : "signature verification failed";
            } catch {
                if (storedAlg == null) {
                    return (await verifyWithRsaPkcs1()) ? true : "signature verification failed";
                }
                throw new Error("ecdsa verification failed");
            }
        }
        return `unsupported public key algorithm: ${storedAlg}`;
    } catch {
        return "signature verification failed";
    }
}

export { verifyWebAuthnAssertion };
