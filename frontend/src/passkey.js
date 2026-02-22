import { API_BASE } from "./constants.js";
import { b64url, b64urlDec } from "./utils.js";

async function getChallenge() {
  const res = await fetch(`${API_BASE}/api/webauthn/challenge`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Could not get challenge");
  return res.json();
}

export async function registerPasskey(standId, editSecret, accountName) {
  if (!window.PublicKeyCredential) throw new Error("WebAuthn not supported");
  const { challengeId, challenge } = await getChallenge();
  const normalizedAccountName =
    typeof accountName === "string" && accountName.trim().length > 0
      ? accountName.trim().slice(0, 64)
      : "Mein Flohmarktstand";
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: b64urlDec(challenge),
      rp: { name: "Zirndorfer Garagen-Flohmarkt", id: location.hostname },
      user: {
        id: new TextEncoder().encode(standId),
        name: normalizedAccountName,
        displayName: normalizedAccountName,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 },
        { type: "public-key", alg: -257 },
      ],
      timeout: 60000,
      attestation: "none",
      authenticatorSelection: {
        residentKey: "preferred",
        userVerification: "preferred",
      },
    },
  });
  if (!cred) throw new Error("Credential creation cancelled");

  const publicKeySpki = cred.response.getPublicKey?.();
  if (!publicKeySpki)
    throw new Error("getPublicKey() not supported – try a newer browser");
  const algorithm = cred.response.getPublicKeyAlgorithm?.();

  const res = await fetch(
    `${API_BASE}/api/stands/${standId}/webauthn/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        editSecret,
        challengeId,
        credentialId: b64url(cred.rawId),
        publicKey: b64url(publicKeySpki),
        algorithm: typeof algorithm === "number" ? algorithm : undefined,
        clientDataJSON: b64url(cred.response.clientDataJSON),
      }),
    },
  );
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || "Passkey registration failed");
  }
  return b64url(cred.rawId);
}

export async function authenticateWithPasskey(credentialId) {
  if (!window.PublicKeyCredential) throw new Error("WebAuthn not supported");
  const { challengeId, challenge } = await getChallenge();

  const allowCredentials = credentialId
    ? [{ type: "public-key", id: b64urlDec(credentialId) }]
    : [];

  const cred = await navigator.credentials.get({
    publicKey: {
      challenge: b64urlDec(challenge),
      rpId: location.hostname,
      allowCredentials,
      userVerification: "preferred",
      timeout: 60000,
    },
  });
  if (!cred) throw new Error("Authentication cancelled");

  const res = await fetch(`${API_BASE}/api/webauthn/authenticate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      challengeId,
      credentialId: b64url(cred.rawId),
      authenticatorData: b64url(cred.response.authenticatorData),
      clientDataJSON: b64url(cred.response.clientDataJSON),
      signature: b64url(cred.response.signature),
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || "Passkey authentication failed");
  }
  return res.json();
}
