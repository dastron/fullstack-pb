import { RouteObject } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoutes";
import TodoAppNav from "./todo/TodoAppNav";
import TodoFormPage from "./todo/TodoFormPage";
import TodoItemPage, { TodoItemQuery } from "./todo/TodoItemPage";
import TodoListPage, { TodoListLoader } from "./todo/TodoListPage";

export const TodoRoutes: RouteObject = {
  path: "/todo",
  element: (
    <ProtectedRoute>
      <TodoAppNav />
    </ProtectedRoute>
  ),
  children: [
    {
      index: true,
      element: <TodoListPage />,
      loader: TodoListLoader,
    },
    {
      path: ":todoId",
      children: [
        {
          index: true,
          element: <TodoItemPage />,
          loader: TodoItemQuery,
        },
        {
          path: "edit",
          element: <TodoFormPage />,
          loader: TodoItemQuery,
        },
      ],
    },
    {
      path: "new",
      element: <TodoFormPage />,
    },
  ],
};
