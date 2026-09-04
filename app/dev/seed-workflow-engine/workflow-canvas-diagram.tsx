"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  WorkflowCanvasResponse,
  WorkflowNode,
  WorkflowTransition,
} from "@/lib/api/workflowEngine/types";
import type { SaveWorkflowCanvasPayload } from "@/lib/api/workflowEngine/workflowCanvas";
import { TransitionNameModal, type PendingConnection } from "./transition-name-modal";
import { SaveCanvasPanel } from "./save-canvas-panel";

const BOX_WIDTH = 176;
const BOX_HEIGHT = 64;
const COLUMN_GAP = 64;
const ROW_GAP = 96;
const ANCHOR_GAP = 4;
const FORWARD_PULL = ROW_GAP / 2;
const LATERAL_PULL = 20;
const LATERAL_BULGE = 28;
const BACK_EDGE_BASE_MARGIN = 64;
const BACK_EDGE_SPAN_FACTOR = 40;
const BACK_EDGE_LANE_SPACING = 28;
const BOTTOM_PADDING = 32;
const EDGE_SAFETY_PADDING = 16;
const AUTO_SCROLL_EDGE_PX = 48;
const AUTO_SCROLL_MAX_SPEED_PX = 16;

const STATUS_COLOR_STYLES: Record<string, string> = {
  orange:
    "bg-orange-50 border-orange-300 text-orange-900 dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-200",
  blue: "bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-200",
  green:
    "bg-green-50 border-green-300 text-green-900 dark:bg-green-950/40 dark:border-green-800 dark:text-green-200",
  red: "bg-red-50 border-red-300 text-red-900 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200",
};
const DEFAULT_STATUS_COLOR_STYLE = "bg-muted border-border text-foreground";

function getStatusColorStyle(color: string | undefined): string {
  if (!color) return DEFAULT_STATUS_COLOR_STYLE;
  return STATUS_COLOR_STYLES[color] ?? DEFAULT_STATUS_COLOR_STYLE;
}

interface Point {
  x: number;
  y: number;
}

// Static graph topology (BFS level/column from the initial node, plus the
// analytical position used before a box has ever been dragged). Independent
// of live drag state — only recomputed when the nodes/transitions change.
interface NodeTopologyEntry {
  level: number;
  column: number;
  x: number;
  y: number;
}

interface PositionedNode {
  node: WorkflowNode;
  x: number;
  y: number;
}

type EdgeKind = "forward" | "lateral" | "backward";

interface EdgeGeometry {
  transition: DraftTransition;
  kind: EdgeKind;
  d: string;
  labelPoint: Point;
}

interface WorkflowCanvasLayout {
  positionedNodes: PositionedNode[];
  edges: EdgeGeometry[];
  globalTransitions: DraftTransition[];
  totalWidth: number;
  totalHeight: number;
}

const EMPTY_LAYOUT: WorkflowCanvasLayout = {
  positionedNodes: [],
  edges: [],
  globalTransitions: [],
  totalWidth: 0,
  totalHeight: 0,
};

// The one editable transition shape — used for BOTH rendering (topology,
// layout, routing) and the save payload. Keyed by NODE id, matching all the
// diagram's existing routing code; converted to status id exactly once, in
// buildSaveWorkflowCanvasPayload.
interface DraftTransition {
  localId: string; // stable React key + deletion handle
  id: string | null; // real backend id if loaded from props; null = drawn locally, not yet saved
  name: string;
  fromNodeId: string | null; // null only for is_global
  toNodeId: string;
  isGlobal: boolean;
  rules: Record<string, unknown>;
}

interface ConnectionDragState {
  sourceNodeId: string;
  pointerId: number;
  currentPoint: Point;
  hoveredNodeId: string | null;
}

interface AutoScrollController {
  start: (scrollElement: HTMLElement | null, clientX: number, clientY: number) => void;
  update: (clientX: number, clientY: number) => void;
  stop: () => void;
}

// Local, self-sufficient canvas state — seeded from props once, then edited
// (positions, drafted transitions) independent of the props until either a
// fresh workflow loads or a save completes.
interface CanvasEditorState {
  workflowId: string;
  nodes: WorkflowNode[];
  positionOverrides: Record<string, Point>;
  transitions: DraftTransition[];
}

function bezierPointAt(p0: Point, c1: Point, c2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  const a = mt * mt * mt;
  const b = 3 * mt * mt * t;
  const c = 3 * mt * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * c1.x + c * c2.x + d * p3.x,
    y: a * p0.y + b * c1.y + c * c2.y + d * p3.y,
  };
}

