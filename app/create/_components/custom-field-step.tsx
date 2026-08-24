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
import { useCreateCustomFieldDefinition } from "@/hooks/workflowEngine/useCreateCustomFieldDefinition";
import { useCreateTypeFieldConfig } from "@/hooks/workflowEngine/useCreateTypeFieldConfig";
import { useTypeFieldConfigs } from "@/hooks/workflowEngine/useTypeFieldConfigs";
import { WorkflowEngineError } from "@/lib/api/workflowEngine/error";
import type {
  CustomFieldDefinition,
  FieldDataType,
  TypeFieldConfig,
  WorkItemType,
} from "@/lib/api/workflowEngine/types";
import { StepModal } from "./step-modal";

const FIELD_TYPES = [
  "TEXT",
  "NUMBER",
  "DATE",
  "DROPDOWN",
  "USER_PICKER",
  "BOOLEAN",
  "OBJECT",
] as const satisfies readonly FieldDataType[];

const MODES = ["new", "existing"] as const;
type FieldMode = (typeof MODES)[number];

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const fieldSchema = z
  .object({
    mode: z.enum(MODES),
    existingDefinitionId: z.string(),
    name: z.string(),
    key: z.string(),
    workItemTypeId: z.string().min(1, "Work item type is required"),
    fieldType: z.enum(FIELD_TYPES),
    isRequired: z.boolean(),
    minLength: z.string(),
    maxLength: z.string(),
    min: z.string(),
    max: z.string(),
    precision: z.string(),
    placeholder: z.string(),
    allowMultiple: z.boolean(),
    optionLabels: z.string(),
    disallowPast: z.boolean(),
    configIsRequired: z.boolean(),
    defaultValue: z.string(),
    sortOrder: z.string(),
  })
  .superRefine((values, ctx) => {
    if (values.mode === "new") {
      if (!values.name.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["name"],
          message: "Name is required",
        });
      }
      if (!values.key.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["key"],
          message: "Key is required",
        });
      }
    } else if (!values.existingDefinitionId) {
      ctx.addIssue({
        code: "custom",
        path: ["existingDefinitionId"],
        message: "Select a custom field",
      });
    }
  });

type FieldFormValues = z.infer<typeof fieldSchema>;

function toNumber(value: string): number | undefined {
  return value.trim() ? Number(value) : undefined;
}

function buildConfiguration(
  values: FieldFormValues,
): Record<string, unknown> {
  const { key, isRequired, fieldType } = values;

  switch (fieldType) {
    case "TEXT":
      return {
        key,
        validation: {
          is_required: isRequired,
          min_length: toNumber(values.minLength),
          max_length: toNumber(values.maxLength),
        },
        ui_schema: { component: "text_input", placeholder: values.placeholder },
        default_value: "",
      };
    case "NUMBER":
      return {
        key,
        validation: {
          is_required: isRequired,
          min: toNumber(values.min),
          max: toNumber(values.max),
          precision: toNumber(values.precision),
        },
        ui_schema: { component: "number_input", placeholder: values.placeholder },
        default_value: 0,
      };
    case "DROPDOWN": {
      const options = (values.optionLabels ?? "")
        .split(",")
        .map((label) => label.trim())
        .filter(Boolean)
        .map((label) => ({
          label,
          value: slugify(label),
          is_active: true,
        }));
      return {
        key,
        validation: { is_required: isRequired, allow_multiple: values.allowMultiple },
        ui_schema: { component: "dropdown" },
        options,
        default_value: values.allowMultiple ? [] : null,
      };
    }
    case "USER_PICKER":
      return {
        key,
        validation: { is_required: isRequired },
        ui_schema: { component: "user_picker", api_endpoint: null },
        default_value: null,
      };
    case "DATE":
      return {
        key,
        validation: { is_required: isRequired, disallow_past: values.disallowPast },
        ui_schema: { component: "date_picker", display_format: "YYYY-MM-DD" },
        default_value: null,
      };
    case "BOOLEAN":
      return { key, validation: { is_required: isRequired }, default_value: false };
    case "OBJECT":
      return { key, validation: { is_required: isRequired }, default_value: {} };
  }
}

function defaultValues(workItemTypes: WorkItemType[]): FieldFormValues {
  return {
    mode: "new",
    existingDefinitionId: "",
    name: "",
    key: "",
    workItemTypeId: workItemTypes[0]?.id ?? "",
    fieldType: "TEXT",
    isRequired: false,
    minLength: "",
    maxLength: "",
    min: "",
    max: "",
    precision: "",
    allowMultiple: false,
    disallowPast: false,
    configIsRequired: false,
    optionLabels: "",
    placeholder: "",
    defaultValue: "",
    sortOrder: "",
  };
}

interface CustomFieldStepProps {
  projectId: string;
  workItemTypes: WorkItemType[];
  customFieldDefinitions: CustomFieldDefinition[];
  typeFieldConfigs: TypeFieldConfig[];
  onDefinitionCreated: (definition: CustomFieldDefinition) => void;
  onAttached: (config: TypeFieldConfig, definition: CustomFieldDefinition) => void;
  onContinue: () => void;
}

