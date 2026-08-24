import type {
  CustomFieldDefinition,
  Project,
  Status,
  TypeFieldConfig,
  Workflow,
  WorkflowCanvasResponse,
  WorkItem,
  WorkItemType,
} from "@/lib/api/workflowEngine/types";

export type WizardStepId =
  | "project"
  | "statuses"
  | "workflow"
  | "canvas"
  | "workItemType"
  | "customField"
  | "workItem";

export interface StepDefinition {
  id: WizardStepId;
  label: string;
}

export const STEP_DEFINITIONS: StepDefinition[] = [
  { id: "project", label: "Project" },
  { id: "statuses", label: "Statuses" },
  { id: "workflow", label: "Workflow" },
  { id: "canvas", label: "Canvas" },
  { id: "workItemType", label: "Work Item Type" },
  { id: "customField", label: "Custom Field" },
  { id: "workItem", label: "Work Item" },
];

export interface WizardTransitionDraft {
  localId: string;
  name: string;
  fromStatusId: string;
  toStatusId: string;
  isGlobal: boolean;
}

export interface WizardState {
  currentStep: WizardStepId;
  project: Project | null;
  statuses: Status[];
  workflow: Workflow | null;
  initialStatusId: string | null;
  transitions: WizardTransitionDraft[];
  canvasSaved: boolean;
  workItemTypes: WorkItemType[];
  customFieldDefinitions: CustomFieldDefinition[];
  customFieldDefinition: CustomFieldDefinition | null;
  typeFieldConfigs: TypeFieldConfig[];
  workItem: WorkItem | null;
}

export const INITIAL_WIZARD_STATE: WizardState = {
  currentStep: "project",
  project: null,
  statuses: [],
  workflow: null,
  initialStatusId: null,
  transitions: [],
  canvasSaved: false,
  workItemTypes: [],
  customFieldDefinitions: [],
  customFieldDefinition: null,
  typeFieldConfigs: [],
  workItem: null,
};

export function isStepComplete(state: WizardState, step: WizardStepId): boolean {
  switch (step) {
    case "project":
      return state.project !== null;
    case "statuses":
      return state.statuses.length > 1;
    case "workflow":
      return state.workflow !== null;
    case "canvas":
      return state.canvasSaved;
    case "workItemType":
      return state.workItemTypes.length > 0;
    case "customField":
      return state.typeFieldConfigs.length > 0;
    case "workItem":
      return state.workItem !== null;
  }
}

export function canvasResponseToWizardDraft(canvas: WorkflowCanvasResponse): {
  initialStatusId: string | null;
  transitions: WizardTransitionDraft[];
} {
  const nodeIdToStatusId = new Map(
    canvas.nodes.map((node) => [node.id, node.status_id]),
  );
  const initialNode = canvas.nodes.find((node) => node.is_initial_state);

  return {
    initialStatusId: initialNode?.status_id ?? null,
    transitions: canvas.transitions.map((transition) => ({
      localId: transition.id,
      name: transition.name,
      fromStatusId: transition.from_node_id
        ? (nodeIdToStatusId.get(transition.from_node_id) ?? "")
        : "",
      toStatusId: nodeIdToStatusId.get(transition.to_node_id) ?? "",
      isGlobal: transition.is_global,
    })),
  };
}

export function resetFromStep(
  state: WizardState,
  step: WizardStepId,
): WizardState {
  const startIndex = STEP_DEFINITIONS.findIndex((s) => s.id === step);
  const next: WizardState = { ...state, currentStep: step };

  STEP_DEFINITIONS.slice(startIndex).forEach((definition) => {
    switch (definition.id) {
      case "statuses":
        next.statuses = [];
        break;
      case "workflow":
        next.workflow = null;
        break;
      case "canvas":
        next.initialStatusId = null;
        next.transitions = [];
        next.canvasSaved = false;
        break;
      case "workItemType":
        next.workItemTypes = [];
        break;
      case "customField":
        next.customFieldDefinitions = [];
        next.customFieldDefinition = null;
        next.typeFieldConfigs = [];
        break;
      case "workItem":
        next.workItem = null;
        break;
    }
  });

  return next;
}
