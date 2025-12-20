import type { TodoType } from "@project/shared/types";

import { Stack } from "@chakra-ui/react";
import { useLoaderData } from "react-router-dom";

import TodoForm from "@/features/todo/TodoForm";

const TodoFormPage = () => {
  const todo = useLoaderData() as TodoType | undefined;

  return (
    <Stack>
      <TodoForm todo={todo} />
    </Stack>
  );
};

export default TodoFormPage;
