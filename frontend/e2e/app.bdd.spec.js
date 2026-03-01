import { test, expect } from "@playwright/test";
import { mockBackendRoutes, openApp, seedMyStandsInLocalStorage } from "./support/mockBackend.js";

function navButton(page, name) {
  return page.getByRole("navigation").getByRole("button", { name });
}

test.describe("Feature: Primary navigation", function () {
  test("Scenario: Given app start, when user switches tabs, then each main screen is reachable", async function ({ page }) {
    await mockBackendRoutes(page);
    await openApp(page);

    await expect(page.getByRole("heading", { name: "Zirndorfer Garagen-Flohmarkt" })).toBeVisible();

    await navButton(page, "Karte").click();
    await expect(page.getByRole("heading", { name: "Interaktive Karte" })).toBeVisible();

    await navButton(page, "Info").click();
    await expect(page.getByRole("heading", { name: "Infos und FAQ" })).toBeVisible();

    await navButton(page, "Start").click();
    await expect(page.getByRole("button", { name: "Stände auf der Karte entdecken" })).toBeVisible();
  });

  test("Scenario: Given info screen, when user opens a FAQ item, then answer content is visible", async function ({ page }) {
    await mockBackendRoutes(page);
    await openApp(page);

    await navButton(page, "Info").click();
    await page.getByRole("button", { name: "Brauche ich eine Genehmigung?" }).click();

    await expect(page.getByText("keine Genehmigung nötig", { exact: false })).toBeVisible();
  });
});

test.describe("Feature: Register and manage own stand", function () {
  test("Scenario: Given registration flow, when user completes all steps, then success and local ownership actions work", async function ({ page }) {
    const state = await mockBackendRoutes(page);
    await openApp(page);

    await page.getByRole("button", { name: "Eigenen Stand anmelden" }).click();

    await expect(page.getByRole("heading", { name: "Stand anmelden" })).toBeVisible();

    await page.getByPlaceholder("z.B. Bahnhofstr. 12").fill("E2E Straße 99");
    await page.getByRole("button", { name: "Weiter" }).click();

    await page.getByRole("button", { name: "Bücher" }).click();
    await page.getByPlaceholder("z.B. Kinderkleidung Gr. 92-140, Playmobil...").fill("Viele Bücher und Spiele");
    await page.getByRole("button", { name: "Weiter" }).click();

    await page.getByRole("button", { name: "Jetzt anmelden" }).click();

    await expect(page.getByRole("heading", { name: "Anmeldung erfolgreich!" })).toBeVisible();
    await page.getByRole("button", { name: "Link kopieren" }).click();
    await expect(page.getByRole("button", { name: "Link kopiert!" })).toBeVisible();

    const created = state.stands.find(function (stand) {
      return stand.address === "E2E Straße 99";
    });
    await seedMyStandsInLocalStorage(page, [{ id: created.id, address: created.address, label: created.label, editSecret: created.editSecret }]);

    await navButton(page, "Start").click();
    await expect(page.getByText("E2E Straße 99", { exact: false })).toBeVisible();

    await page.getByRole("button", { name: "Bearbeiten" }).first().click();
    await expect(page.getByRole("heading", { name: "Stand bearbeiten" })).toBeVisible();

    await page.getByRole("button", { name: "Weiter" }).click();
    await page.getByPlaceholder("z.B. Kinderkleidung Gr. 92-140, Playmobil...").fill("Aktualisierte Beschreibung");
    await page.getByRole("button", { name: "Weiter" }).click();
    await page.getByRole("button", { name: "Änderungen speichern" }).click();
    await expect(page.getByRole("heading", { name: "Änderungen gespeichert" })).toBeVisible();

    await navButton(page, "Start").click();
    page.once("dialog", function (dialog) {
      dialog.accept();
    });
    await page.getByRole("button", { name: "Stand löschen" }).first().click();
    await expect(page.getByText("E2E Straße 99", { exact: false })).toHaveCount(0);
  });
});

test.describe("Feature: Map interactions", function () {
  test("Scenario: Given map view, when user filters and opens a stand, then stand details are shown", async function ({ page }) {
    await mockBackendRoutes(page);
    await openApp(page);

    await navButton(page, "Karte").click();
    await expect(page.getByRole("heading", { name: "Interaktive Karte" })).toBeVisible();

    await page.getByRole("button", { name: "Filter anzeigen" }).click();
    await page.getByRole("button", { name: "Bücher" }).first().click();

    await page.getByRole("button", { name: /Bücherwurm Zirndorf|Teststand Nord/ }).first().click();
    await expect(page.getByRole("button", { name: "Route hierhin" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Navigation öffnen" })).toBeVisible();
  });
});
