export class WorkflowEngineError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "WorkflowEngineError";
    this.code = code;
  }
}
