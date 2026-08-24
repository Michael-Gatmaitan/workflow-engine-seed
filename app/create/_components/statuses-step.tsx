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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateStatus } from "@/hooks/workflowEngine/useCreateStatus";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";
import type { Status, StatusCategory } from "@/lib/api/workflowEngine/types";
import { StepModal } from "./step-modal";

const STATUS_CATEGORIES = [
  "TODO",
  "IN_PROGRESS",
  "DONE",
] as const satisfies readonly StatusCategory[];

const statusSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum(STATUS_CATEGORIES),
  color: z.string().optional(),
});

interface StatusesStepProps {
  projectId: string;
  statuses: Status[];
  onStatusAdded: (status: Status) => void;
  onContinue: () => void;
}

export function StatusesStep({
  projectId,
  statuses,
  onStatusAdded,
  onContinue,
}: StatusesStepProps) {
  const [open, setOpen] = useState(false);
  const createStatus = useCreateStatus();

  const form = useForm<z.infer<typeof statusSchema>>({
    resolver: zodResolver(statusSchema),
    mode: "onChange",
    defaultValues: { name: "", category: "TODO", color: "" },
  });

  function onSubmit(values: z.infer<typeof statusSchema>) {
    createStatus.mutate(
      {
        projectId,
        payload: {
          name: values.name,
          category: values.category,
          color: values.color || undefined,
        },
      },
      {
        onSuccess: (status) => {
          form.reset({ name: "", category: "TODO", color: "" });
          onStatusAdded(status);
        },
        onError: (error: WorkflowEngineError) => {
          toast.error(error.message);
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Statuses</CardTitle>
        <CardDescription>
          Create at least two statuses (each with a category) before
          continuing.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {statuses.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {statuses.map((status) => (
              <li key={status.id}>
                <Badge variant="outline">
                  {status.name} · {status.category}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Button type="button" onClick={() => setOpen(true)} className="w-fit">
            Add Status
          </Button>
          {statuses.length > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={onContinue}
              className="w-fit"
            >
              Continue
            </Button>
          )}
        </div>
      </CardContent>

      <StepModal
        open={open}
        onOpenChange={setOpen}
        title="Add Status"
        description="Each status maps to one of the backend's category enum values."
      >
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          {createStatus.isError && (
            <div
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700"
              role="alert"
            >
              <CircleAlert size={18} />
              <span>{createStatus.error.message}</span>
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
                  placeholder="e.g. In Review"
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
            name="category"
            control={form.control}
            render={({ field }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Category</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <Controller
            name="color"
            control={form.control}
            render={({ field }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Color (optional)</Label>
                <Input {...field} id={field.name} placeholder="e.g. #22c55e" />
              </div>
            )}
          />

          <Button
            variant="solid-blue"
            type="submit"
            disabled={createStatus.isPending}
          >
            {createStatus.isPending ? "Adding…" : "Add Status"}
          </Button>
        </form>
      </StepModal>
    </Card>
  );
}
