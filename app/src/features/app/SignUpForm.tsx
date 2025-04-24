import type { UserInputType } from "@project/shared/types";

import { Stack, Input, Button } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserInputSchema } from "@project/shared/schema";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";

import Field from "@/components/forms/FormField";
import useAuth from "@/hooks/useAuth";

const UserForm = () => {
  const { SignUpNewUser } = useAuth();
  const [searchParams] = useSearchParams();
  const FormUserCreationSchema = UserInputSchema;

  const formMethods = useForm<UserInputType>({
    resolver: zodResolver(FormUserCreationSchema),
    defaultValues: {},
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = formMethods;

  const onSubmit = async (data: UserInputType) => {
    try {
      const signUpSuccess = await SignUpNewUser(data);
      if (signUpSuccess) {
        const redirectTo = searchParams.get("redirect");
        window.location.href = redirectTo || "/";
      } else {
        setError("root", {
          type: "submit",
          message: "Sign up failed. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("Error during sign up:", error);
      setError("root", {
        type: "submit",
        message: `Error signing up. (${error?.message})`,
      });
    }
  };

  return (
    <FormProvider {...formMethods}>
      <Stack as="form" onSubmit={handleSubmit(onSubmit)} gap="4" align="flex-start" maxW="sm" data-testid="signup-form">
        {Object.keys(errors)
          .filter((field) => !["name", "username", "email", "password", "passwordConfirm"].includes(field))
          .map((field) => (
            <div key={field} style={{ color: "red" }} data-testid="form-error">
              {errors[field as keyof typeof errors]?.message}
            </div>
          ))}

        <Field label="Name" invalid={!!errors.name} errorText={errors.name?.message}>
          <Input {...register("name")} data-testid="name-input" />
        </Field>
        <Field label="Username" invalid={!!errors.username} errorText={errors.username?.message}>
          <Input {...register("username")} data-testid="username-input" />
        </Field>
        <Field label="Email" invalid={!!errors.email} errorText={errors.email?.message}>
          <Input {...register("email")} data-testid="email-input" />
        </Field>
        <Field label="Password" invalid={!!errors.password} errorText={errors.password?.message}>
          <Input type="password" {...register("password")} data-testid="password-input" />
        </Field>
        <Field label="Confirm Password" invalid={!!errors.passwordConfirm} errorText={errors.passwordConfirm?.message}>
          <Input type="password" {...register("passwordConfirm")} data-testid="password-confirm-input" />
        </Field>
        <Button type="submit" data-testid="signup-button">
          Sign Up
        </Button>
      </Stack>
    </FormProvider>
  );
};

export default UserForm;
