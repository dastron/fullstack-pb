/**
 * Rule validator for PocketBase API rule expressions
 *
 * Validates permission rule expressions against PocketBase syntax rules,
 * including field references, @request references, and basic syntax validation.
 */

import { APIRuleType, RuleExpression } from "../schema/permissions";
import { FieldDefinition } from "./types";

/**
 * Validation result for rule expressions
 */
export interface RuleValidationResult {
  /** Whether the rule expression is valid */
  valid: boolean;

  /** List of validation errors */
  errors: string[];

  /** List of validation warnings */
  warnings: string[];

  /** List of field references found in the expression */
  fieldReferences: string[];
}

/**
 * Rule expression validator
 *
 * Validates PocketBase API rule expressions for:
 * - Field reference existence and validity
 * - @request reference syntax
 * - Basic expression syntax (parentheses, operators)
 * - Auth collection specific rules (manageRule)
 */
export class RuleValidator {
  private fields: Map<string, FieldDefinition>;
  private collectionName: string;
  private isAuthCollection: boolean;

  constructor(collectionName: string, fields: FieldDefinition[], isAuthCollection: boolean = false) {
    this.collectionName = collectionName;
    this.fields = new Map(fields.map((f) => [f.name, f]));
    this.isAuthCollection = isAuthCollection;

    // Add system fields that are always available in PocketBase
    this.addSystemFields();
  }

  /**
   * Add system fields that are always available in PocketBase collections
   * These fields are automatically added by PocketBase and can be referenced in rules
   */
  private addSystemFields(): void {
    // Base system fields available in all collections
    const systemFields: FieldDefinition[] = [
      { name: "id", type: "text", required: true, options: {} },
      { name: "created", type: "date", required: true, options: {} },
      { name: "updated", type: "date", required: true, options: {} },
      { name: "collectionId", type: "text", required: true, options: {} },
      { name: "collectionName", type: "text", required: true, options: {} },
    ];

    // Auth collection specific system fields
    if (this.isAuthCollection) {
      systemFields.push(
        { name: "email", type: "email", required: true, options: {} },
        { name: "emailVisibility", type: "bool", required: false, options: {} },
        { name: "verified", type: "bool", required: false, options: {} },
        { name: "tokenKey", type: "text", required: true, options: {} },
        { name: "password", type: "text", required: true, options: {} }
      );
    }

    // Add system fields to the fields map (don't overwrite user-defined fields)
    for (const field of systemFields) {
      if (!this.fields.has(field.name)) {
        this.fields.set(field.name, field);
      }
    }
  }

  /**
   * Validate a rule expression
   *
   * @param ruleType - The type of rule being validated
   * @param expression - The rule expression to validate
   * @returns Validation result with errors, warnings, and field references
   */
  validate(ruleType: APIRuleType, expression: RuleExpression): RuleValidationResult {
    const result: RuleValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      fieldReferences: [],
    };

    // Null means locked (superuser only) - always valid
    if (expression === null) {
      return result;
    }

    // Empty string means public - always valid but warn
    if (expression === "") {
      result.warnings.push(`${ruleType} is public - anyone can perform this operation`);
      return result;
    }

    // Validate manageRule only for auth collections
    if (ruleType === "manageRule" && !this.isAuthCollection) {
      result.valid = false;
      result.errors.push("manageRule is only valid for auth collections");
      return result;
    }

    // Extract and validate field references
    const fieldRefs = this.extractFieldReferences(expression);
    result.fieldReferences = fieldRefs;

    for (const fieldRef of fieldRefs) {
      this.validateFieldReference(fieldRef, result);
    }

    // Validate @request references
    this.validateRequestReferences(expression, result);

    // Validate syntax patterns
    this.validateSyntax(expression, result);

