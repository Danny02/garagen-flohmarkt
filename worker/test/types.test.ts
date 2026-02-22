import { describe, expectTypeOf, it } from "vitest";
import type { Challenge, Session, Stand, StandPublic, StoredCredential } from "../src/types";

describe("types", () => {
  it("defines expected structural relationships", () => {
    expectTypeOf<StandPublic>().toEqualTypeOf<Omit<Stand, "editSecret">>();
    expectTypeOf<StoredCredential>().toMatchTypeOf<{ userToken: string; publicKey: string }>();
    expectTypeOf<Session>().toMatchTypeOf<{ userToken: string; expiresAt: number }>();
    expectTypeOf<Challenge>().toMatchTypeOf<{ challenge: string; expiresAt: number }>();
  });
});
