import type { TodoType } from "@project/shared/types";
import type { ListResult } from "pocketbase";

import { Button, Flex, Heading, Spacer, Stack, useToast } from "@chakra-ui/react";
import { Link, useLoaderData, useNavigate } from "react-router-dom";

import SearchQueryHeader from "@/components/search/SearchQueryHeader";
import { TodoList } from "@/components/todo/TodoList";
import { updateTodo } from "@/features/todo/todo";
import pb from "@/pb";
import { getQueryParams } from "@/utils/query";

export const TodoListQuery = async (sort: string = "-updated", filter: string = "") => {
  return await pb.collection("Todos").getList(1, 30, { sort, filter });
};

export const TodoListLoader = async (context: any) => {
  // Check if user is authenticated before loading data
  if (!pb.authStore.isValid) {
    return null;
  }

  try {
    const { filter, sort } = getQueryParams(context.request.url);
    return await TodoListQuery(sort, filter);
  } catch (error) {
    // If authentication error, return null to let ProtectedRoute handle it
    if (error && typeof error === "object" && "status" in error && error.status === 401) {
      return null;
    }
    throw error;
  }
};

const TodoListPage = () => {
  const loader = useLoaderData() as ListResult<TodoType> | undefined;
  const todos = loader?.items || [];
  const navigate = useNavigate();
  const toast = useToast();

  const handleToggleComplete = async (todoId: string, completed: boolean) => {
    try {
      await updateTodo(todoId, { completed });
      // Refresh the page to show updated data
      navigate(0);
    } catch (error) {
      toast({
        title: "Error updating todo",
        description: error instanceof Error ? error.message : "Failed to update todo status",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Stack spacing={4}>
      <Flex align="center">
        <Heading>Todos</Heading>
        <Spacer />
        <Button as={Link} to="./new" colorScheme="blue">
          Create New Todo
        </Button>
      </Flex>
      <SearchQueryHeader />
      <TodoList todos={todos} prefix="/todo" onToggleComplete={handleToggleComplete} />
    </Stack>
  );
};

export default TodoListPage;
