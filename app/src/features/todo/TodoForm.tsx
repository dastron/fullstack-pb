import type { TodoInputType, TodoType } from "@project/shared/types";

import { Button, Checkbox, Input, Stack, Textarea } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { TodoInputSchema } from "@project/shared/schema";
import { useEffect } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { createTodo, updateTodo } from "./todo";

import Field from "@/components/forms/FormField";
import useAuth from "@/hooks/useAuth";

type TodoFormData = Omit<TodoInputType, "completed"> & {
  completed: boolean;
};

type TodoFormProps = {
  todo?: TodoType;
  redirect?: boolean;
  onSuccess?: (todo: TodoType) => void;
};

const TodoForm = ({ todo, redirect = true, onSuccess }: TodoFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const formMethods = useForm<TodoFormData>({
    resolver: zodResolver(TodoInputSchema) as any,
    defaultValues: {
      title: todo?.title || "",
      description: todo?.description || "",
      completed: todo?.completed ?? false,
      User: todo?.User || user?.id || "",
    },
  });

  const {
    register,
    handleSubmit,
    setError,
    control,
    reset,
    formState: { errors },
  } = formMethods;

  // Reset form when todo changes (for editing)
  useEffect(() => {
    if (todo) {
      reset({
        title: todo.title || "",
        description: todo.description || "",
        completed: todo.completed || false,
        User: todo.User || user?.id,
      });
    }
  }, [todo, reset, user?.id]);

  const onSubmit = async (data: TodoFormData) => {
    try {
      if (todo) {
        // Update existing todo
        await updateTodo(todo.id, data);
        if (onSuccess && todo) {
          onSuccess({ ...todo, ...data } as TodoType);
        }
        if (redirect) {
          navigate(`/todo/${todo.id}`);
        }
      } else {
        // Create new todo
        const newTodo = await createTodo(user?.id, data);
        if (onSuccess) {
          onSuccess(newTodo);
        }
        if (redirect) {
          navigate(`/todo/${newTodo.id}`);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error saving todo:", error);
        setError("root", {
          type: "submit",
          message: `Error saving todo: ${error?.message}`,
        });
      }
      throw error;
    }
  };

  return (
    <FormProvider {...formMethods}>
      <Stack as="form" onSubmit={handleSubmit(onSubmit)} gap="4" align="flex-start">
        {Object.keys(errors).length > 0 && (
          <Stack>
            <div data-testid="error-message">Please fix the following errors:</div>
            {Object.keys(errors).map((field) => (
              <div key={field} style={{ color: "red" }}>
                {field}: {errors[field as keyof typeof errors]?.message}
              </div>
            ))}
          </Stack>
        )}

        <Field label="Todo Title" invalid={!!errors.title} errorText={errors.title?.message}>
          <Input data-testid="todo-title-input" {...register("title")} />
        </Field>

        <Field label="Description" invalid={!!errors.description} errorText={errors.description?.message}>
          <Textarea data-testid="todo-description-input" height="150px" {...register("description")} />
        </Field>

        <Field label="Completed" invalid={!!errors.completed} errorText={errors.completed?.message}>
          <Controller
            name="completed"
            control={control}
            render={({ field }) => (
              <Checkbox
                data-testid="todo-completed-input"
                isChecked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              >
                Mark as completed
              </Checkbox>
            )}
          />
        </Field>

        <Button data-testid="submit-todo-button" w="100%" type="submit">
          {todo ? "Update Todo" : "Create Todo"}
        </Button>
      </Stack>
    </FormProvider>
  );
};

export default TodoForm;
