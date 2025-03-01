import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import type {
  ProjectInputType,
  ProjectType,
  UserInputType,
  UserType,
} from "./src/types";

interface CollectionConfig<I, T> {
  input: I;
  type: T;
  mockData?: T[];
}

export const collectionsConfig: Record<string, CollectionConfig<any, any>> = {
  Projects: {
    input: {} as ProjectInputType,
    type: {} as ProjectType,
  },
  Users: {
    input: {} as UserInputType,
    type: {} as UserType,
  },
};

globalThis.fetch = vi.fn();

// Define mocked RecordService types with proper typings
const mockRecordService = <I, T>(collectionName: string) => ({
  getList: vi.fn<() => Promise<{ items: T[] }>>(() => {
    const mockData = collectionsConfig[collectionName]?.mockData || [];
    return Promise.resolve({
      items: mockData.map((item) => ({ ...item, updated: "0000", created: "0000" })),
    });
  }),
  getFirstListItem: vi.fn<(filter: string) => Promise<T>>(() => {
    const mockData = collectionsConfig[collectionName]?.mockData || [];
    const item = mockData.find((item: any) => item.id != undefined);
    return Promise.resolve({ ...item, updated: "0000", created: "0000" } as T);
  }),
  create: vi.fn<(data: I) => Promise<T>>((data) => {
    return Promise.resolve({ ...data, id: "new-id", updated: "0000", created: "0000" } as T);
  }),
  getOne: vi.fn<(id: string) => Promise<T>>((id) => {
    const mockData = collectionsConfig[collectionName]?.mockData || [];
    const item = mockData.find((item: any) => item.id == id);
    return Promise.resolve({ ...item, updated: "0000", created: "0000" } as T);
  }),
  update: vi.fn<(id: string, data: Partial<T>) => Promise<T>>((id, data) => Promise.resolve({ ...data, id } as T)),
  delete: vi.fn<(id: string) => Promise<void>>(() => Promise.resolve()),
});

// Create a mock for TypedPocketBase
const mockTypedPocketBase: Record<string, ReturnType<typeof mockRecordService>> = {};

Object.keys(collectionsConfig).forEach((collectionName) => {
  mockTypedPocketBase[collectionName] = mockRecordService<
    (typeof collectionsConfig)[typeof collectionName]["input"],
    (typeof collectionsConfig)[typeof collectionName]["type"]
  >(collectionName);
});

// Export the mock for use in your tests
export const TypedPocketBaseMock = {
  ...vi.importActual("@/pb"),
  getFileUrl: vi.fn((item: any, file: string) => {
    return `https://picsum.photos/seed/${item.id}/1200/600`;
  }),
  filter: vi.fn(),
  collection: vi.fn((name: string) => {
    const collection = mockTypedPocketBase[name];
    if (!collection) {
      throw new Error(`Unknown collection: ${name}`);
    }
    return collection;
  }),
};

// Mock the pocketBase import
vi.mock("@/pb", () => ({
  default: TypedPocketBaseMock,
  __esModule: true,
}));

// Mock the useAuth hook
vi.mock("@/hooks/useAuth", () => ({
  default: () => ({
    user: {
      id: "123",
      name: "Test User",
    },
    isLoading: false,
    hasPermission: vi.fn(),
    isAuthenticated: true,
    Login: vi.fn(),
    Logout: vi.fn(),
    SignUpNewUser: vi.fn(),
    refreshAuthData: vi.fn().mockResolvedValue(true),
  }),
}));

// Mock the moderation utils
vi.mock("@/utils/moderation", () => ({
  moderateObject: vi.fn(() => Promise.resolve({ flagged: false })),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