function cubicPathD(p0: Point, c1: Point, c2: Point, p3: Point): string {
  return `M ${p0.x},${p0.y} C ${c1.x},${c1.y} ${c2.x},${c2.y} ${p3.x},${p3.y}`;
}

function getOrThrow<T>(map: Map<string, T>, key: string, label: string): T {
  const value = map.get(key);
  if (value === undefined) {
    throw new Error(`workflow-canvas-diagram: missing ${label} for "${key}"`);
  }
  return value;
}

function toDraftTransition(transition: WorkflowTransition): DraftTransition {
  return {
    localId: transition.id,
    id: transition.id,
    name: transition.name,
    fromNodeId: transition.from_node_id,
    toNodeId: transition.to_node_id,
    isGlobal: transition.is_global,
    rules: transition.rules,
  };
}

function initCanvasState(
  workflowId: string,
  nodes: WorkflowNode[],
  transitions: WorkflowTransition[],
): CanvasEditorState {
  return {
    workflowId,
    nodes,
    positionOverrides: {},
    transitions: transitions.map(toDraftTransition),
  };
}

// BFS from the initial-state node over non-global transitions, assigning
// each node a row (level) and a starting x/y. This is the graph's static
// shape — it does not change as boxes get dragged, only when the underlying
// nodes/transitions do (e.g. a fresh seed run or a save).
function computeNodeTopology(
  nodes: WorkflowNode[],
  transitions: DraftTransition[],
): Map<string, NodeTopologyEntry> {
  const topology = new Map<string, NodeTopologyEntry>();
  if (nodes.length === 0) return topology;

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const edgeTransitions = transitions.filter(
    (transition): transition is DraftTransition & { fromNodeId: string } =>
      !transition.isGlobal &&
      transition.fromNodeId !== null &&
      nodeById.has(transition.fromNodeId) &&
      nodeById.has(transition.toNodeId),
  );

  const adjacency = new Map<string, string[]>();
  for (const transition of edgeTransitions) {
    const neighbors = adjacency.get(transition.fromNodeId);
    if (neighbors) {
      neighbors.push(transition.toNodeId);
    } else {
      adjacency.set(transition.fromNodeId, [transition.toNodeId]);
    }
  }

  const initialNode = nodes.find((node) => node.is_initial_state) ?? nodes[0];

  const rows: string[][] = [[initialNode.id]];
  const level = new Map<string, number>([[initialNode.id, 0]]);
  const queue: string[] = [initialNode.id];

  const ensureRow = (index: number): string[] => {
    if (!rows[index]) {
      rows[index] = [];
    }
    return rows[index];
  };

  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    const currentLevel = level.get(currentId) as number;
    for (const neighborId of adjacency.get(currentId) ?? []) {
      if (!level.has(neighborId)) {
        level.set(neighborId, currentLevel + 1);
        ensureRow(currentLevel + 1).push(neighborId);
        queue.push(neighborId);
      }
    }
  }

  const orphanIds = nodes.map((node) => node.id).filter((id) => !level.has(id));
  if (orphanIds.length > 0) {
    const orphanLevel = rows.length;
    rows.push(orphanIds);
    orphanIds.forEach((id) => level.set(id, orphanLevel));
  }

  const rowWidths = rows.map(
    (row) => row.length * BOX_WIDTH + Math.max(0, row.length - 1) * COLUMN_GAP,
  );
  const diagramWidth = Math.max(...rowWidths, BOX_WIDTH);

  rows.forEach((row, rowLevel) => {
    const rowStartX = (diagramWidth - rowWidths[rowLevel]) / 2;
    row.forEach((nodeId, column) => {
      topology.set(nodeId, {
        level: rowLevel,
        column,
        x: rowStartX + column * (BOX_WIDTH + COLUMN_GAP),
        y: rowLevel * (BOX_HEIGHT + ROW_GAP),
      });
    });
  });

  return topology;
}

