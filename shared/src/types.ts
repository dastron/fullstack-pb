import type { RecordService } from "pocketbase";
import PocketBase from "pocketbase";
import { type Todo, type TodoInput, type User, type UserInput } from "./schema";

// Input types for forms
export type TodoInputType = TodoInput;
export type UserInputType = UserInput;

// Database record types
export type TodoType = Todo;
export type UserType = User;

// Typed PocketBase interface
export interface TypedPocketBase extends PocketBase {
  collection(idOrName: "Users"): RecordService<UserType>;
  collection(idOrName: "Todos"): RecordService<TodoType>;
}
