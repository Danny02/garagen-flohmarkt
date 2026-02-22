import { describe, expect, it, vi } from "vitest";
import { authenticateWithPasskey, registerPasskey } from "./passkey.js";

describe("passkey", () => {
  it("registerPasskey posts credential data and returns credential id", async () => {
    const createMock = vi.fn().mockResolvedValue({
      rawId: new Uint8Array([1, 2, 3]).buffer,
      response: {
        getPublicKey: () => new Uint8Array([4, 5, 6]).buffer,
        getPublicKeyAlgorithm: () => -7,
        clientDataJSON: new Uint8Array([7, 8, 9]).buffer,
      },
    });

    Object.defineProperty(window, "PublicKeyCredential", {
      value: function PublicKeyCredential() {},
      configurable: true,
    });
    Object.defineProperty(navigator, "credentials", {
      value: { create: createMock },
      configurable: true,
    });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ challengeId: "c1", challenge: "AQID" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      });

    const credentialId = await registerPasskey("stand-1", "secret-1");
    expect(typeof credentialId).toBe("string");
    expect(createMock).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("authenticateWithPasskey returns session payload", async () => {
    const getMock = vi.fn().mockResolvedValue({
      rawId: new Uint8Array([1, 2, 3]).buffer,
      response: {
        authenticatorData: new Uint8Array([4, 5, 6]).buffer,
        clientDataJSON: new Uint8Array([7, 8, 9]).buffer,
        signature: new Uint8Array([10, 11, 12]).buffer,
      },
    });

    Object.defineProperty(window, "PublicKeyCredential", {
      value: function PublicKeyCredential() {},
      configurable: true,
    });
    Object.defineProperty(navigator, "credentials", {
      value: { get: getMock },
      configurable: true,
    });

    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ challengeId: "c2", challenge: "AQID" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessionToken: "sess-1", credentialId: "cred-1" }),
      });

    const result = await authenticateWithPasskey();
    expect(result.sessionToken).toBe("sess-1");
    expect(getMock).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