// Renders nodes at their CURRENT (possibly dragged) positions. Each edge's
// routing strategy — forward S-curve, same-row facing-side curve, or
// loop-out-to-a-gutter for back-edges — is chosen from the static topology
// (so it doesn't flip strategy mid-drag), but every coordinate in the curve
// is computed from live positions, so arrows always track the boxes they
// connect.
function computeWorkflowCanvasLayout(
  nodes: WorkflowNode[],
  transitions: DraftTransition[],
  topology: Map<string, NodeTopologyEntry>,
  resolvedPositions: Map<string, Point>,
): WorkflowCanvasLayout {
  if (nodes.length === 0) return EMPTY_LAYOUT;

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const edgeTransitions = transitions.filter(
    (transition): transition is DraftTransition & { fromNodeId: string } =>
      !transition.isGlobal &&
      transition.fromNodeId !== null &&
      nodeById.has(transition.fromNodeId) &&
      nodeById.has(transition.toNodeId),
  );
  const globalTransitions = transitions.filter(
    (transition) => transition.isGlobal && nodeById.has(transition.toNodeId),
  );

  const positionedNodes: PositionedNode[] = [...topology.entries()]
    .sort(([, a], [, b]) => a.level - b.level || a.column - b.column)
    .map(([nodeId]) => {
      const point = getOrThrow(resolvedPositions, nodeId, "position");
      return { node: getOrThrow(nodeById, nodeId, "node"), x: point.x, y: point.y };
    });

  const maxRight = Math.max(...positionedNodes.map((p) => p.x + BOX_WIDTH), BOX_WIDTH);
  const maxBottom = Math.max(...positionedNodes.map((p) => p.y + BOX_HEIGHT), BOX_HEIGHT);

  let backwardLane = 0;
  let maxGutterX = maxRight;

  const edges: EdgeGeometry[] = edgeTransitions.map((transition) => {
    const fromTopology = getOrThrow(topology, transition.fromNodeId, "topology");
    const toTopology = getOrThrow(topology, transition.toNodeId, "topology");
    const fromPoint = getOrThrow(resolvedPositions, transition.fromNodeId, "position");
    const toPoint = getOrThrow(resolvedPositions, transition.toNodeId, "position");
    const deltaLevel = toTopology.level - fromTopology.level;

    let p0: Point;
    let c1: Point;
    let c2: Point;
    let p3: Point;
    let kind: EdgeKind;

    if (deltaLevel === 0) {
      kind = "lateral";
      const targetIsRight = toPoint.x >= fromPoint.x;
      p0 = targetIsRight
        ? { x: fromPoint.x + BOX_WIDTH + ANCHOR_GAP, y: fromPoint.y + BOX_HEIGHT / 2 }
        : { x: fromPoint.x - ANCHOR_GAP, y: fromPoint.y + BOX_HEIGHT / 2 };
      p3 = targetIsRight
        ? { x: toPoint.x - ANCHOR_GAP, y: toPoint.y + BOX_HEIGHT / 2 }
        : { x: toPoint.x + BOX_WIDTH + ANCHOR_GAP, y: toPoint.y + BOX_HEIGHT / 2 };
      const pullSign = targetIsRight ? 1 : -1;
      c1 = { x: p0.x + pullSign * LATERAL_PULL, y: p0.y + LATERAL_BULGE };
      c2 = { x: p3.x - pullSign * LATERAL_PULL, y: p3.y + LATERAL_BULGE };
    } else if (deltaLevel > 0) {
      kind = "forward";
      const sourceIsAbove = fromPoint.y <= toPoint.y;
      p0 = sourceIsAbove
        ? { x: fromPoint.x + BOX_WIDTH / 2, y: fromPoint.y + BOX_HEIGHT + ANCHOR_GAP }
        : { x: fromPoint.x + BOX_WIDTH / 2, y: fromPoint.y - ANCHOR_GAP };
      p3 = sourceIsAbove
        ? { x: toPoint.x + BOX_WIDTH / 2, y: toPoint.y - ANCHOR_GAP }
        : { x: toPoint.x + BOX_WIDTH / 2, y: toPoint.y + BOX_HEIGHT + ANCHOR_GAP };
      const pull = sourceIsAbove ? FORWARD_PULL : -FORWARD_PULL;
      c1 = { x: p0.x, y: p0.y + pull };
      c2 = { x: p3.x, y: p3.y - pull };
    } else {
      kind = "backward";
      const lane = backwardLane;
      backwardLane += 1;
      const gutterX =
        maxRight +
        BACK_EDGE_BASE_MARGIN +
        BACK_EDGE_SPAN_FACTOR * Math.abs(deltaLevel) +
        BACK_EDGE_LANE_SPACING * lane;
      maxGutterX = Math.max(maxGutterX, gutterX);
      p0 = { x: fromPoint.x + BOX_WIDTH + ANCHOR_GAP, y: fromPoint.y + BOX_HEIGHT / 2 };
      p3 = { x: toPoint.x + BOX_WIDTH + ANCHOR_GAP, y: toPoint.y + BOX_HEIGHT / 2 };
      c1 = { x: gutterX, y: p0.y };
      c2 = { x: gutterX, y: p3.y };
    }

    return {
      transition,
      kind,
      d: cubicPathD(p0, c1, c2, p3),
      labelPoint: bezierPointAt(p0, c1, c2, p3, 0.5),
    };
  });

  return {
    positionedNodes,
    edges,
    globalTransitions,
    totalWidth: Math.max(maxRight, maxGutterX) + EDGE_SAFETY_PADDING,
    totalHeight: maxBottom + BOTTOM_PADDING,
  };
}