export function CustomFieldStep({
  projectId,
  workItemTypes,
  customFieldDefinitions,
  typeFieldConfigs,
  onDefinitionCreated,
  onAttached,
  onContinue,
}: CustomFieldStepProps) {
  const [open, setOpen] = useState(false);
  const [createdDefinition, setCreatedDefinition] =
    useState<CustomFieldDefinition | null>(null);
  const createCustomFieldDefinition = useCreateCustomFieldDefinition();
  const createTypeFieldConfig = useCreateTypeFieldConfig();
  const workItemTypeItems = Object.fromEntries(
    workItemTypes.map((type) => [type.id, type.name]),
  );
  const definitionItems = Object.fromEntries(
    customFieldDefinitions.map((def) => [def.id, `${def.name} (${def.field_type})`]),
  );

  const form = useForm<FieldFormValues>({
    resolver: zodResolver(fieldSchema),
    mode: "onChange",
    defaultValues: defaultValues(workItemTypes),
  });

  const mode = form.watch("mode");
  const fieldType = form.watch("fieldType");
  const selectedWorkItemTypeId = form.watch("workItemTypeId");
  const attachedQuery = useTypeFieldConfigs(projectId, selectedWorkItemTypeId);
  const definitionNameById = new Map(
    customFieldDefinitions.map((def) => [def.id, def.name]),
  );
  const attachedNames = attachedQuery.data?.data
    .map((config) => definitionNameById.get(config.custom_field_definition_id))
    .filter((name): name is string => Boolean(name));

  async function onSubmit(values: FieldFormValues) {
    let definition = createdDefinition;
    const isNewDefinition = values.mode === "new";

    if (isNewDefinition) {
      if (!definition) {
        try {
          definition = await createCustomFieldDefinition.mutateAsync({
            projectId,
            payload: {
              name: values.name,
              field_type: values.fieldType,
              configuration: buildConfiguration(values),
            },
          });
          setCreatedDefinition(definition);
        } catch (error) {
          toast.error(
            error instanceof WorkflowEngineError
              ? error.message
              : "Failed to create the custom field.",
          );
          return;
        }
      }
    } else {
      definition =
        customFieldDefinitions.find(
          (def) => def.id === values.existingDefinitionId,
        ) ?? null;
      if (!definition) return;
    }

    try {
      const config = await createTypeFieldConfig.mutateAsync({
        projectId,
        typeId: values.workItemTypeId,
        payload: {
          custom_field_definition_id: definition.id,
          is_required: values.configIsRequired,
          default_value: values.defaultValue || undefined,
          sort_order: toNumber(values.sortOrder),
        },
      });
      if (isNewDefinition) onDefinitionCreated(definition);
      onAttached(config, definition);
      form.reset(defaultValues(workItemTypes));
      setCreatedDefinition(null);
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof WorkflowEngineError
          ? error.message
          : "Failed to link the custom field to the work item type.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Field</CardTitle>
        <CardDescription>
          Create a custom field definition, or attach an existing one, to a
          work item type.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {customFieldDefinitions.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {customFieldDefinitions.map((def) => (
              <li key={def.id}>
                <Badge variant="outline">
                  {def.name} · {def.field_type}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Button type="button" onClick={() => setOpen(true)} className="w-fit">
            Create Custom Field
          </Button>
          {typeFieldConfigs.length > 0 && (
            <Button
              type="button"
              variant="outline"
              onClick={onContinue}
              className="w-fit"
            >
              Next Step
            </Button>
          )}
        </div>
      </CardContent>

      <StepModal open={open} onOpenChange={setOpen} title="Add Custom Field">
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          {(createCustomFieldDefinition.isError ||
            createTypeFieldConfig.isError) && (
            <div
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700"
              role="alert"
            >
              <CircleAlert size={18} />
              <span>
                {createCustomFieldDefinition.error?.message ??
                  createTypeFieldConfig.error?.message}
              </span>
            </div>
          )}

          {customFieldDefinitions.length > 0 && (
            <Controller
              name="mode"
              control={form.control}
              render={({ field }) => (
                <div className="grid gap-1.5">
                  <Label>Field source</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={field.value === "new" ? "solid-blue" : "outline"}
                      onClick={() => field.onChange("new" satisfies FieldMode)}
                      className="w-fit"
                    >
                      New Field
                    </Button>
                    <Button
                      type="button"
                      variant={
                        field.value === "existing" ? "solid-blue" : "outline"
                      }
                      onClick={() =>
                        field.onChange("existing" satisfies FieldMode)
                      }
                      className="w-fit"
                    >
                      Existing Field
                    </Button>
                  </div>
                </div>
              )}
            />
          )}

          {mode === "existing" && (
            <Controller
              name="existingDefinitionId"
              control={form.control}
              render={({ field, fieldState }) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>Custom field</Label>
                  <Select
                    items={definitionItems}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a custom field" />
                    </SelectTrigger>
                    <SelectContent>
                      {customFieldDefinitions.map((def) => (
                        <SelectItem key={def.id} value={def.id}>
                          {def.name} ({def.field_type})
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
          )}

          {mode === "new" && (
            <>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <div className="grid gap-1.5">
                    <Label htmlFor={field.name}>Name</Label>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="e.g. Estimated Duration"
                      aria-invalid={fieldState.invalid}
                      onChange={(event) => {
                        field.onChange(event);
                        if (!form.formState.dirtyFields.key) {
                          form.setValue("key", slugify(event.target.value));
                        }
                      }}
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
                      aria-invalid={fieldState.invalid}
                    />
                  </div>
                )}
              />
            </>
          )}

          <Controller
            name="workItemTypeId"
            control={form.control}
            render={({ field, fieldState }) => (
              <div className="grid gap-1.5">
                <Label htmlFor={field.name}>Work item type</Label>
                <Select
                  items={workItemTypeItems}
                  value={field.value}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a work item type" />
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
                {attachedNames && attachedNames.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Already attached: {attachedNames.join(", ")}
                  </p>
                )}
              </div>
            )}
          />

          {mode === "new" && (
            <Controller
              name="fieldType"
              control={form.control}
              render={({ field }) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>Field type</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            />
          )}

          {mode === "new" && (
            <Controller
              name="isRequired"
              control={form.control}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  Required value
                </label>
              )}
            />
          )}

          {mode === "new" && (fieldType === "TEXT" || fieldType === "NUMBER") && (
            <Controller
              name="placeholder"
              control={form.control}
              render={({ field }) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>Placeholder (optional)</Label>
                  <Input {...field} id={field.name} />
                </div>
              )}
            />
          )}

          {mode === "new" && fieldType === "TEXT" && (
            <div className="grid grid-cols-2 gap-3">
              <Controller
                name="minLength"
                control={form.control}
                render={({ field }) => (
                  <div className="grid gap-1.5">
                    <Label htmlFor={field.name}>Min length</Label>
                    <Input {...field} id={field.name} type="number" />
                  </div>
                )}
              />
              <Controller
                name="maxLength"
                control={form.control}
                render={({ field }) => (
                  <div className="grid gap-1.5">
                    <Label htmlFor={field.name}>Max length</Label>
                    <Input {...field} id={field.name} type="number" />
                  </div>
                )}
              />
            </div>
          )}

          {mode === "new" && fieldType === "NUMBER" && (
            <div className="grid grid-cols-3 gap-3">
              <Controller
                name="min"
                control={form.control}
                render={({ field }) => (
                  <div className="grid gap-1.5">
                    <Label htmlFor={field.name}>Min</Label>
                    <Input {...field} id={field.name} type="number" />
                  </div>
                )}
              />
              <Controller
                name="max"
                control={form.control}
                render={({ field }) => (
                  <div className="grid gap-1.5">
                    <Label htmlFor={field.name}>Max</Label>
                    <Input {...field} id={field.name} type="number" />
                  </div>
                )}
              />
              <Controller
                name="precision"
                control={form.control}
                render={({ field }) => (
                  <div className="grid gap-1.5">
                    <Label htmlFor={field.name}>Precision</Label>
                    <Input {...field} id={field.name} type="number" />
                  </div>
                )}
              />
            </div>
          )}

          {mode === "new" && fieldType === "DROPDOWN" && (
            <>
              <Controller
                name="optionLabels"
                control={form.control}
                render={({ field }) => (
                  <div className="grid gap-1.5">
                    <Label htmlFor={field.name}>
                      Options (comma-separated)
                    </Label>
                    <Input
                      {...field}
                      id={field.name}
                      placeholder="e.g. Low, Medium, High"
                    />
                  </div>
                )}
              />
              <Controller
                name="allowMultiple"
                control={form.control}
                render={({ field }) => (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                    Allow multiple selections
                  </label>
                )}
              />
            </>
          )}

          {mode === "new" && fieldType === "DATE" && (
            <Controller
              name="disallowPast"
              control={form.control}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  Disallow past dates
                </label>
              )}
            />
          )}

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4">
            <Controller
              name="configIsRequired"
              control={form.control}
              render={({ field }) => (
                <label className="col-span-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  Required on this work item type
                </label>
              )}
            />
            <Controller
              name="defaultValue"
              control={form.control}
              render={({ field }) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>Default value (optional)</Label>
                  <Input {...field} id={field.name} />
                </div>
              )}
            />
            <Controller
              name="sortOrder"
              control={form.control}
              render={({ field }) => (
                <div className="grid gap-1.5">
                  <Label htmlFor={field.name}>Sort order (optional)</Label>
                  <Input {...field} id={field.name} type="number" />
                </div>
              )}
            />
          </div>

          <Button
            variant="solid-blue"
            type="submit"
            disabled={
              createCustomFieldDefinition.isPending ||
              createTypeFieldConfig.isPending
            }
          >
            {createCustomFieldDefinition.isPending ||
            createTypeFieldConfig.isPending
              ? "Saving…"
              : "Save Custom Field"}
          </Button>
        </form>
      </StepModal>
    </Card>
  );
}
