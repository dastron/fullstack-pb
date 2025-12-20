import { TodoInputType, TodoType } from "@project/shared/types";

import pb from "@/pb";

async function getTodo(todoId: string) {
  const todo = await pb.collection("Todos").getOne(todoId);
  if (!todo) {
    throw new Error("Todo not found");
  }
  return todo;
}

export async function createTodo(userId: string | undefined, data: TodoInputType) {
  // Validate that data is an object
  if (!data || typeof data !== "object") {
    throw new Error("Invalid todo data provided");
  }

  // Validate that user ID is provided
  if (!userId) {
    throw new Error("User ID not found");
  }

  // Note: Moderation is intentionally NOT applied to todo creation
  const createdTodo = await pb.collection("Todos").create(data);
  return createdTodo;
}

export async function updateTodo(todoId: string, todo: Partial<TodoType>) {
  await getTodo(todoId);
  await pb.collection("Todos").update(todoId, todo);
}

export async function deleteTodo(todoId: string) {
  await getTodo(todoId);
  await pb.collection("Todos").delete(todoId);
}