// How fast to scroll when the drag pointer is `distanceIn` px inside the
// edge zone (0 = right at/past the edge, AUTO_SCROLL_EDGE_PX = just
// entering it) — negative to scroll toward `min`, positive toward `max`.
function computeEdgeScrollDelta(pointerPos: number, min: number, max: number): number {
  if (pointerPos < min + AUTO_SCROLL_EDGE_PX) {
    const distanceIn = Math.max(0, pointerPos - min);
    const proximity = 1 - Math.min(distanceIn, AUTO_SCROLL_EDGE_PX) / AUTO_SCROLL_EDGE_PX;
    return -proximity * AUTO_SCROLL_MAX_SPEED_PX;
  }
  if (pointerPos > max - AUTO_SCROLL_EDGE_PX) {
    const distanceIn = Math.max(0, max - pointerPos);
    const proximity = 1 - Math.min(distanceIn, AUTO_SCROLL_EDGE_PX) / AUTO_SCROLL_EDGE_PX;
    return proximity * AUTO_SCROLL_MAX_SPEED_PX;
  }
  return 0;
}

// Auto-scrolls the diagram's horizontal wrapper and the page vertically
// while a drag's pointer sits near an edge, so dragging a box (or drawing a
// connection) toward the edge of the visible area reveals more space
// instead of leaving the destination invisible. Takes no element up front —
// the scroll element is only ever supplied to `start`, which callers invoke
// from event handlers, so nothing here ever reads a ref during render.
function createAutoScrollController(): AutoScrollController {
  let rafId: number | null = null;
  let scrollElement: HTMLElement | null = null;
  let pointerX = 0;
  let pointerY = 0;

  function tick() {
    if (scrollElement) {
      const rect = scrollElement.getBoundingClientRect();
      const dx = computeEdgeScrollDelta(pointerX, rect.left, rect.right);
      if (dx !== 0) scrollElement.scrollLeft += dx;
    }
    const dy = computeEdgeScrollDelta(pointerY, 0, window.innerHeight);
    if (dy !== 0) window.scrollBy(0, dy);
    rafId = requestAnimationFrame(tick);
  }

  return {
    start(element, clientX, clientY) {
      scrollElement = element;
      pointerX = clientX;
      pointerY = clientY;
      if (rafId === null) {
        rafId = requestAnimationFrame(tick);
      }
    },
    update(clientX, clientY) {
      pointerX = clientX;
      pointerY = clientY;
    },
    stop() {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      scrollElement = null;
    },
  };
}

function hitTestNode(
  positionedNodes: PositionedNode[],
  point: Point,
  excludeNodeId: string,
): string | null {
  for (const positioned of positionedNodes) {
    if (positioned.node.id === excludeNodeId) continue; // no self-loops
    if (
      point.x >= positioned.x &&
      point.x <= positioned.x + BOX_WIDTH &&
      point.y >= positioned.y &&
      point.y <= positioned.y + BOX_HEIGHT
    ) {
      return positioned.node.id;
    }
  }
  return null;
}

