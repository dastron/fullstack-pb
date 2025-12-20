import type { TodoType } from "@project/shared/types";

import { Button, Heading, HStack, Stack } from "@chakra-ui/react";
import { useState } from "react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";

import { deleteTodo, updateTodo } from "@/features/todo/todo";
import TodoCard from "@/features/todo/TodoCard";
import { useTodoItemSubscription } from "@/pages/todo/useTodoItemSubscription";
import pb from "@/pb";

type URLParams = {
  params: {
    todoId?: string;
  };
};

export const TodoItemQuery = async ({ params }: URLParams) => {
  // Check if user is authenticated before loading data
  if (!pb.authStore.isValid) {
    return null;
  }

  try {
    const todo = await pb.collection("Todos").getOne(params?.todoId ?? "", {});
    return todo;
  } catch (error) {
    // If authentication error, return null to let ProtectedRoute handle it
    if (error && typeof error === "object" && "status" in error && error.status === 401) {
      return null;
    }
    throw error;
  }
};

const TodoItemPage = () => {
  const loader = useLoaderData() as TodoType | undefined;
  const todoId = loader?.id;
  const navigate = useNavigate();
  const [todo, setTodo] = useState<TodoType | undefined>(loader);

  useTodoItemSubscription(todoId, (event) => {
    console.log(`Todo ${event.action}:`, event.record);
    if (event.action !== "delete") setTodo(event.record);
  });

  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      await updateTodo(id, { completed });
      if (todo) {
        setTodo({ ...todo, completed });
      }
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  };

  const handleDelete = async () => {
    if (!todoId || !confirm("Are you sure you want to delete this todo?")) {
      return;
    }
    try {
      await deleteTodo(todoId);
      navigate("/todo");
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  return (
    <Stack>
      <HStack justify="space-between" align="center">
        <Heading>{todo?.title}</Heading>
        <HStack>
          <Button as={Link} to={`/todo/${todoId}/edit`} colorScheme="blue">
            Edit
          </Button>
          <Button onClick={handleDelete} colorScheme="red">
            Delete
          </Button>
        </HStack>
      </HStack>
      {todo && <TodoCard todo={todo} onToggleComplete={handleToggleComplete} />}
    </Stack>
  );
};

export default TodoItemPage;
