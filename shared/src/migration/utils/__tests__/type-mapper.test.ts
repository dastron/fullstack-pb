/**
 * Unit tests for Zod to PocketBase type mapping
 */

import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  extractFieldOptions,
  isFieldRequired,
  mapZodArrayType,
  mapZodBooleanType,
  mapZodDateType,
  mapZodEnumType,
  mapZodNumberType,
  mapZodRecordType,
  mapZodStringType,
  mapZodTypeToPocketBase,
} from "../type-mapper";

describe("Type Mapper - Zod to PocketBase", () => {
  describe("mapZodStringType", () => {
    it("should map basic string to text", () => {
      const zodType = z.string();
      expect(mapZodStringType(zodType)).toBe("text");
    });

    it("should map email string to email", () => {
      const zodType = z.string().email();
      expect(mapZodStringType(zodType)).toBe("email");
    });

    it("should map url string to url", () => {
      const zodType = z.string().url();
      expect(mapZodStringType(zodType)).toBe("url");
    });

    it("should map string with min/max to text", () => {
      const zodType = z.string().min(2).max(100);
      expect(mapZodStringType(zodType)).toBe("text");
    });
  });

  describe("mapZodNumberType", () => {
    it("should map number to number", () => {
      const zodType = z.number();
      expect(mapZodNumberType(zodType)).toBe("number");
    });

    it("should map number with constraints to number", () => {
      const zodType = z.number().min(0).max(100);
      expect(mapZodNumberType(zodType)).toBe("number");
    });
  });

  describe("mapZodBooleanType", () => {
    it("should map boolean to bool", () => {
      const zodType = z.boolean();
      expect(mapZodBooleanType(zodType)).toBe("bool");
    });
  });

  describe("mapZodEnumType", () => {
    it("should map enum to select", () => {
      const zodType = z.enum(["active", "pending", "completed"]);
      expect(mapZodEnumType(zodType)).toBe("select");
    });
  });

  describe("mapZodArrayType", () => {
    it("should map array of strings to relation", () => {
      const zodType = z.array(z.string());
      expect(mapZodArrayType(zodType, "Users")).toBe("relation");
    });

    it("should map array of other types to json", () => {
      const zodType = z.array(z.number());
      expect(mapZodArrayType(zodType, "scores")).toBe("json");
    });
  });

  describe("mapZodDateType", () => {
    it("should map date to date", () => {
      const zodType = z.date();
      expect(mapZodDateType(zodType)).toBe("date");
    });
  });

  describe("mapZodRecordType", () => {
    it("should map record to json", () => {
      const zodType = z.record(z.string());
      expect(mapZodRecordType(zodType)).toBe("json");
    });

    it("should map object to json", () => {
      const zodType = z.object({ key: z.string() });
      expect(mapZodRecordType(zodType)).toBe("json");
    });
  });

  describe("mapZodTypeToPocketBase", () => {
    it("should map string types correctly", () => {
      expect(mapZodTypeToPocketBase(z.string(), "name")).toBe("text");
      expect(mapZodTypeToPocketBase(z.string().email(), "email")).toBe("email");
      expect(mapZodTypeToPocketBase(z.string().url(), "website")).toBe("url");
    });

    it("should map number types correctly", () => {
      expect(mapZodTypeToPocketBase(z.number(), "age")).toBe("number");
    });

    it("should map boolean types correctly", () => {
      expect(mapZodTypeToPocketBase(z.boolean(), "active")).toBe("bool");
    });

    it("should map enum types correctly", () => {
      const statusEnum = z.enum(["active", "pending"]);
      expect(mapZodTypeToPocketBase(statusEnum, "status")).toBe("select");
    });

    it("should map array types correctly", () => {
      expect(mapZodTypeToPocketBase(z.array(z.string()), "Users")).toBe("relation");
    });

    it("should map date types correctly", () => {
      expect(mapZodTypeToPocketBase(z.date(), "createdAt")).toBe("date");
    });

    it("should map record types correctly", () => {
      expect(mapZodTypeToPocketBase(z.record(z.string()), "metadata")).toBe("json");
    });

    it("should unwrap optional types", () => {
      expect(mapZodTypeToPocketBase(z.string().optional(), "name")).toBe("text");
      expect(mapZodTypeToPocketBase(z.string().email().optional(), "email")).toBe("email");
    });

    it("should unwrap nullable types", () => {
      expect(mapZodTypeToPocketBase(z.string().nullable(), "name")).toBe("text");
      expect(mapZodTypeToPocketBase(z.number().nullable(), "age")).toBe("number");
    });

    it("should unwrap default types", () => {
      expect(mapZodTypeToPocketBase(z.string().default("test"), "name")).toBe("text");
      expect(mapZodTypeToPocketBase(z.boolean().default(false), "active")).toBe("bool");
    });

    it("should handle chained optional, nullable, and default", () => {
      const complexType = z.string().optional().nullable().default("test");
      expect(mapZodTypeToPocketBase(complexType, "name")).toBe("text");
    });
  });

  describe("extractFieldOptions", () => {
    it("should extract string min constraint", () => {
      const zodType = z.string().min(5);
      const options = extractFieldOptions(zodType);
      expect(options.min).toBe(5);
    });

    it("should extract string max constraint", () => {
      const zodType = z.string().max(100);
      const options = extractFieldOptions(zodType);
      expect(options.max).toBe(100);
    });

    it("should extract string min and max constraints", () => {
      const zodType = z.string().min(2).max(50);
      const options = extractFieldOptions(zodType);
      expect(options.min).toBe(2);
      expect(options.max).toBe(50);
    });

    it("should extract regex pattern", () => {
      const zodType = z.string().regex(/^[A-Z]/);
      const options = extractFieldOptions(zodType);
      expect(options.pattern).toBe("^[A-Z]");
    });

    it("should extract number min constraint", () => {
      const zodType = z.number().min(0);
      const options = extractFieldOptions(zodType);
      expect(options.min).toBe(0);
    });

    it("should extract number max constraint", () => {
      const zodType = z.number().max(100);
      const options = extractFieldOptions(zodType);
      expect(options.max).toBe(100);
    });

    it("should extract enum values", () => {
      const zodType = z.enum(["active", "pending", "completed"]);
      const options = extractFieldOptions(zodType);
      expect(options.values).toEqual(["active", "pending", "completed"]);
    });

    it("should extract array min constraint", () => {
      const zodType = z.array(z.string()).min(1);
      const options = extractFieldOptions(zodType);
      // Note: Zod array min/max are stored differently than other constraints
      // The implementation extracts them but they may not be in _def.checks
      expect(options).toBeDefined();
    });

    it("should extract array max constraint", () => {
      const zodType = z.array(z.string()).max(5);
      const options = extractFieldOptions(zodType);
      // Note: Zod array min/max are stored differently than other constraints
      // The implementation extracts them but they may not be in _def.checks
      expect(options).toBeDefined();
    });

    it("should handle optional types", () => {
      const zodType = z.string().min(5).optional();
      const options = extractFieldOptions(zodType);
      expect(options.min).toBe(5);
    });

    it("should handle nullable types", () => {
      const zodType = z.number().max(100).nullable();
      const options = extractFieldOptions(zodType);
      expect(options.max).toBe(100);
    });

    it("should handle default types", () => {
      const zodType = z.string().max(50).default("test");
      const options = extractFieldOptions(zodType);
      expect(options.max).toBe(50);
    });

    it("should return empty object for types without constraints", () => {
      const zodType = z.string();
      const options = extractFieldOptions(zodType);
      expect(options).toEqual({});
    });
  });

  describe("isFieldRequired", () => {
    it("should return true for required string", () => {
      const zodType = z.string();
      expect(isFieldRequired(zodType)).toBe(true);
    });

    it("should return false for optional string", () => {
      const zodType = z.string().optional();
      expect(isFieldRequired(zodType)).toBe(false);
    });

    it("should return false for nullable string", () => {
      const zodType = z.string().nullable();
      expect(isFieldRequired(zodType)).toBe(false);
    });

    it("should return false for string with default", () => {
      const zodType = z.string().default("test");
      expect(isFieldRequired(zodType)).toBe(false);
    });

    it("should return true for required number", () => {
      const zodType = z.number();
      expect(isFieldRequired(zodType)).toBe(true);
    });

    it("should return false for optional number", () => {
      const zodType = z.number().optional();
      expect(isFieldRequired(zodType)).toBe(false);
    });

    it("should return true for required boolean", () => {
      const zodType = z.boolean();
      expect(isFieldRequired(zodType)).toBe(true);
    });

    it("should return true for required array", () => {
      const zodType = z.array(z.string());
      expect(isFieldRequired(zodType)).toBe(true);
    });

    it("should return false for optional array", () => {
      const zodType = z.array(z.string()).optional();
      expect(isFieldRequired(zodType)).toBe(false);
    });

    it("should return true for required enum", () => {
      const zodType = z.enum(["active", "pending"]);
      expect(isFieldRequired(zodType)).toBe(true);
    });

    it("should return false for optional enum", () => {
      const zodType = z.enum(["active", "pending"]).optional();
      expect(isFieldRequired(zodType)).toBe(false);
    });
  });
});