// The only place node-id -> status-id conversion happens. The save endpoint
// resolves from_node_id/to_node_id as STATUS ids (verified against the Go
// backend), unlike the read/GET shape where they're workflow_node ids.
function buildSaveWorkflowCanvasPayload(
  nodes: WorkflowNode[],
  draftTransitions: DraftTransition[],
  resolvedPositions: Map<string, Point>,
): SaveWorkflowCanvasPayload {
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const statusIdFor = (nodeId: string, label: string): string =>
    getOrThrow(nodeById, nodeId, label).status_id;

  return {
    nodes: nodes.map((node) => {
      const pos = getOrThrow(resolvedPositions, node.id, "position");
      return {
        status_id: node.status_id,
        ui_pos_x: Math.round(pos.x),
        ui_pos_y: Math.round(pos.y),
        is_initial_state: node.is_initial_state,
      };
    }),
    transitions: draftTransitions.map((transition) => {
      if (transition.isGlobal) {
        return {
          name: transition.name,
          from_node_id: "",
          to_node_id: statusIdFor(transition.toNodeId, "toNodeId"),
          is_global: true,
          rules: transition.rules,
        };
      }
      if (transition.fromNodeId === null) {
        throw new Error(
          `workflow-canvas-diagram: non-global transition "${transition.localId}" has no fromNodeId`,
        );
      }
      return {
        name: transition.name,
        from_node_id: statusIdFor(transition.fromNodeId, "fromNodeId"),
        to_node_id: statusIdFor(transition.toNodeId, "toNodeId"),
        is_global: false,
        rules: transition.rules,
      };
    }),
  };
}

function StatusNodeBox({
  positioned,
  onPositionChange,
  onConnectionDragStart,
  isDropTarget,
  isConnectionSource,
  autoScroll,
  scrollWrapperRef,
}: {
  positioned: PositionedNode;
  onPositionChange: (nodeId: string, point: Point) => void;
  onConnectionDragStart: (
    nodeId: string,
    pointerId: number,
    clientX: number,
    clientY: number,
  ) => void;
  isDropTarget: boolean;
  isConnectionSource: boolean;
  autoScroll: AutoScrollController;
  scrollWrapperRef: RefObject<HTMLDivElement | null>;
}) {
  const { node, x, y } = positioned;
  const statusName = node.status?.name ?? node.status_id;
  const dragStateRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    startScrollLeft: number;
    startScrollTop: number;
  } | null>(null);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: x,
      startY: y,
      startScrollLeft: scrollWrapperRef.current?.scrollLeft ?? 0,
      startScrollTop: window.scrollY,
    };
    autoScroll.start(scrollWrapperRef.current, event.clientX, event.clientY);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;
    if ((event.buttons & 1) === 0) {
      // The primary button isn't actually held (e.g. capture survived a
      // mouseup that landed elsewhere, or focus was lost mid-drag). A
      // mouse's pointerId is reused across gestures, so without this check
      // a later plain hover would be misread as a drag continuation and
      // jump the box using this stale start reference.
      dragStateRef.current = null;
      autoScroll.stop();
      return;
    }
    autoScroll.update(event.clientX, event.clientY);
    // Auto-scroll (or a manual scroll mid-drag) moves the wrapper/page under
    // a stationary cursor with no pointermove of its own — fold however
    // much has scrolled since drag-start into the position so the box keeps
    // following the cursor instead of drifting behind as the view scrolls.
    const scrollDeltaX = (scrollWrapperRef.current?.scrollLeft ?? 0) - dragState.startScrollLeft;
    const scrollDeltaY = window.scrollY - dragState.startScrollTop;
    const nextX = Math.max(
      0,
      dragState.startX + (event.clientX - dragState.startClientX) + scrollDeltaX,
    );
    const nextY = Math.max(
      0,
      dragState.startY + (event.clientY - dragState.startClientY) + scrollDeltaY,
    );
    onPositionChange(node.id, { x: nextX, y: nextY });
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
    }
    autoScroll.stop();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function handleLostPointerCapture(event: ReactPointerEvent<HTMLDivElement>) {
    // Fires whenever capture ends for any reason, including ones that never
    // deliver a matching pointerup here — the definitive place to clear
    // drag state so it can't go stale.
    if (dragStateRef.current?.pointerId === event.pointerId) {
      dragStateRef.current = null;
      autoScroll.stop();
    }
  }

  function handleConnectorPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.stopPropagation(); // don't also start a reposition-drag on the box body
    onConnectionDragStart(node.id, event.pointerId, event.clientX, event.clientY);
  }

  return (
    <div
      className={cn(
        "group/node absolute flex touch-none items-center justify-center rounded-lg border-2 px-3 text-center text-sm font-medium shadow-sm select-none cursor-grab active:cursor-grabbing",
        getStatusColorStyle(node.status?.color),
        node.is_initial_state &&
          "ring-2 ring-primary ring-offset-2 ring-offset-background",
        isDropTarget &&
          "outline outline-2 outline-dashed outline-primary outline-offset-2",
      )}
      style={{ left: x, top: y, width: BOX_WIDTH, height: BOX_HEIGHT }}
      title={statusName}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onLostPointerCapture={handleLostPointerCapture}
    >
      {node.is_initial_state && (
        <Badge
          variant="outline"
          className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-card"
        >
          Initial
        </Badge>
      )}
      <span className="truncate">{statusName}</span>
      <div
        className={cn(
          "absolute top-1/2 -right-1.5 size-3.5 -translate-y-1/2 touch-none rounded-full border-2 border-background bg-primary opacity-0 transition-opacity group-hover/node:opacity-100",
          isConnectionSource && "opacity-100",
        )}
        title="Drag to create a transition"
        onPointerDown={handleConnectorPointerDown}
      />
    </div>
  );
}

