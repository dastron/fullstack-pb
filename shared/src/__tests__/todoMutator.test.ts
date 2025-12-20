import type { ListResult, RecordService } from "pocketbase";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { TodoMutator } from "../mutator/todoMutator";
import { TodoInputSchema } from "../schema";
import type { TodoInputType, TodoType, TypedPocketBase } from "../types";

// Mock the TodoInputSchema
vi.mock("../schema", () => ({
  TodoInputSchema: {
    parse: vi.fn(),
  },
}));

describe("TodoMutator", () => {
  let mockPb: TypedPocketBase;
  let mockCollection: RecordService<TodoType>;
  let todoMutator: TodoMutator;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockTodo: TodoType = {
    id: "todo-123",
    title: "Test Todo",
    description: "Test Description",
    completed: false,
    User: "user-123",
    created: "2024-01-01T00:00:00.000Z",
    updated: "2024-01-01T00:00:00.000Z",
    collectionId: "todos",
    collectionName: "todos",
  };

  const mockTodoInput: TodoInputType = {
    title: "Test Todo",
    description: "Test Description",
    completed: false,
    User: "user-123",
  };

  beforeEach(() => {
    // Suppress console.error logs during tests
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Reset all mocks
    vi.clearAllMocks();

    // Create mock collection service
    mockCollection = {
      create: vi.fn(),
      update: vi.fn(),
      getOne: vi.fn(),
      getFirstListItem: vi.fn(),
      getList: vi.fn(),
      delete: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    } as unknown as RecordService<TodoType>;

    // Create mock PocketBase instance
    mockPb = {
      collection: vi.fn().mockReturnValue(mockCollection),
    } as unknown as TypedPocketBase;

    // Create TodoMutator instance
    todoMutator = new TodoMutator(mockPb);
  });

  afterEach(() => {
    // Restore console.error after each test
    consoleErrorSpy.mockRestore();
  });

  describe("Constructor and Defaults", () => {
    it("should initialize with default options", () => {
      const mutator = new TodoMutator(mockPb);
      expect(mutator).toBeInstanceOf(TodoMutator);
    });

    it("should allow overriding default options", () => {
      const mutator = new TodoMutator(mockPb, {
        expand: ["User"],
        filter: ["completed = false"],
        sort: ["created"],
      });
      expect(mutator).toBeInstanceOf(TodoMutator);
    });
  });

  describe("getCollection", () => {
    it("should return the Todos collection", () => {
      const collection = (todoMutator as any).getCollection();
      expect(mockPb.collection).toHaveBeenCalledWith("Todos");
      expect(collection).toBe(mockCollection);
    });
  });

  describe("validateInput", () => {
    it("should validate input using TodoInputSchema", async () => {
      const mockParsed = { ...mockTodoInput };
      (TodoInputSchema.parse as any).mockReturnValue(mockParsed);

      const result = await (todoMutator as any).validateInput(mockTodoInput);

      expect(TodoInputSchema.parse).toHaveBeenCalledWith(mockTodoInput);
      expect(result).toEqual(mockParsed);
    });

    it("should throw error when validation fails", async () => {
      const validationError = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "undefined",
          path: ["title"],
          message: "Title is required",
        },
      ]);
      (TodoInputSchema.parse as any).mockImplementation(() => {
        throw validationError;
      });

      await expect((todoMutator as any).validateInput({})).rejects.toThrow(ZodError);
      expect(TodoInputSchema.parse).toHaveBeenCalled();
    });
  });

  describe("create", () => {
    it("should create a todo successfully", async () => {
      const mockParsed = { ...mockTodoInput };
      (TodoInputSchema.parse as any).mockReturnValue(mockParsed);
      (mockCollection.create as any).mockResolvedValue(mockTodo);

      const result = await todoMutator.create(mockTodoInput);

      expect(TodoInputSchema.parse).toHaveBeenCalledWith(mockTodoInput);
      expect(mockCollection.create).toHaveBeenCalledWith(mockParsed);
      expect(result).toEqual(mockTodo);
    });

    it("should handle validation errors during create", async () => {
      const validationError = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "undefined",
          path: ["title"],
          message: "Title is required",
        },
      ]);
      (TodoInputSchema.parse as any).mockImplementation(() => {
        throw validationError;
      });

      await expect(todoMutator.create({} as TodoInputType)).rejects.toThrow(ZodError);
      expect(mockCollection.create).not.toHaveBeenCalled();
    });

    it("should handle collection errors during create", async () => {
      const mockParsed = { ...mockTodoInput };
      const collectionError = new Error("Collection error");
      (TodoInputSchema.parse as any).mockReturnValue(mockParsed);
      (mockCollection.create as any).mockRejectedValue(collectionError);

      await expect(todoMutator.create(mockTodoInput)).rejects.toThrow("Collection error");
    });
  });

  describe("update", () => {
    it("should update a todo successfully", async () => {
      const updateData = { title: "Updated Todo", completed: true };
      (mockCollection.update as any).mockResolvedValue({ ...mockTodo, ...updateData });

      const result = await todoMutator.update("todo-123", updateData);

      expect(mockCollection.update).toHaveBeenCalledWith("todo-123", updateData);
      expect(result).toEqual({ ...mockTodo, ...updateData });
    });

    it("should handle errors during update", async () => {
      const updateError = new Error("Update failed");
      (mockCollection.update as any).mockRejectedValue(updateError);

      await expect(todoMutator.update("todo-123", { title: "New Title" })).rejects.toThrow("Update failed");
    });
  });

  describe("getById", () => {
    it("should get a todo by id successfully", async () => {
      (mockCollection.getOne as any).mockResolvedValue(mockTodo);

      const result = await todoMutator.getById("todo-123");

      expect(mockCollection.getOne).toHaveBeenCalledWith("todo-123", {});
      expect(result).toEqual(mockTodo);
    });

    it("should return null when todo is not found", async () => {
      const notFoundError = new Error("404 Not Found");
      (mockCollection.getOne as any).mockRejectedValue(notFoundError);

      const result = await todoMutator.getById("non-existent");

      expect(result).toBeNull();
    });

    it("should handle expand parameter", async () => {
      (mockCollection.getOne as any).mockResolvedValue(mockTodo);

      await todoMutator.getById("todo-123", "User");

      expect(mockCollection.getOne).toHaveBeenCalledWith("todo-123", { expand: "User" });
    });
  });

  describe("getFirstByFilter", () => {
    it("should get first todo by filter successfully", async () => {
      (mockCollection.getFirstListItem as any).mockResolvedValue(mockTodo);

      const result = await todoMutator.getFirstByFilter("completed = false");

      expect(mockCollection.getFirstListItem).toHaveBeenCalledWith("completed = false", { sort: "-updated" });
      expect(result).toEqual(mockTodo);
    });

    it("should return null when no todo matches filter", async () => {
      const notFoundError = new Error("404 Not Found");
      (mockCollection.getFirstListItem as any).mockRejectedValue(notFoundError);

      const result = await todoMutator.getFirstByFilter("completed = true");

      expect(result).toBeNull();
    });

    it("should handle expand and sort parameters", async () => {
      (mockCollection.getFirstListItem as any).mockResolvedValue(mockTodo);

      await todoMutator.getFirstByFilter("completed = false", "User", "-created");

      expect(mockCollection.getFirstListItem).toHaveBeenCalledWith("completed = false", {
        expand: "User",
        sort: "-created",
      });
    });
  });

  describe("getList", () => {
    it("should get list of todos successfully", async () => {
      const mockListResult: ListResult<TodoType> = {
        page: 1,
        perPage: 10,
        totalItems: 1,
        totalPages: 1,
        items: [mockTodo],
      };
      (mockCollection.getList as any).mockResolvedValue(mockListResult);

      const result = await todoMutator.getList();

      expect(mockCollection.getList).toHaveBeenCalledWith(1, 100, { sort: "-updated" });
      expect(result).toEqual(mockListResult);
    });

    it("should use default sort from setDefaults", async () => {
      const mockListResult: ListResult<TodoType> = {
        page: 1,
        perPage: 10,
        totalItems: 0,
        totalPages: 0,
        items: [],
      };
      (mockCollection.getList as any).mockResolvedValue(mockListResult);

      await todoMutator.getList();

      expect(mockCollection.getList).toHaveBeenCalledWith(1, 100, { sort: "-updated" });
    });

    it("should handle custom page, perPage, filter, sort, and expand", async () => {
      const mockListResult: ListResult<TodoType> = {
        page: 2,
        perPage: 20,
        totalItems: 0,
        totalPages: 0,
        items: [],
      };
      (mockCollection.getList as any).mockResolvedValue(mockListResult);

      await todoMutator.getList(2, 20, "completed = false", "created", "User");

      expect(mockCollection.getList).toHaveBeenCalledWith(2, 20, {
        filter: "completed = false",
        sort: "created",
        expand: "User",
      });
    });

    it("should handle errors during getList", async () => {
      const listError = new Error("List failed");
      (mockCollection.getList as any).mockRejectedValue(listError);

      await expect(todoMutator.getList()).rejects.toThrow("List failed");
    });
  });

  describe("delete", () => {
    it("should delete a todo successfully", async () => {
      (mockCollection.delete as any).mockResolvedValue(undefined);

      const result = await todoMutator.delete("todo-123");

      expect(mockCollection.delete).toHaveBeenCalledWith("todo-123");
      expect(result).toBe(true);
    });

    it("should return false when delete fails", async () => {
      const deleteError = new Error("Delete failed");
      (mockCollection.delete as any).mockRejectedValue(deleteError);

      const result = await todoMutator.delete("todo-123");

      expect(result).toBe(false);
    });
  });

  describe("upsert", () => {
    it("should create a new todo when id is not provided", async () => {
      const mockParsed = { ...mockTodoInput };
      (TodoInputSchema.parse as any).mockReturnValue(mockParsed);
      (mockCollection.create as any).mockResolvedValue(mockTodo);

      const result = await todoMutator.upsert(mockTodoInput);

      expect(mockCollection.create).toHaveBeenCalled();
      expect(mockCollection.update).not.toHaveBeenCalled();
      expect(result).toEqual(mockTodo);
    });

    it("should update existing todo when id is provided", async () => {
      const updateData = { ...mockTodoInput, id: "todo-123" };
      (mockCollection.update as any).mockResolvedValue({ ...mockTodo, ...updateData });

      const result = await todoMutator.upsert(updateData);

      expect(mockCollection.update).toHaveBeenCalledWith("todo-123", updateData);
      expect(mockCollection.create).not.toHaveBeenCalled();
      expect(result).toEqual({ ...mockTodo, ...updateData });
    });
  });
});
