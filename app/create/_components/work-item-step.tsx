"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateWorkItem } from "@/hooks/workflowEngine/useCreateWorkItem";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";
import type {
  CustomFieldDefinition,
  PriorityLevel,
  Status,
  WorkItem,
  WorkItemType,
} from "@/lib/api/workflowEngine/types";
import { StepModal } from "./step-modal";

const PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const satisfies readonly PriorityLevel[];

const workItemSchema = z.object({
  typeId: z.string().min(1, "Type is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string(),
  currentStatusId: z.string().min(1, "Status is required"),
  priority: z.enum(PRIORITIES),
  assigneeId: z.string(),
  customFieldValue: z.string(),
});

interface WorkItemStepProps {
  projectId: string;
  workItemTypes: WorkItemType[];
  statuses: Status[];
  customFieldDefinition: CustomFieldDefinition | null;
  onComplete: (workItem: WorkItem) => void;
}

export function WorkItemStep({
  projectId,
  workItemTypes,
  statuses,
  customFieldDefinition,
  onComplete,
}: WorkItemStepProps) {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const createWorkItem = useCreateWorkItem();
  const statusItems = Object.fromEntries(
    statuses.map((status) => [status.id, status.name]),
  );
  const workItemTypeItems = Object.fromEntries(
    workItemTypes.map((type) => [type.id, type.name]),
  );

  const form = useForm<z.infer<typeof workItemSchema>>({
    resolver: zodResolver(workItemSchema),
    mode: "onChange",
    defaultValues: {
      typeId: workItemTypes[0]?.id ?? "",
      title: "",
      description: "",
      currentStatusId: "",
      priority: "MEDIUM",
      assigneeId: "",
      customFieldValue: "",
    },
  });

  function onSubmit(values: z.infer<typeof workItemSchema>) {
    createWorkItem.mutate(
      {
        projectId,
        payload: {
          type_id: values.typeId,
          title: values.title,
          description: values.description || undefined,
          current_status_id: values.currentStatusId,
          priority: values.priority,
          assignee_id: values.assigneeId || undefined,
          custom_field_values:
            customFieldDefinition && values.customFieldValue
              ? { [customFieldDefinition.id]: values.customFieldValue }
              : undefined,
        },
      },
      {
        onSuccess: (workItem) => {
          form.reset();
          setOpen(false);
          onComplete(workItem);
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
        <CardTitle>Work Item</CardTitle>
        <CardDescription>
          Create a work item using everything built so far.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" onClick={() => setOpen(true)} className="w-fit">
          Create Work Item
        </Button>
      </CardContent>

      <StepModal open={open} onOpenChange={setOpen} title="Create Work Item">
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          {createWorkItem.isError && (
            <div
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700"
              role="alert"
            >
              <CircleAlert size={18} />
              <span>{createWorkItem.error.message}</span>
            </div>
          )}

          <Controller
            name="typeId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Type</Label>
                <Select
                  items={workItemTypeItems}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    {workItemTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <p className="text-xs text-destructive">
                    {fieldState.error?.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Title</Label>
                <Input
                  {...field}
                  id={field.name}
                  placeholder="e.g. Replace HVAC filter"
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
            name="description"
            control={form.control}
            render={({ field }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Description (optional)</Label>
                <Textarea {...field} id={field.name} />
              </div>
            )}
          />

          <Controller
            name="currentStatusId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Status</Label>
                <Select
                  items={statusItems}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <p className="text-xs text-destructive">
                    {fieldState.error?.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="priority"
            control={form.control}
            render={({ field }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Priority</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {priority}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          />

          <Controller
            name="assigneeId"
            control={form.control}
            render={({ field }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Assignee ID (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    {...field}
                    id={field.name}
                    placeholder="User UUID"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!session?.user?.id}
                    onClick={() => field.onChange(session?.user?.id ?? "")}
                  >
                    Assign to me
                  </Button>
                </div>
              </div>
            )}
          />

          {customFieldDefinition && (
            <Controller
              name="customFieldValue"
              control={form.control}
              render={({ field }) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>
                    {customFieldDefinition.name} (optional)
                  </Label>
                  <Input {...field} id={field.name} />
                </div>
              )}
            />
          )}

          <Button
            variant="solid-blue"
            type="submit"
            disabled={createWorkItem.isPending}
          >
            {createWorkItem.isPending ? "Creating…" : "Create Work Item"}
          </Button>
        </form>
      </StepModal>
    </Card>
  );
}
