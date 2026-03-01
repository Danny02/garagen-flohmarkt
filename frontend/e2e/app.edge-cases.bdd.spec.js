import { test, expect } from "@playwright/test";
import {
  captureWindowOpen,
  forceInitialOnlineState,
  getOpenedUrls,
  mockBackendRoutes,
  mockGeolocation,
  mockPasskeyApis,
  openApp,
  seedMyStandsInLocalStorage,
} from "./support/mockBackend.js";

function navButton(page, namePattern) {
  return page.getByRole("navigation").getByRole("button", { name: namePattern });
}

async function completeRegistration(page, address) {
  await page.getByRole("button", { name: "Eigenen Stand anmelden" }).click();
  await expect(page.getByRole("heading", { name: "Stand anmelden" })).toBeVisible();

  await page.getByPlaceholder("z.B. Bahnhofstr. 12").fill(address);
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByRole("button", { name: "Bücher" }).click();
  await page.getByRole("button", { name: "Weiter" }).click();
  await page.getByRole("button", { name: "Jetzt anmelden" }).click();

  await expect(page.getByRole("heading", { name: "Anmeldung erfolgreich!" })).toBeVisible();
}

test.describe("Feature: Route and navigation behavior", function () {
  test("Scenario: Given denied geolocation, when route is requested, then location error is shown", async function ({ page }) {
    await mockGeolocation(page, { mode: "denied" });
    await mockBackendRoutes(page);
    await openApp(page);

    await navButton(page, /Karte/).click();
    await page.getByRole("button", { name: /Teststand Nord/ }).click();
    await page.getByRole("button", { name: "Route hierhin" }).click();

    await expect(page.getByText("Standortzugriff blockiert").first()).toBeVisible();
  });

  test("Scenario: Given selected stand, when user opens navigation, then google maps URL is opened", async function ({ page }) {
    await mockGeolocation(page, { mode: "success", permissionState: "prompt" });
    await captureWindowOpen(page);
    await mockBackendRoutes(page);
    await openApp(page);

    await navButton(page, /Karte/).click();
    await page.getByRole("button", { name: /Teststand Nord/ }).click();
    await page.getByRole("button", { name: "Route hierhin" }).click();

    await expect(page.getByRole("button", { name: "Route hierhin" })).toBeVisible();
    await page.getByRole("button", { name: "Navigation öffnen" }).click();

    const openedUrls = await getOpenedUrls(page);
    expect(openedUrls.length).toBeGreaterThan(0);
    expect(openedUrls[0]).toContain("google.com/maps/dir/?api=1");
    expect(openedUrls[0]).toContain("destination=");
  });
});

test.describe("Feature: Passkey user journeys", function () {
  test("Scenario: Given registration success, when passkey setup succeeds, then success state is shown", async function ({ page }) {
    await mockPasskeyApis(page, { support: true, createMode: "success" });
    await mockBackendRoutes(page);
    await openApp(page);

    await completeRegistration(page, "Passkeystraße 1");
    await page.getByRole("button", { name: "Passkey jetzt einrichten" }).click();

    await expect(page.getByText("Passkey eingerichtet!")).toBeVisible();
  });

  test("Scenario: Given registration success, when passkey setup fails, then error is displayed", async function ({ page }) {
    await mockPasskeyApis(page, { support: true, createMode: "success" });
    await mockBackendRoutes(page, { failPasskeyRegister: true });
    await openApp(page);

    await completeRegistration(page, "Passkeystraße 2");
    await page.getByRole("button", { name: "Passkey jetzt einrichten" }).click();

    await expect(page.getByText("Passkey registration failed")).toBeVisible();
  });

  test("Scenario: Given no local stands, when recovery passkey login succeeds, then owned stands are restored", async function ({ page }) {
    await mockPasskeyApis(page, { support: true, getMode: "success" });
    await mockBackendRoutes(page);
    await openApp(page);

    await page.getByRole("button", { name: "Mit Passkey anmelden" }).click();

    await expect(page.getByText("Teststraße 21")).toBeVisible();
    await expect(page.getByRole("button", { name: "Bearbeiten" })).toBeVisible();
  });

  test("Scenario: Given local stand with credential, when passkey login succeeds, then edit mode opens", async function ({ page }) {
    await mockPasskeyApis(page, { support: true, getMode: "success" });
    await mockBackendRoutes(page);
    await page.goto("/");

    await seedMyStandsInLocalStorage(page, [{ id: 201, address: "Teststraße 21", credentialId: "cred-e2e" }]);
    await page.reload();

    await page.getByRole("button", { name: "Mit Passkey anmelden" }).click();
    await expect(page.getByRole("heading", { name: "Stand bearbeiten" })).toBeVisible();
  });

  test("Scenario: Given expired passkey session, when edit is attempted, then session-expired error is shown", async function ({ page }) {
    await mockBackendRoutes(page);
    await page.goto("/");

    await seedMyStandsInLocalStorage(page, [{ id: 201, address: "Teststraße 21", credentialId: "cred-e2e", sessionToken: "expired-token" }]);
    await page.reload();

    await page.getByRole("button", { name: "Bearbeiten" }).click();

    await expect(page.getByText("Passkey-Sitzung abgelaufen", { exact: false })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Zirndorfer Garagen-Flohmarkt" })).toBeVisible();
  });
});

test.describe("Feature: Deep-link and offline restrictions", function () {
  test("Scenario: Given valid edit link, when app opens online, then register edit form is prefilled", async function ({ page }) {
    await mockBackendRoutes(page);

    await page.goto("/?edit=201&secret=secret-201");
    await expect(page.getByRole("heading", { name: "Stand bearbeiten" })).toBeVisible();
    await expect(page.locator('input[value="Teststraße 21"]').first()).toBeVisible();
  });

  test("Scenario: Given edit link while offline, when app opens, then edit is blocked with message", async function ({ page }) {
    await forceInitialOnlineState(page, false);
    await mockBackendRoutes(page);

    await page.goto("/?edit=201&secret=secret-201");

    await expect(page.getByText("Offline: Bearbeiten ist nur mit Internet möglich.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Zirndorfer Garagen-Flohmarkt" })).toBeVisible();
  });

  test("Scenario: Given /register opened offline, when app initializes, then it redirects and disables write actions", async function ({ page }) {
    await forceInitialOnlineState(page, false);
    await mockBackendRoutes(page);

    await page.goto("/register");

    await expect(page.getByText("Offline: Anmeldung, Bearbeitung und Löschen sind nur mit Internet möglich.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Zirndorfer Garagen-Flohmarkt" })).toBeVisible();
    await expect(navButton(page, /Anmelden/)).toBeDisabled();
    await expect(page.getByRole("button", { name: "Eigenen Stand anmelden" })).toBeDisabled();
  });
});
