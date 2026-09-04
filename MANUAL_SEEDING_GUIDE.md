# Manual Seeding Guide — sc-workflow-engine (via Postman)

<!--toc:start-->

- [Manual Seeding Guide — sc-workflow-engine (via Postman)](#manual-seeding-guide-sc-workflow-engine-via-postman)
  - [Why this doc exists](#why-this-doc-exists)
  - [Table of contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Global request contract](#global-request-contract)
  - [Step 1 — Create Project](#step-1-create-project)
  - [Step 2 — Create Statuses](#step-2-create-statuses)
  - [Step 3 — Create Workflow](#step-3-create-workflow)
  - [Step 4 — Save Workflow Canvas](#step-4-save-workflow-canvas)
    - [⚠️ Read this before filling in the body](#️-read-this-before-filling-in-the-body)
  - [Step 5 — Create Work Item Types](#step-5-create-work-item-types)
  - [Step 6 — Create Custom Field Definitions](#step-6-create-custom-field-definitions)
  - [Step 7 — Link a Custom Field to a Work Item Type](#step-7-link-a-custom-field-to-a-work-item-type)
  - [Step 8 — Create Work Items](#step-8-create-work-items)
    - [Fully worked example](#fully-worked-example)
    - [The rest of the seeded set](#the-rest-of-the-seeded-set)
  - [Appendix A — Enum reference](#appendix-a-enum-reference)
  - [Appendix B — Error codes you may hit](#appendix-b-error-codes-you-may-hit)
  - [Appendix C — Known issues in the bundled Postman collection](#appendix-c-known-issues-in-the-bundled-postman-collection)

<!--toc:end-->

## Why this doc exists

The automated seeder in this repo (`app/dev/seed-workflow-engine/`) only runs from a dev-only Next.js route — it calls `notFound()` in production, so it cannot be used to populate a production `sc-workflow-engine` instance. This guide reproduces **exactly what that seeder does**, as a manual sequence of Postman requests, so the same demo dataset (a project, its statuses, a workflow, the workflow canvas, work item types, custom field definitions, and work items) can be created by hand in an environment where the seeder isn't available.

Follow the steps **in order** — each one depends on an ID captured from the step before it.

```
Project → Statuses → Workflow → Workflow Canvas (layout) → Work Item Types
        → Custom Field Definitions → Type Field Config → Work Items
```

---

## Table of contents

- [Prerequisites](#prerequisites)
- [Global request contract](#global-request-contract)
- [Step 1 — Create Project](#step-1--create-project)
- [Step 2 — Create Statuses](#step-2--create-statuses)
- [Step 3 — Create Workflow](#step-3--create-workflow)
- [Step 4 — Save Workflow Canvas](#step-4--save-workflow-canvas)
- [Step 5 — Create Work Item Types](#step-5--create-work-item-types)
- [Step 6 — Create Custom Field Definitions](#step-6--create-custom-field-definitions)
- [Step 7 — Link a Custom Field to a Work Item Type](#step-7--link-a-custom-field-to-a-work-item-type)
- [Step 8 — Create Work Items](#step-8--create-work-items)
- [Appendix A — Enum reference](#appendix-a--enum-reference)
- [Appendix B — Error codes you may hit](#appendix-b--error-codes-you-may-hit)
- [Appendix C — Known issues in the bundled Postman collection](#appendix-c--known-issues-in-the-bundled-postman-collection)

---

## Prerequisites

Your Postman environment (or collection variables) should already define:

| Variable      | Example                                | Notes                                                                                                               |
| ------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `URL`         | `https://api.example.com`              | Base host, no trailing slash                                                                                        |
| `AccessToken` | `eyJhbGciOi...`                        | JWT — **signature is not verified server-side**, but it must contain `uuid` and `community_uuid` claims (see below) |
| `X-House`     | `92d1e4b4-cada-4a8e-8fc4-bb4a9844e681` | Any non-empty string; used as a house/sub-tenant scope                                                              |

> ⚠️ **If every request in your collection returns `401 Missing Required Header: X-Trace-ID is mandatory`**, your Postman collection's pre-request script is only injecting `X-House`, not `X-Trace-ID`. See [Appendix C](#appendix-c--known-issues-in-the-bundled-postman-collection) for the fix — add a `X-Trace-ID` header (any non-empty string, e.g. a UUID) to every request.

The access token's JWT payload must contain:

```json
{ "uuid": "<acting-user-uuid>", "community_uuid": "<tenant-community-uuid>" }
```

`uuid` becomes the `created_by` / `reporter_id` on everything you create; `community_uuid` is the tenant boundary every row is scoped to.

---

## Global request contract

Every request below is relative to this base path:

```
{{URL}}/api/workflow-engine
```

**Required headers on every request:**

| Header          | Value                              |
| --------------- | ---------------------------------- |
| `Authorization` | `Bearer {{AccessToken}}`           |
| `X-House`       | `{{X-House}}`                      |
| `X-Trace-ID`    | any non-empty string (e.g. a UUID) |
| `Content-Type`  | `application/json`                 |

**Response envelope** (same shape for every endpoint):

```json
{
  "status": "success",
  "data": { "...": "..." },
  "message": "Human readable message"
}
```

- All successful creates return **`200 OK`** (not 201).
- Errors return `400` (validation), `404` (not found), `409` (conflict/duplicate), or `401` (auth) with:

  ```json
  { "status": "error", "message": "...", "code": "SOME_ERROR_CODE" }
  ```

- IDs are server-generated UUIDs, returned as `data.id`. Never send your own `id` in a create body — it will be ignored/overwritten.
- Audit metadata (`data.metadata` — `created_at`, `community_id`, etc.) is hidden by default; append `?metadata=true` to a `GET` if you need it.

As you go through each step, save the returned `data.id` into a Postman variable (suggested names below, matching the naming used in `docs/workflow_engine.postman_collection.json`) so later steps can reference it as `{{project_id}}`, `{{status_id_todo}}`, etc.

---

## Step 1 — Create Project

**`POST {{URL}}/api/workflow-engine/projects`**

```json
{
  "name": "Seed Sandbox Property",
  "key": "SEEDHTL",
  "tool": "MAINTENANCE"
}
```

| Field      | Required | Notes                                                                                                                          |
| ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `name`     | yes      | trimmed server-side                                                                                                            |
| `key`      | yes      | max **10 chars**, uppercased server-side, must be unique per community                                                         |
| `tool`     | no       | free-form string; if set, must be unique per community (except the special value `GENERIC`, which multiple projects may share) |
| `house_id` | no       | omit for a community-wide project                                                                                              |

**Response `200 OK`:**

```json
{
  "status": "success",
  "data": {
    "id": "b7f1e2a0-1111-4a2b-9c3d-000000000001",
    "house_id": null,
    "name": "Seed Sandbox Property",
    "key": "SEEDHTL",
    "tool": "MAINTENANCE",
    "item_counter": 0
  },
  "message": "Project created successfully"
}
```

**Capture:** `data.id` → `{{project_id}}`

---

## Step 2 — Create Statuses

**`POST {{URL}}/api/workflow-engine/projects/{{project_id}}/statuses`** — run once per status below. `project_id` is taken from the URL, so you don't need it in the body.

| Field      | Required | Notes                                          |
| ---------- | -------- | ---------------------------------------------- |
| `name`     | yes      | unique per project                             |
| `category` | yes      | enum `TODO` \| `IN_PROGRESS` \| `DONE`         |
| `color`    | no       | free-form string                               |
| `code`     | no       | stable identifier, unique per project when set |

Create these 5 (mirrors the seeder's default board):

| #   | name        | category      | color  | code          |
| --- | ----------- | ------------- | ------ | ------------- |
| 1   | To Do       | `TODO`        | orange | `TO_DO`       |
| 2   | In Progress | `IN_PROGRESS` | blue   | `IN_PROGRESS` |
| 3   | Done        | `DONE`        | green  | `DONE`        |
| 4   | Cancelled   | `DONE`        | red    | `CANCELLED`   |
| 5   | Closed      | `DONE`        | green  | `CLOSED`      |

Full request body for each of the 5 — run one request per status, in order:

```json
{
  "name": "To Do",
  "category": "TODO",
  "color": "orange",
  "code": "TO_DO"
}
```

```json
{
  "name": "In Progress",
  "category": "IN_PROGRESS",
  "color": "blue",
  "code": "IN_PROGRESS"
}
```

```json
{
  "name": "Done",
  "category": "DONE",
  "color": "green",
  "code": "DONE"
}
```

```json
{
  "name": "Cancelled",
  "category": "DONE",
  "color": "red",
  "code": "CANCELLED"
}
```

```json
{
  "name": "Closed",
  "category": "DONE",
  "color": "green",
  "code": "CLOSED"
}
```

**Response `200 OK`:**

```json
{
  "status": "success",
  "data": {
    "id": "c2d3e4f5-2222-4a2b-9c3d-000000000002",
    "project_id": "b7f1e2a0-1111-4a2b-9c3d-000000000001",
    "name": "To Do",
    "color": "orange",
    "category": "TODO",
    "code": "TO_DO"
  },
  "message": "Status created successfully"
}
```

**Capture** each `data.id` into a distinct variable, e.g. `{{status_id_todo}}`, `{{status_id_in_progress}}`, `{{status_id_done}}`, `{{status_id_cancelled}}`, `{{status_id_closed}}`. You'll need all 5 in the next step.

---

## Step 3 — Create Workflow

**`POST {{URL}}/api/workflow-engine/projects/{{project_id}}/workflows`**

```json
{
  "name": "Default Workflow",
  "is_active": true
}
```

**Response `200 OK`:**

```json
{
  "status": "success",
  "data": {
    "id": "d3e4f5a6-3333-4a2b-9c3d-000000000003",
    "project_id": "b7f1e2a0-1111-4a2b-9c3d-000000000001",
    "name": "Default Workflow",
    "is_active": true
  },
  "message": "Workflow registered successfully"
}
```

**Capture:** `data.id` → `{{workflow_id}}`

---

## Step 4 — Save Workflow Canvas

**`PUT {{URL}}/api/workflow-engine/projects/{{project_id}}/workflows/{{workflow_id}}/layout`**

This is a **full-graph replace**, not per-node CRUD — you send the entire node + transition list in one call. Re-sending it is safe (it upserts by matching existing nodes on `status_id` and existing transitions on the from→to status pair), so you can re-run this step if you need to add a transition later.

### ⚠️ Read this before filling in the body

- Despite the field names, **`from_node_id` / `to_node_id` / `status_id` here are all _status_ UUIDs**, not workflow-node row UUIDs — the server resolves them internally.
- **Exactly one** node must have `"is_initial_state": true`, or the request fails with `400 MUST_HAVE_EXACTLY_ONE_INITIAL_STATE`.
- Every `to_node_id` (and `from_node_id`, unless the transition `is_global`) must reference a status that's present in this same request's `nodes` array — otherwise `400 DANGLING_TRANSITION_EDGE`.
- `"is_global": true` means "from any current status" — omit or blank out `from_node_id` on those.

```json
{
  "nodes": [
    {
      "status_id": "{{status_id_todo}}",
      "ui_pos_x": 0,
      "ui_pos_y": 200,
      "is_initial_state": true
    },
    {
      "status_id": "{{status_id_in_progress}}",
      "ui_pos_x": 220,
      "ui_pos_y": 200,
      "is_initial_state": false
    },
    {
      "status_id": "{{status_id_done}}",
      "ui_pos_x": 440,
      "ui_pos_y": 200,
      "is_initial_state": false
    },
    {
      "status_id": "{{status_id_cancelled}}",
      "ui_pos_x": 660,
      "ui_pos_y": 200,
      "is_initial_state": false
    },
    {
      "status_id": "{{status_id_closed}}",
      "ui_pos_x": 880,
      "ui_pos_y": 200,
      "is_initial_state": false
    }
  ],
  "transitions": [
    {
      "name": "Start Progress",
      "from_node_id": "{{status_id_todo}}",
      "to_node_id": "{{status_id_in_progress}}",
      "is_global": false,
      "rules": {}
    },
    {
      "name": "Complete",
      "from_node_id": "{{status_id_in_progress}}",
      "to_node_id": "{{status_id_done}}",
      "is_global": false,
      "rules": {}
    },
    {
      "name": "Reopen",
      "from_node_id": "{{status_id_done}}",
      "to_node_id": "{{status_id_todo}}",
      "is_global": false,
      "rules": {}
    },
    {
      "name": "From To Do to Cancelled",
      "from_node_id": "{{status_id_todo}}",
      "to_node_id": "{{status_id_cancelled}}",
      "is_global": false,
      "rules": {}
    },
    {
      "name": "From In Progress to Cancelled",
      "from_node_id": "{{status_id_in_progress}}",
      "to_node_id": "{{status_id_cancelled}}",
      "is_global": false,
      "rules": {}
    },
    {
      "name": "From Done to Cancelled",
      "from_node_id": "{{status_id_done}}",
      "to_node_id": "{{status_id_cancelled}}",
      "is_global": false,
      "rules": {}
    },
    {
      "name": "From Cancelled to To Do",
      "from_node_id": "{{status_id_cancelled}}",
      "to_node_id": "{{status_id_todo}}",
      "is_global": false,
      "rules": {}
    },
    {
      "name": "From Done to Closed",
      "from_node_id": "{{status_id_done}}",
      "to_node_id": "{{status_id_closed}}",
      "is_global": false,
      "rules": {}
    },
    {
      "name": "From Cancelled to Closed",
      "from_node_id": "{{status_id_cancelled}}",
      "to_node_id": "{{status_id_closed}}",
      "is_global": false,
      "rules": {}
    }
  ]
}
```

**Response `200 OK`:**

```json
{
  "status": "success",
  "data": null,
  "message": "Workflow canvas visual diagram saved successfully"
}
```

No IDs are returned. If you need the generated `workflow_nodes` / `workflow_transitions` row IDs (e.g. to attach `required_field_definition_ids` rules to a specific transition later), fetch them with:

**`GET {{URL}}/api/workflow-engine/projects/{{project_id}}/workflows/{{workflow_id}}/layout`**

```json
{
  "status": "success",
  "data": {
    "nodes": [
      {
        "id": "...",
        "status_id": "...",
        "ui_pos_x": 0,
        "ui_pos_y": 200,
        "is_initial_state": true,
        "status": { "...": "..." }
      }
    ],
    "transitions": [
      {
        "id": "...",
        "from_node_id": "...",
        "to_node_id": "...",
        "name": "Start Progress",
        "is_global": false,
        "rules": {}
      }
    ]
  },
  "message": "Workflow canvas visual layout layout retrieved successfully"
}
```

(Note: that trailing "layout layout" in the message is a real typo in the API's response text, not a copy error in this doc.)

**Why this step matters for later:** a database trigger validates, on every work item insert/update, that `current_status_id` is an existing node of the workflow bound to the item's type. If you skip this step (or forget a status), you won't be able to create work items in that status for a type that has `workflow_id` set — you'll get a `500` with _"Invalid State Mutation: The status assigned does not exist in the designated workflow schema for this item type."_

---

## Step 5 — Create Work Item Types

**`POST {{URL}}/api/workflow-engine/projects/{{project_id}}/work-item-types`** — run once per type below.

| Field             | Required            | Notes                                                                                                                |
| ----------------- | ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `name`            | yes                 | unique per project                                                                                                   |
| `icon_name`       | no                  | free-form icon key, e.g. `Sparkles`                                                                                  |
| `color`           | no                  | free-form string; drives the type's color in the UI (e.g. board/kanban chips)                                        |
| `workflow_id`     | no, but **set it**  | binds this type to the workflow from Step 3 — omitting it disables status validation entirely for items of this type |
| `tool`            | no                  | free-form string, unique per project unless `GENERIC`                                                                |
| `is_subtask_type` | no, default `false` | must be `true` if you intend to set `parent_item_id` on work items of this type                                      |

```json
{
  "name": "Housekeeping",
  "icon_name": "Sparkles",
  "color": "blue",
  "workflow_id": "{{workflow_id}}",
  "is_subtask_type": false
}
```

```json
{
  "name": "Maintenance",
  "icon_name": "Wrench",
  "color": "orange",
  "workflow_id": "{{workflow_id}}",
  "is_subtask_type": false
}
```

**Response `200 OK`:**

```json
{
  "status": "success",
  "data": {
    "id": "e4f5a6b7-4444-4a2b-9c3d-000000000004",
    "project_id": "b7f1e2a0-1111-4a2b-9c3d-000000000001",
    "workflow_id": "d3e4f5a6-3333-4a2b-9c3d-000000000003",
    "name": "Housekeeping",
    "icon_name": "Sparkles",
    "color": "blue",
    "tool": null,
    "is_subtask_type": false
  },
  "message": "Work item type created successfully"
}
```

**Capture:** `data.id` → `{{work_item_type_id_housekeeping}}` and `{{work_item_type_id_maintenance}}`.

---

## Step 6 — Create Custom Field Definitions

**`POST {{URL}}/api/workflow-engine/projects/{{project_id}}/custom-field-definitions`** — run once per field below.

| Field           | Required | Notes                                                                           |
| --------------- | -------- | ------------------------------------------------------------------------------- |
| `name`          | yes      | unique per project                                                              |
| `field_type`    | yes      | enum — see [Appendix A](#appendix-a--enum-reference)                            |
| `configuration` | no       | free-form JSON object — put validation rules / UI hints / dropdown options here |

> ⚠️ **`configuration` is the only place for extra field metadata.** The model does **not** have top-level `key`, `validation`, `ui_schema`, `sort_order`, or `default_value` fields — if your Postman collection's example body sends those at the top level, they're silently dropped by JSON binding. Nest everything under `configuration` instead, as shown below.

Create these 6 (mirrors the seeder's demo fields):

```json
{
  "name": "Room",
  "field_type": "DROPDOWN",
  "configuration": {
    "key": "room",
    "validation": { "is_required": true },
    "ui_schema": { "component": "Dropdown", "placeholder": "-- Room --" },
    "default_value": ""
  }
}
```

```json
{
  "name": "Floor",
  "field_type": "DROPDOWN",
  "configuration": {
    "key": "floor",
    "validation": { "is_required": false },
    "ui_schema": { "component": "Dropdown", "placeholder": "-- Floor --" },
    "default_value": ""
  }
}
```

```json
{
  "name": "Stay Duration",
  "field_type": "DROPDOWN",
  "configuration": {
    "key": "stay_duration",
    "validation": { "is_required": false },
    "ui_schema": {
      "component": "Dropdown",
      "placeholder": "-- Stay duration (Optional) --"
    },
    "default_value": ""
  }
}
```

```json
{
  "name": "Location",
  "field_type": "DROPDOWN",
  "configuration": {
    "key": "location",
    "validation": { "is_required": true },
    "ui_schema": { "component": "Dropdown", "placeholder": "-- Location --" },
    "default_value": "North Wing"
  }
}
```

```json
{
  "name": "Estimated Days",
  "field_type": "NUMBER",
  "configuration": {
    "key": "estimated_days",
    "validation": { "is_required": false, "min": 0, "max": 100 },
    "ui_schema": { "component": "Stepper" },
    "default_value": 0
  }
}
```

```json
{
  "name": "Estimated Hours",
  "field_type": "NUMBER",
  "configuration": {
    "key": "estimated_hours",
    "validation": { "is_required": false, "min": 0, "max": 23 },
    "ui_schema": { "component": "Stepper" },
    "default_value": 0
  }
}
```

**Response `200 OK`:**

```json
{
  "status": "success",
  "data": {
    "id": "f5a6b7c8-5555-4a2b-9c3d-000000000005",
    "project_id": "b7f1e2a0-1111-4a2b-9c3d-000000000001",
    "name": "Estimated Days",
    "field_type": "NUMBER",
    "configuration": {
      "key": "estimated_days",
      "validation": { "is_required": false, "min": 0, "max": 100 },
      "ui_schema": { "component": "Stepper" },
      "default_value": 0
    }
  },
  "message": "Custom field definition created successfully"
}
```

**Capture:** `data.id` for each — you'll need `{{custom_field_definition_id_estimated_days}}` in the next step. `custom_field_definitions` live at the **project** level (not tied to a type) — Step 7 is what actually attaches one to a work item type's form.

---

## Step 7 — Link a Custom Field to a Work Item Type

**`POST {{URL}}/api/workflow-engine/projects/{{project_id}}/work-item-types/{{work_item_type_id_maintenance}}/field-configurations`**

The seeder wires exactly one of these: `estimated_days` onto the **Maintenance** type.

```json
{
  "custom_field_definition_id": "{{custom_field_definition_id_estimated_days}}",
  "is_required": false,
  "default_value": "0",
  "sort_order": 0
}
```

| Field                        | Required            | Notes                                               |
| ---------------------------- | ------------------- | --------------------------------------------------- |
| `custom_field_definition_id` | yes                 | must be a `custom-field-definitions` ID from Step 6 |
| `is_required`                | no, default `false` | per-type override                                   |
| `default_value`              | no                  | stored as text                                      |
| `sort_order`                 | no                  | form ordering                                       |

**Response `200 OK`:**

```json
{
  "status": "success",
  "data": {
    "id": "a6b7c8d9-6666-4a2b-9c3d-000000000006",
    "work_item_type_id": "e4f5a6b7-4444-4a2b-9c3d-000000000004",
    "custom_field_definition_id": "f5a6b7c8-5555-4a2b-9c3d-000000000005",
    "is_required": false,
    "default_value": "0",
    "sort_order": 0
  },
  "message": "Type field configuration mapped successfully"
}
```

> The other 5 custom fields (`room`, `floor`, `stay_duration`, `location`, `estimated_hours`) don't strictly need a `field-configurations` link to be usable — the backend doesn't enforce an allowlist on `custom_field_values` at work-item-create time (see Step 8). The link only matters for driving a generated form UI.

---

## Step 8 — Create Work Items

**`POST {{URL}}/api/workflow-engine/projects/{{project_id}}/work-items`** — run once per item below.

| Field                     | Required             | Notes                                                                                        |
| ------------------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| `type_id`                 | yes                  | a Work Item Type ID from Step 5                                                              |
| `current_status_id`       | yes                  | must be a status that's a **node in that type's workflow** (Step 4)                          |
| `title`                   | yes                  | trimmed, non-empty                                                                           |
| `description`             | no                   |                                                                                              |
| `priority`                | no, default `MEDIUM` | enum `LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL`                                               |
| `assignee_id`             | no                   | any UUID — not FK-checked against a real user table                                          |
| `due_date` / `start_date` | no                   | unix **milliseconds**                                                                        |
| `custom_field_values`     | no                   | free-form JSON object, keyed by the `key` you chose in each field's `configuration` (Step 6) |

`reporter_id` is **always** overwritten server-side from the caller's JWT `uuid` claim — don't bother sending it. `item_number` is auto-assigned by a DB trigger (sequential per project).

> ⚠️ **`estimated_duration` is type-dependent.** Work items of the **Maintenance** type carry an extra key inside `custom_field_values`: `"estimated_duration": { "days": 0, "hours": 0 }` (nested object, not the flat `estimated_days`/`estimated_hours` field names from Step 6 — those field definitions exist only to drive the form UI's two Stepper inputs, but the value is written back as one combined object under the single key `estimated_duration`). When you don't have a real estimate yet, default it to `{ "days": 0, "hours": 0 }`. Work items of the **Housekeeping** type must **omit** `estimated_duration` from `custom_field_values` entirely — don't send it, even as zeros.

### Fully worked example — Housekeeping type

```json
{
  "type_id": "{{work_item_type_id_housekeeping}}",
  "title": "Clean Master Suite",
  "description": "Deep clean of the master suite including bathroom.",
  "current_status_id": "{{status_id_in_progress}}",
  "priority": "LOW",
  "assignee_id": "2230dc9e-a9c1-490e-98e3-0ac061207618",
  "due_date": 1791100800000,
  "custom_field_values": {
    "room": "Room 4",
    "location": "North Wing",
    "floor": "Floor 1",
    "stay_duration": "Short Stay"
  }
}
```

**Response `200 OK`:**

```json
{
  "status": "success",
  "data": {
    "id": "b7c8d9e0-7777-4a2b-9c3d-000000000007",
    "project_id": "b7f1e2a0-1111-4a2b-9c3d-000000000001",
    "type_id": "e4f5a6b7-4444-4a2b-9c3d-000000000004",
    "current_status_id": "c2d3e4f5-2222-4a2b-9c3d-000000000002",
    "item_number": 1,
    "title": "Clean Master Suite",
    "description": "Deep clean of the master suite including bathroom.",
    "priority": "LOW",
    "reporter_id": "<from your JWT>",
    "assignee_id": "2230dc9e-a9c1-490e-98e3-0ac061207618",
    "due_date": 1791100800000,
    "custom_field_values": {
      "room": "Room 4",
      "location": "North Wing",
      "floor": "Floor 1",
      "stay_duration": "Short Stay"
    }
  },
  "message": "Work item recorded successfully"
}
```

### Fully worked example — Maintenance type

```json
{
  "type_id": "{{work_item_type_id_maintenance}}",
  "title": "Fix AC Unit",
  "description": "AC unit making rattling noise.",
  "current_status_id": "{{status_id_todo}}",
  "priority": "HIGH",
  "assignee_id": "efc3680c-2a92-4f70-ae48-684e5129f43c",
  "due_date": 1791100800000,
  "custom_field_values": {
    "room": "Room 4",
    "location": "North Wing",
    "floor": "Floor 6",
    "stay_duration": "Short Stay",
    "estimated_duration": { "days": 0, "hours": 0 }
  }
}
```

**Response `200 OK`:**

```json
{
  "status": "success",
  "data": {
    "id": "c8d9e0f1-8888-4a2b-9c3d-000000000008",
    "project_id": "b7f1e2a0-1111-4a2b-9c3d-000000000001",
    "type_id": "{{work_item_type_id_maintenance}}",
    "current_status_id": "{{status_id_todo}}",
    "item_number": 2,
    "title": "Fix AC Unit",
    "description": "AC unit making rattling noise.",
    "priority": "HIGH",
    "reporter_id": "<from your JWT>",
    "assignee_id": "efc3680c-2a92-4f70-ae48-684e5129f43c",
    "due_date": 1791100800000,
    "custom_field_values": {
      "room": "Room 4",
      "location": "North Wing",
      "floor": "Floor 6",
      "stay_duration": "Short Stay",
      "estimated_duration": { "days": 0, "hours": 0 }
    }
  },
  "message": "Work item recorded successfully"
}
```

Note the only structural difference from the Housekeeping example: the added `estimated_duration` key. Everything else (`room`, `location`, `floor`, `stay_duration`) is shared across both types.

### The rest of the seeded set

Two fixed placeholder assignee UUIDs are reused across items (not real accounts — nothing validates them):

- Housekeeper: `2230dc9e-a9c1-490e-98e3-0ac061207618`
- Maintenance: `efc3680c-2a92-4f70-ae48-684e5129f43c`

| #   | title              | type         | status      | priority | assignee               | custom_field_values                                          |
| --- | ------------------ | ------------ | ----------- | -------- | ---------------------- | -------------------------------------------------------------- |
| 1   | Clean Master Suite | Housekeeping | In Progress | LOW      | Housekeeper            | `{room, location, floor, stay_duration}` — shown above       |
| 2   | Fix AC Unit        | Maintenance  | To Do       | HIGH     | Maintenance            | room/location/floor/stay_duration + `"estimated_duration": { "days": 0, "hours": 1 }` — shown above uses `{0, 0}` as the default |
| 3   | Restock Mini Bar   | Housekeeping | Done        | LOW      | Housekeeper            | room/location/floor as applicable — **no** `estimated_duration` |
| 4   | Replace Showerhead | Maintenance  | Closed      | MEDIUM   | Maintenance            | room/location/floor/stay_duration + `"estimated_duration": { "days": 2, "hours": 11 }` |
| 5   | Turn down service  | Housekeeping | Cancelled   | LOW      | Housekeeper            | room/location/floor as applicable — **no** `estimated_duration` |
| 6   | Carpet Cleaning    | Housekeeping | Cancelled   | LOW      | Housekeeper            | room/location/floor as applicable — **no** `estimated_duration` |
| 7   | Unassign Task      | Housekeeping | To Do       | LOW      | _(omit `assignee_id`)_ | room/location/floor as applicable — **no** `estimated_duration` |

For rows where the exact `description`/`room`/`floor` text isn't critical, fill in any realistic placeholder — only `type_id`, a status that's a valid node for that type's workflow, and (for Maintenance items) the `estimated_duration` custom field matter for reproducing the seeder's intent. Remember: `estimated_duration` is only ever sent for Maintenance items — never include it for Housekeeping items, not even as `{ "days": 0, "hours": 0 }`.

---

## Appendix A — Enum reference

| Enum                                                 | Valid values                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------ |
| `status_category` (Status.category)                  | `TODO`, `IN_PROGRESS`, `DONE`                                            |
| `priority_level` (WorkItem.priority)                 | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`                                      |
| `field_data_type` (CustomFieldDefinition.field_type) | `TEXT`, `NUMBER`, `DATE`, `DROPDOWN`, `USER_PICKER`, `BOOLEAN`, `OBJECT` |

---

## Appendix B — Error codes you may hit

| HTTP | `code`                                                          | When                                                                                       |
| ---- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 400  | `EMPTY_PROJECT_NAME` / `INVALID_PROJECT_KEY`                    | Project `name` blank, or `key` blank/over 10 chars                                         |
| 409  | `PROJECT_KEY_ALREADY_EXISTS`                                    | `key` already used in this community                                                       |
| 409  | `PROJECT_TOOL_ALREADY_EXISTS`                                   | non-`GENERIC` `tool` already used by another project in this community                     |
| 400  | `EMPTY_STATUS_NAME`                                             | Status `name` blank                                                                        |
| 409  | `STATUS_ALREADY_EXISTS_IN_PROJECT`                              | duplicate status `name` in the project                                                     |
| 400  | `EMPTY_TYPE_NAME`                                               | Work Item Type `name` blank                                                                |
| 409  | `TYPE_ALREADY_EXISTS_IN_PROJECT`                                | duplicate type `name` in the project                                                       |
| 400  | `EMPTY_WORK_ITEM_TITLE`                                         | Work Item `title` blank                                                                    |
| 400  | `MUST_HAVE_EXACTLY_ONE_INITIAL_STATE`                           | Canvas save: zero or 2+ nodes with `is_initial_state: true`                                |
| 400  | `DANGLING_TRANSITION_EDGE`                                      | Canvas save: a transition references a status not present in `nodes`                       |
| 500  | _(plain error, no code)_ "Invalid State Mutation: ..."          | Work item create/update: `current_status_id` isn't a node of the type's bound workflow     |
| 500  | _(plain error, no code)_ "Structural Constraint Violation: ..." | Work item create/update: `parent_item_id` set on a type where `is_subtask_type` is `false` |
| 401  | —                                                               | Missing/invalid `Authorization`, `X-House`, or `X-Trace-ID` header                         |

---

## Appendix C — Known issues in the bundled Postman collection

If you're starting from `docs/workflow_engine.postman_collection.json` in the `sc-workflow-engine` repo rather than building requests from scratch, watch out for these:

1. **Missing `X-Trace-ID`.** The collection's pre-request script only injects `X-House`:

   ```js
   pm.request.headers.add({
     key: "X-House",
     value: pm.collectionVariables.get("X-House"),
   });
   ```

   Add a line for `X-Trace-ID` (any non-empty string) or every request will 401.

2. **`{{URL}}` isn't defined** as a collection variable — add it to your environment before running anything.
3. **Workflow → Create** request URL wrongly has a trailing `/{{workflow_id}}` segment. The real endpoint is `POST /projects/{{project_id}}/workflows` with no ID in the path.
4. **Workflow Canvas → Get / Save** URLs have a stray extra `}}` typo (`.../projects/{{project_id}}}}/workflows/...`) — fix to `.../projects/{{project_id}}/workflows/{{workflow_id}}/layout`.
5. **Custom Field Definitions → Create** example body doesn't match the current API — it sends top-level `id`, `key`, `validation`, `ui_schema`, `sort_order`, `default_value`, none of which exist on the model. Use the `{name, field_type, configuration}` shape from Step 6 instead.
6. **Type Field Config → Create** example body is copy-pasted from Work Item Types and doesn't match `{custom_field_definition_id, is_required, default_value, sort_order}` at all. Use the shape from Step 7.
7. **Comments → List By Work Item** points at `/api/stay-management/...` instead of `/api/workflow-engine/...` — looks like a leftover from a different service and won't resolve against this API.
