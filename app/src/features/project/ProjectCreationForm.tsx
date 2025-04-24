import type { ProjectInputType, ProjectType } from "@project/shared/types";

import { Stack, Input, Button, Textarea, Select } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { StatusEnum } from "@project/shared/enums";
import { ProjectInputSchema } from "@project/shared/schema";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { createProject } from "./project";

import Field from "@/components/forms/FormField";
import ImageUploadInput from "@/components/forms/ImageUploadInput";
import useAuth from "@/hooks/useAuth";

type ProjectCreationFormProps = {
  redirect?: boolean;
  onSuccess?: (project: ProjectType) => void;
};

const ProjectForm = ({ redirect = true, onSuccess }: ProjectCreationFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const FormProjectSchema = ProjectInputSchema;

  const formMethods = useForm<ProjectInputType>({
    resolver: zodResolver(FormProjectSchema),
    defaultValues: {
      status: StatusEnum.enum.draft,
      User: user?.id,
      SubscriberUsers: [user?.id],
      imageFiles: [],
    },
  });

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = formMethods;

  const handleImageUpload = (file?: File) => {
    if (file) {
      setValue("imageFiles", [file]);
    } else {
      setValue("imageFiles", []);
    }
  };

  const onSubmit = async (data: ProjectInputType) => {
    try {
      const newProject = await createProject(user?.id, data);
      if (onSuccess) {
        onSuccess(newProject);
      }
      if (redirect) {
        navigate(`/project/${newProject.id}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error during sign up:", error);
        setError("root", {
          type: "submit",
          message: `Error creating project, (${error?.message})`,
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

        <Field label="Project Image" invalid={!!errors.imageFiles} errorText={errors.imageFiles?.message}>
          <ImageUploadInput name="imageFiles" onChange={handleImageUpload} />
        </Field>

        <Field label="Project Title" invalid={!!errors.title} errorText={errors.title?.message}>
          <Input data-testid="project-title-input" {...register("title")} />
        </Field>

        <Field label="Project Description" invalid={!!errors.content} errorText={errors.content?.message}>
          <Textarea data-testid="project-description-input" height="250px" {...register("content")} />
        </Field>

        <Field label="Project Length">
          <Select data-testid="duration-select">
            <option value="6">6 Months</option>
            <option value="12">12 Months</option>
            <option value="24">24 Months</option>
            <option value="indefinite">Indefinite</option>
          </Select>
        </Field>

        <Button data-testid="submit-project-button" w="100%" type="submit">
          Create Project
        </Button>
      </Stack>
    </FormProvider>
  );
};

export default ProjectForm;