function TransitionEdgePath({
  edge,
  arrowheadId,
  onRemove,
}: {
  edge: EdgeGeometry;
  arrowheadId: string;
  onRemove: (localId: string) => void;
}) {
  const isUnsaved = edge.transition.id === null;
  const labelWidth = Math.max(28, edge.transition.name.length * 5.5 + 12);
  const labelHeight = 16;
  const labelText = isUnsaved ? `${edge.transition.name} ×` : edge.transition.name;

  return (
    <g>
      <path
        d={edge.d}
        fill="none"
        className={isUnsaved ? "stroke-primary" : "stroke-muted-foreground"}
        strokeWidth={1.5}
        strokeDasharray={isUnsaved ? "5,4" : undefined}
        markerEnd={`url(#${arrowheadId})`}
      />
      {edge.transition.name && (
        <g
          transform={`translate(${edge.labelPoint.x - labelWidth / 2}, ${edge.labelPoint.y - labelHeight / 2})`}
          className={cn(isUnsaved && "cursor-pointer pointer-events-auto")}
          onClick={isUnsaved ? () => onRemove(edge.transition.localId) : undefined}
        >
          {isUnsaved && <title>Remove this unsaved transition</title>}
          <rect
            width={labelWidth}
            height={labelHeight}
            rx={4}
            className="fill-card stroke-border"
            strokeWidth={1}
          />
          <text
            x={labelWidth / 2}
            y={labelHeight / 2 + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground"
            fontSize={9}
          >
            {labelText}
          </text>
        </g>
      )}
    </g>
  );
}

function ConnectionPreviewLine({
  connectionDrag,
  resolvedPositions,
  arrowheadId,
}: {
  connectionDrag: ConnectionDragState;
  resolvedPositions: Map<string, Point>;
  arrowheadId: string;
}) {
  const sourcePos = resolvedPositions.get(connectionDrag.sourceNodeId);
  if (!sourcePos) return null;
  const anchor = {
    x: sourcePos.x + BOX_WIDTH + ANCHOR_GAP,
    y: sourcePos.y + BOX_HEIGHT / 2,
  };
  return (
    <line
      x1={anchor.x}
      y1={anchor.y}
      x2={connectionDrag.currentPoint.x}
      y2={connectionDrag.currentPoint.y}
      className="stroke-primary"
      strokeWidth={1.5}
      strokeDasharray="4,4"
      markerEnd={`url(#${arrowheadId})`}
    />
  );
}

function GlobalTransitionsList({
  transitions,
  nodeById,
}: {
  transitions: DraftTransition[];
  nodeById: Map<string, WorkflowNode>;
}) {
  return (
    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">
        Global transitions (from any status)
      </span>
      <ul className="flex flex-col gap-0.5">
        {transitions.map((transition) => {
          const targetName =
            nodeById.get(transition.toNodeId)?.status?.name ?? transition.toNodeId;
          return (
            <li key={transition.localId}>
              → {targetName} <span className="italic">({transition.name})</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

interface WorkflowCanvasDiagramProps {
  nodes: WorkflowNode[];
  transitions: WorkflowTransition[];
  projectId: string;
  workflowId: string;
  onCanvasUpdate?: (canvas: WorkflowCanvasResponse) => void;
}

export function WorkflowCanvasDiagram({
  nodes,
  transitions,
  projectId,
  workflowId,
  onCanvasUpdate,
}: WorkflowCanvasDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const [autoScroll] = useState<AutoScrollController>(() => createAutoScrollController());
  const [canvasState, setCanvasState] = useState<CanvasEditorState>(() =>
    initCanvasState(workflowId, nodes, transitions),
  );
  const [connectionDrag, setConnectionDrag] = useState<ConnectionDragState | null>(null);
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(
    null,
  );

  useEffect(() => {
    return () => {
      autoScroll.stop();
    };
  }, [autoScroll]);

  // Adjust local state during render when a fresh workflow's data arrives
  // (e.g. a new seed run) — resets local edits without a useEffect flash.
  if (canvasState.workflowId !== workflowId) {
    setCanvasState(initCanvasState(workflowId, nodes, transitions));
    setConnectionDrag(null);
    setPendingConnection(null);
  }

  const nodeById = useMemo(
    () => new Map(canvasState.nodes.map((node) => [node.id, node])),
    [canvasState.nodes],
  );
  const topology = useMemo(
    () => computeNodeTopology(canvasState.nodes, canvasState.transitions),
    [canvasState.nodes, canvasState.transitions],
  );

  const resolvedPositions = useMemo(() => {
    const map = new Map<string, Point>();
    topology.forEach((entry, nodeId) => {
      const override = canvasState.positionOverrides[nodeId];
      map.set(nodeId, override ?? { x: entry.x, y: entry.y });
    });
    return map;
  }, [topology, canvasState.positionOverrides]);

  const layout = useMemo(
    () =>
      computeWorkflowCanvasLayout(
        canvasState.nodes,
        canvasState.transitions,
        topology,
        resolvedPositions,
      ),
    [canvasState.nodes, canvasState.transitions, topology, resolvedPositions],
  );

  const payload = useMemo(
    () =>
      buildSaveWorkflowCanvasPayload(
        canvasState.nodes,
        canvasState.transitions,
        resolvedPositions,
      ),
    [canvasState.nodes, canvasState.transitions, resolvedPositions],
  );

  const handlePositionChange = useCallback((nodeId: string, point: Point) => {
    setCanvasState((current) => ({
      ...current,
      positionOverrides: { ...current.positionOverrides, [nodeId]: point },
    }));
  }, []);

  const reactId = useId().replace(/:/g, "");
  const arrowheadId = `workflow-canvas-arrowhead-${reactId}`;

  if (layout.positionedNodes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No workflow nodes to display.</p>
    );
  }

  function handleConnectionDragStart(
    nodeId: string,
    pointerId: number,
    clientX: number,
    clientY: number,
  ) {
    const container = containerRef.current;
    if (!container) return;
    container.setPointerCapture(pointerId);
    const rect = container.getBoundingClientRect();
    setConnectionDrag({
      sourceNodeId: nodeId,
      pointerId,
      currentPoint: { x: clientX - rect.left, y: clientY - rect.top },
      hoveredNodeId: null,
    });
    autoScroll.start(scrollWrapperRef.current, clientX, clientY);
  }

  function handleContainerPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!connectionDrag || connectionDrag.pointerId !== event.pointerId) return;
    if ((event.buttons & 1) === 0) {
      // Same reused-pointerId hazard as the box drag: without an actively
      // held primary button, a later hover must not be read as a live
      // connection-drag update.
      setConnectionDrag(null);
      autoScroll.stop();
      return;
    }
    autoScroll.update(event.clientX, event.clientY);
    const container = containerRef.current;
    if (!container) return;
    // Re-read the rect fresh every move rather than reusing the one from
    // drag-start — auto-scroll (or a manual scroll mid-drag) shifts the
    // container relative to the viewport, so a cached rect would drift out
    // of sync with the pointer and throw off hit-testing.
    const rect = container.getBoundingClientRect();
    const point = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const hoveredNodeId = hitTestNode(
      layout.positionedNodes,
      point,
      connectionDrag.sourceNodeId,
    );
    setConnectionDrag({ ...connectionDrag, currentPoint: point, hoveredNodeId });
  }

  function handleContainerPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!connectionDrag || connectionDrag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    autoScroll.stop();
    const { sourceNodeId, hoveredNodeId } = connectionDrag;
    setConnectionDrag(null);
    if (!hoveredNodeId) return; // dropped on empty space or back on the source: cancel silently

    const isDuplicate = canvasState.transitions.some(
      (transition) =>
        !transition.isGlobal &&
        transition.fromNodeId === sourceNodeId &&
        transition.toNodeId === hoveredNodeId,
    );
    if (isDuplicate) {
      toast.error("A transition between these statuses already exists.");
      return;
    }
    setPendingConnection({ fromNodeId: sourceNodeId, toNodeId: hoveredNodeId });
  }

  function handleContainerPointerCancel(event: ReactPointerEvent<HTMLDivElement>) {
    if (!connectionDrag || connectionDrag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    autoScroll.stop();
    setConnectionDrag(null);
  }

  function handleContainerLostPointerCapture(event: ReactPointerEvent<HTMLDivElement>) {
    if (connectionDrag?.pointerId === event.pointerId) {
      setConnectionDrag(null);
      autoScroll.stop();
    }
  }

  function handleConfirmNewTransition(name: string) {
    if (!pendingConnection) return;
    setCanvasState((current) => ({
      ...current,
      transitions: [
        ...current.transitions,
        {
          localId: crypto.randomUUID(),
          id: null,
          name,
          fromNodeId: pendingConnection.fromNodeId,
          toNodeId: pendingConnection.toNodeId,
          isGlobal: false,
          rules: {},
        },
      ],
    }));
    setPendingConnection(null);
  }

  function handleResetPositions() {
    setCanvasState((current) => ({ ...current, positionOverrides: {} }));
  }

  function handleRemoveDraftTransition(localId: string) {
    setCanvasState((current) => ({
      ...current,
      transitions: current.transitions.filter((transition) => transition.localId !== localId),
    }));
  }

  function handleSaveSuccess(freshCanvas: WorkflowCanvasResponse) {
    setCanvasState({
      workflowId,
      nodes: freshCanvas.nodes,
      transitions: freshCanvas.transitions.map(toDraftTransition),
      positionOverrides: Object.fromEntries(
        freshCanvas.nodes.map((node) => [
          node.id,
          { x: node.ui_pos_x, y: node.ui_pos_y },
        ]),
      ),
    });
    setConnectionDrag(null);
    setPendingConnection(null);
    onCanvasUpdate?.(freshCanvas);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        Drag a status box to reposition it, or drag from a box&apos;s edge handle to
        draw a new transition — connected arrows follow automatically.
      </p>
      <div className="relative">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleResetPositions}
          disabled={Object.keys(canvasState.positionOverrides).length === 0}
          className="absolute top-2 right-2 z-10 border border-border bg-card"
          title="Reset node positions to their default layout"
        >
          <RotateCcw className="size-3.5" />
          Reset Positions
        </Button>
        <div ref={scrollWrapperRef} className="overflow-x-auto">
          <div
            ref={containerRef}
            className="relative isolate"
            style={{
              width: layout.totalWidth,
              minWidth: layout.totalWidth,
              height: layout.totalHeight,
            }}
            onPointerMove={handleContainerPointerMove}
            onPointerUp={handleContainerPointerUp}
            onPointerCancel={handleContainerPointerCancel}
            onLostPointerCapture={handleContainerLostPointerCapture}
          >
            {layout.positionedNodes.map((positioned) => (
              <StatusNodeBox
                key={positioned.node.id}
                positioned={positioned}
                onPositionChange={handlePositionChange}
                onConnectionDragStart={handleConnectionDragStart}
                isDropTarget={connectionDrag?.hoveredNodeId === positioned.node.id}
                isConnectionSource={connectionDrag?.sourceNodeId === positioned.node.id}
                autoScroll={autoScroll}
                scrollWrapperRef={scrollWrapperRef}
              />
            ))}
            <svg
              className="pointer-events-none absolute inset-0 -z-10"
              aria-hidden="true"
              width={layout.totalWidth}
              height={layout.totalHeight}
              viewBox={`0 0 ${layout.totalWidth} ${layout.totalHeight}`}
            >
              <defs>
                <marker
                  id={arrowheadId}
                  viewBox="0 0 10 10"
                  refX="9"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M0,0 L10,5 L0,10 Z" className="fill-muted-foreground" />
                </marker>
              </defs>
              {layout.edges.map((edge) => (
                <TransitionEdgePath
                  key={edge.transition.localId}
                  edge={edge}
                  arrowheadId={arrowheadId}
                  onRemove={handleRemoveDraftTransition}
                />
              ))}
              {connectionDrag && (
                <ConnectionPreviewLine
                  connectionDrag={connectionDrag}
                  resolvedPositions={resolvedPositions}
                  arrowheadId={arrowheadId}
                />
              )}
            </svg>
          </div>
        </div>
      </div>

      {layout.globalTransitions.length > 0 && (
        <GlobalTransitionsList
          transitions={layout.globalTransitions}
          nodeById={nodeById}
        />
      )}

      <SaveCanvasPanel
        projectId={projectId}
        workflowId={workflowId}
        payload={payload}
        onSaveSuccess={handleSaveSuccess}
      />

      <TransitionNameModal
        pendingConnection={pendingConnection}
        nodeById={nodeById}
        onConfirm={handleConfirmNewTransition}
        onCancel={() => setPendingConnection(null)}
      />
    </div>
  );
}
