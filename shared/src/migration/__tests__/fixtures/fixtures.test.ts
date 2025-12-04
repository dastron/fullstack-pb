import { existsSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("Test Fixtures Setup", () => {
  it("should have reference-migrations directory", () => {
    const fixturesPath = join(__dirname, "reference-migrations");
    expect(existsSync(fixturesPath)).toBe(true);
  });

  it("should have schemas directory", () => {
    const schemasPath = join(__dirname, "schemas");
    expect(existsSync(schemasPath)).toBe(true);
  });

  it("should have snapshots directory", () => {
    const snapshotsPath = join(__dirname, "snapshots");
    expect(existsSync(snapshotsPath)).toBe(true);
  });

  it("should have reference migrations copied", () => {
    const referenceMigrationsPath = join(__dirname, "reference-migrations");
    const files = readdirSync(referenceMigrationsPath);

    // Filter out non-JS files
    const jsFiles = files.filter((f) => f.endsWith(".js"));

    expect(jsFiles.length).toBeGreaterThan(0);
    expect(jsFiles).toContain("1764625712_created_create_new_collection_with_columns.js");
    expect(jsFiles).toContain("1764625735_created_create_new_collection_blank.js");
    expect(jsFiles).toContain("1764625772_created_create_new_collection_with_unique_index.js");
  });

  it("should have required dependencies available", async () => {
    // Test that we can import the required dependencies
    const fastCheck = await import("fast-check");
    const babelParser = await import("@babel/parser");
    const diff = await import("diff");
    const chalk = await import("chalk");

    expect(fastCheck).toBeDefined();
    expect(babelParser).toBeDefined();
    expect(diff).toBeDefined();
    expect(chalk).toBeDefined();
  });
});