    return result;
  }

  /**
   * Extract field references from expression
   *
   * Matches field names that are not @request references.
   * Handles dot notation for relations: user.email, post.author.name
   *
   * @param expression - The rule expression
   * @returns Array of unique field references
   */
  private extractFieldReferences(expression: string): string[] {
    const refs: string[] = [];

    // First, remove string literals and @request references to avoid matching them
    let cleaned = expression.replace(/"[^"]*"/g, '""').replace(/'[^']*'/g, "''");
    cleaned = cleaned.replace(/@request\.[a-zA-Z_][a-zA-Z0-9_.]*/g, "");

    // Match field names (not starting with @)
    // Handles dot notation for relations: user.email, post.author.name
    const fieldPattern = /(?:^|[^@\w])([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)(?=[^a-zA-Z0-9_.]|$)/g;

    let match;
    while ((match = fieldPattern.exec(cleaned)) !== null) {
      const ref = match[1];
      // Exclude PocketBase keywords and operators
      if (!this.isKeyword(ref)) {
        refs.push(ref);
      }
    }

    return [...new Set(refs)]; // Remove duplicates
  }

  /**
   * Check if a word is a PocketBase keyword
   *
   * @param word - The word to check
   * @returns True if the word is a keyword
   */
  private isKeyword(word: string): boolean {
    const keywords = ["true", "false", "null", "AND", "OR", "NOT", "LIKE", "IN"];
    return keywords.includes(word.toUpperCase());
  }

  /**
   * Validate a field reference exists in schema
   *
   * Checks if the root field exists and validates relation chains.
   * For nested references, warns about potential issues since we can't
   * validate across collections without loading related schemas.
   *
   * @param fieldRef - The field reference to validate (e.g., "user" or "user.email")
   * @param result - The validation result to update
   */
  private validateFieldReference(fieldRef: string, result: RuleValidationResult): void {
    const parts = fieldRef.split(".");
    const rootField = parts[0];

    if (!this.fields.has(rootField)) {
      result.errors.push(`Field '${rootField}' does not exist in collection '${this.collectionName}'`);
      result.valid = false;
      return;
    }

    // For nested references, validate relation chain
    if (parts.length > 1) {
      const field = this.fields.get(rootField)!;
      if (field.type !== "relation") {
        result.errors.push(`Field '${rootField}' is not a relation field, cannot access nested property '${parts[1]}'`);
        result.valid = false;
      } else {
        // Note: We can't validate nested fields without loading related schemas
        // This would require cross-schema validation
        result.warnings.push(
          `Nested field reference '${fieldRef}' - ensure target collection has field '${parts.slice(1).join(".")}'`
        );
      }
    }
  }

  /**
   * Validate @request references
   *
   * Checks that @request references follow valid PocketBase patterns:
   * - @request.auth.* - authenticated user data
   * - @request.body.* - request body fields
   * - @request.query.* - query parameters
   * - @request.headers.* - request headers
   * - @request.method - HTTP method
   * - @request.context - execution context
   *
   * @param expression - The rule expression
   * @param result - The validation result to update
   */
  private validateRequestReferences(expression: string, result: RuleValidationResult): void {
    // Find all @request references
    const requestRefs = expression.match(/@request\.[a-zA-Z_][a-zA-Z0-9_.]*/g) || [];

    for (const ref of requestRefs) {
      // Check if the reference starts with a valid pattern
      const isValid =
        ref.startsWith("@request.auth.") ||
        ref === "@request.method" ||
        ref === "@request.context" ||
        ref.startsWith("@request.body.") ||
        ref.startsWith("@request.query.") ||
        ref.startsWith("@request.headers.");

      if (!isValid) {
        result.errors.push(`Invalid @request reference: '${ref}'`);
        result.valid = false;
      }
    }
  }

  /**
   * Validate basic syntax patterns
   *
   * Checks for:
   * - Balanced parentheses
   * - Common operator mistakes (== instead of =)
   *
   * @param expression - The rule expression
   * @param result - The validation result to update
   */
  private validateSyntax(expression: string, result: RuleValidationResult): void {
    // Check for balanced parentheses
    let parenCount = 0;
    for (const char of expression) {
      if (char === "(") parenCount++;
      if (char === ")") parenCount--;
      if (parenCount < 0) {
        result.errors.push("Unbalanced parentheses in expression");
        result.valid = false;
        return;
      }
    }
    if (parenCount !== 0) {
      result.errors.push("Unbalanced parentheses in expression");
      result.valid = false;
    }

    // Warn about common mistakes
    if (expression.includes("==")) {
      result.warnings.push("Use '=' instead of '==' for equality comparison in PocketBase rules");
    }
  }
}
