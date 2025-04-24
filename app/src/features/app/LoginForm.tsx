import { Stack, Input, Button } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useSearchParams } from "react-router-dom";
import { z } from "zod";

import Field from "@/components/forms/FormField";
import useAuth from "@/hooks/useAuth";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 8 characters"),
});
type LoginType = z.infer<typeof LoginSchema>;

const UserForm = () => {
  const { Login } = useAuth();
  const [searchParams] = useSearchParams();

  const FormLoginSchema = LoginSchema;

  const formMethods = useForm<LoginType>({
    resolver: zodResolver(FormLoginSchema),
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = formMethods;

  const onSubmit = async (data: LoginType) => {
    try {
      const success = await Login(data.email, data.password);
      if (success) {
        const redirectTo = searchParams.get("redirect");
        window.location.href = redirectTo || "/";
      } else {
        setError("root", {
          type: "submit",
          message: "Login failed. Please try again.",
        });
      }
    } catch (error: any) {
      console.error("Error during login:", error);
      setError("root", {
        type: "submit",
        message: `Invalid Login`,
      });
    }
  };

  return (
    <FormProvider {...formMethods}>
      <Stack as="form" onSubmit={handleSubmit(onSubmit)} gap="4" align="flex-start" maxW="sm" data-testid="login-form">
        {Object.keys(errors)
          .filter((field) => !["email", "password"].includes(field))
          .map((field) => (
            <div key={field} style={{ color: "red" }} data-testid="form-error">
              {errors[field as keyof typeof errors]?.message}
            </div>
          ))}

        <Field label="Email" invalid={!!errors.email} errorText={errors.email?.message}>
          <Input {...register("email")} data-testid="email-input" />
        </Field>
        <Field label="Password" invalid={!!errors.password} errorText={errors.password?.message}>
          <Input type="password" {...register("password")} data-testid="password-input" />
        </Field>
        <Button type="submit" data-testid="login-button">
          Log In
        </Button>
      </Stack>
    </FormProvider>
  );
};

export default UserForm;
