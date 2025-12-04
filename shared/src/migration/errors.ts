/**
 * Custom error classes for migration tool
 * Provides specific error types for better error handling and user feedback
 */

/**
 * Base error class for all migration-related errors
 */
export class MigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MigrationError";
    Object.setPrototypeOf(this, MigrationError.prototype);
  }
}

/**
 * Error thrown when schema parsing fails
 * Used when Zod schemas cannot be parsed or are invalid
 */
export class SchemaParsingError extends MigrationError {
  public readonly filePath?: string;
  public readonly originalError?: Error;

  constructor(message: string, filePath?: string, originalError?: Error) {
    super(message);
    this.name = "SchemaParsingError";
    this.filePath = filePath;
    this.originalError = originalError;
    Object.setPrototypeOf(this, SchemaParsingError.prototype);
  }

  /**
   * Creates a formatted error message with file path and original error details
   */
  public getDetailedMessage(): string {
    const parts: string[] = [this.message];

    if (this.filePath) {
      parts.push(`\nFile: ${this.filePath}`);
    }

    if (this.originalError) {
      parts.push(`\nCause: ${this.originalError.message}`);
    }

    return parts.join("");
  }
}

/**
 * Error thrown when snapshot operations fail
 * Used for snapshot file read/write/parse errors
 */
export class SnapshotError extends MigrationError {
  public readonly snapshotPath?: string;
  public readonly operation?: "read" | "write" | "parse" | "validate";
  public readonly originalError?: Error;

  constructor(
    message: string,
    snapshotPath?: string,
    operation?: "read" | "write" | "parse" | "validate",
    originalError?: Error
  ) {
    super(message);
    this.name = "SnapshotError";
    this.snapshotPath = snapshotPath;
    this.operation = operation;
    this.originalError = originalError;
    Object.setPrototypeOf(this, SnapshotError.prototype);
  }

  /**
   * Creates a formatted error message with snapshot path and operation details
   */
  public getDetailedMessage(): string {
    const parts: string[] = [this.message];

    if (this.operation) {
      parts.push(`\nOperation: ${this.operation}`);
    }

    if (this.snapshotPath) {
      parts.push(`\nSnapshot: ${this.snapshotPath}`);
    }

    if (this.originalError) {
      parts.push(`\nCause: ${this.originalError.message}`);
    }

    return parts.join("");
  }
}

/**
 * Error thrown when migration file generation fails
 * Used when migration files cannot be created or written
 */
export class MigrationGenerationError extends MigrationError {
  public readonly migrationPath?: string;
  public readonly originalError?: Error;

  constructor(message: string, migrationPath?: string, originalError?: Error) {
    super(message);
    this.name = "MigrationGenerationError";
    this.migrationPath = migrationPath;
    this.originalError = originalError;
    Object.setPrototypeOf(this, MigrationGenerationError.prototype);
  }

  /**
   * Creates a formatted error message with migration path and original error details
   */
  public getDetailedMessage(): string {
    const parts: string[] = [this.message];

    if (this.migrationPath) {
      parts.push(`\nMigration: ${this.migrationPath}`);
    }

    if (this.originalError) {
      parts.push(`\nCause: ${this.originalError.message}`);
    }

    return parts.join("");
  }
}

/**
 * Error thrown when file system operations fail
 * Used for directory creation, file permissions, disk space issues
 */
export class FileSystemError extends MigrationError {
  public readonly path?: string;
  public readonly operation?: "read" | "write" | "create" | "delete" | "access";
  public readonly code?: string;
  public readonly originalError?: Error;

  constructor(
    message: string,
    path?: string,
    operation?: "read" | "write" | "create" | "delete" | "access",
    code?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = "FileSystemError";
    this.path = path;
    this.operation = operation;
    this.code = code;
    this.originalError = originalError;
    Object.setPrototypeOf(this, FileSystemError.prototype);
  }

  /**
   * Creates a formatted error message with path, operation, and error code details
   */
  public getDetailedMessage(): string {
    const parts: string[] = [this.message];

    if (this.operation) {
      parts.push(`\nOperation: ${this.operation}`);
    }

    if (this.path) {
      parts.push(`\nPath: ${this.path}`);
    }

    if (this.code) {
      parts.push(`\nError Code: ${this.code}`);
    }

    if (this.originalError) {
      parts.push(`\nCause: ${this.originalError.message}`);
    }

    return parts.join("");
  }
}
