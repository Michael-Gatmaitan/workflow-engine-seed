"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { CircleAlert } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProjects } from "@/hooks/workflowEngine/useProjects";
import { useCreateProject } from "@/hooks/workflowEngine/useCreateProject";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";
import type { Project } from "@/lib/api/workflowEngine/types";
import { StepModal } from "./step-modal";

const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z
    .string()
    .min(1, "Key is required")
    .max(10, "Key must be 10 characters or fewer"),
});

interface ProjectStepProps {
  onComplete: (project: Project) => void;
}

export function ProjectStep({ onComplete }: ProjectStepProps) {
  const [open, setOpen] = useState(false);
  const projectsQuery = useProjects();
  const createProject = useCreateProject();

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    mode: "onChange",
    defaultValues: { name: "", key: "" },
  });

  function onSubmit(values: z.infer<typeof projectSchema>) {
    createProject.mutate(values, {
      onSuccess: (project) => {
        form.reset();
        setOpen(false);
        onComplete(project);
      },
      onError: (error: WorkflowEngineError) => {
        toast.error(error.message);
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project</CardTitle>
        <CardDescription>
          Pick an existing project or create a new one to build data for.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {projectsQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Loading projects…</p>
        )}
        {projectsQuery.data && projectsQuery.data.data.length > 0 && (
          <ul className="flex flex-col gap-2">
            {projectsQuery.data.data.map((project) => (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => onComplete(project)}
                  className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <span>{project.name}</span>
                  <span className="text-muted-foreground">{project.key}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Button type="button" onClick={() => setOpen(true)} className="w-fit">
          Create Project
        </Button>
      </CardContent>

      <StepModal
        open={open}
        onOpenChange={setOpen}
        title="Create Project"
        description="Projects group statuses, workflows, and work items together."
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          {createProject.isError && (
            <div
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700"
              role="alert"
            >
              <CircleAlert size={18} />
              <span>{createProject.error.message}</span>
            </div>
          )}

          <Controller
            name="name"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Name</Label>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="e.g. Facilities"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <p className="text-xs text-destructive">
                    {fieldState.error?.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="key"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Key</Label>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="e.g. FAC"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <p className="text-xs text-destructive">
                    {fieldState.error?.message}
                  </p>
                )}
              </div>
            )}
          />

          <Button
            variant="solid-blue"
            type="submit"
            disabled={createProject.isPending}
          >
            {createProject.isPending ? "Creating…" : "Create Project"}
          </Button>
        </form>
      </StepModal>
    </Card>
  );
}
