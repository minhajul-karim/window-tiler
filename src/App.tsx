import React, { useState, useRef, useCallback, type JSX } from "react";
import { getWindowConfig } from "./helpers";

// Types
interface WindowData {
  id: string;
  color: string;
  title: string;
}

interface SnapNode {
  id: string;
  type: "window" | "container";

  // For windows
  window?: WindowData;

  // For containers (snap groups)
  container?: {
    direction: "horizontal" | "vertical";
    children: SnapNode[];
    splitRatio: number; // 0.5 = 50/50 split
  };

  // Bounds (relative to parent)
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface FloatingWindow extends WindowData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SnapIndicator {
  x: number;
  y: number;
  width: number;
  height: number;
  side: "top" | "bottom" | "left" | "right";
  targetNodeId?: string;
}

// Constants
const MIN_WIDTH = 200;
const MIN_HEIGHT = 150;
const SNAP_THRESHOLD = 30;
const DRAG_OUT_THRESHOLD = 50;
const HEADER_HEIGHT = 40;

// Utilities
const getId = () => Math.random().toString(36).substring(2, 9);
const getRandomColor = () =>
  `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;

const getRandomPosition = (
  containerWidth: number,
  containerHeight: number
) => ({
  x: Math.random() * (containerWidth - MIN_WIDTH),
  y: Math.random() * (containerHeight - MIN_HEIGHT),
});

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [floatingWindows, setFloatingWindows] = useState<FloatingWindow[]>([]);
  const [snappedLayout, setSnappedLayout] = useState<SnapNode | null>(null);
  const [draggedWindow, setDraggedWindow] = useState<{
    id: string;
    type: "floating" | "snapped";
    offset: { x: number; y: number };
  } | null>(null);
  const [snapIndicator, setSnapIndicator] = useState<SnapIndicator | null>(
    null
  );

  // Helper functions
  const createWindow = useCallback(
    (): WindowData => ({
      id: getId(),
      color: getRandomColor(),
      title: `Window ${Date.now()}`,
    }),
    []
  );

  const addFloatingWindow = () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const { x, y } = getRandomPosition(rect.width, rect.height);
    const windowData = createWindow();

    const newWindow: FloatingWindow = {
      ...windowData,
      x,
      y,
      width: MIN_WIDTH,
      height: MIN_HEIGHT,
    };

    setFloatingWindows((prev) => [...prev, newWindow]);
  };

  const deleteFloatingWindow = (id: string) => {
    setFloatingWindows((prev) => prev.filter((w) => w.id !== id));
  };

  // Tree manipulation functions
  const findNodeById = (node: SnapNode | null, id: string): SnapNode | null => {
    if (!node) return null;
    if (node.id === id) return node;

    if (node.type === "container" && node.container) {
      for (const child of node.container.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }

    return null;
  };

  const removeNodeById = (
    node: SnapNode | null,
    id: string
  ): SnapNode | null => {
    if (!node) return null;

    if (node.type === "container" && node.container) {
      const children = node.container.children.filter(
        (child) => child.id !== id
      );

      // Remove nested nodes recursively
      const updatedChildren = children
        .map((child) => removeNodeById(child, id))
        .filter(Boolean) as SnapNode[];

      if (updatedChildren.length === 0) {
        return null;
      } else if (updatedChildren.length === 1) {
        // If only one child remains, promote it
        const remaining = updatedChildren[0];
        return {
          ...remaining,
          bounds: {
            x: node.bounds.x, // Keep container's position
            y: node.bounds.y,
            width: node.bounds.width, // Expand to container's full size
            height: node.bounds.height,
          },
        };
      } else {
        return {
          ...node,
          container: {
            ...node.container,
            children: updatedChildren,
          },
        };
      }
    }

    return node.id === id ? null : node;
  };

  const deleteSnappedWindow = (id: string) => {
    setSnappedLayout((prev) => removeNodeById(prev, id));
  };

  // Snap detection
  const getSnapTarget = (
    mouseX: number,
    mouseY: number,
    containerRect: DOMRect
  ): SnapIndicator | null => {
    const threshold = SNAP_THRESHOLD;

    // Check screen edges first
    if (mouseX <= threshold) {
      return {
        x: 0,
        y: 0,
        width: containerRect.width / 2,
        height: containerRect.height,
        side: "left",
      };
    }

    if (mouseX >= containerRect.width - threshold) {
      return {
        x: containerRect.width / 2,
        y: 0,
        width: containerRect.width / 2,
        height: containerRect.height,
        side: "right",
      };
    }

    if (mouseY <= threshold) {
      return {
        x: 0,
        y: 0,
        width: containerRect.width,
        height: containerRect.height / 2,
        side: "top",
      };
    }

    if (mouseY >= containerRect.height - threshold) {
      return {
        x: 0,
        y: containerRect.height / 2,
        width: containerRect.width,
        height: containerRect.height / 2,
        side: "bottom",
      };
    }

    // Check snapped window regions
    if (snappedLayout) {
      const snapTarget = findSnapTargetInNode(snappedLayout, mouseX, mouseY);
      if (snapTarget) return snapTarget;
    }

    return null;
  };

  const findSnapTargetInNode = (
    node: SnapNode,
    mouseX: number,
    mouseY: number
  ): SnapIndicator | null => {
    // Check if mouse is within this node's bounds (using absolute coordinates)
    if (
      mouseX >= node.bounds.x &&
      mouseX <= node.bounds.x + node.bounds.width &&
      mouseY >= node.bounds.y &&
      mouseY <= node.bounds.y + node.bounds.height
    ) {
      if (node.type === "window") {
        // For windows, check which edge is closest
        const threshold = SNAP_THRESHOLD;
        const relativeX = mouseX - node.bounds.x;
        const relativeY = mouseY - node.bounds.y;

        // Determine the longer axis for snapping
        const isWiderThanTall = node.bounds.width > node.bounds.height;

        if (isWiderThanTall) {
          // Snap on top or bottom
          if (relativeY <= threshold) {
            return {
              x: node.bounds.x,
              y: node.bounds.y,
              width: node.bounds.width,
              height: node.bounds.height / 2,
              side: "top",
              targetNodeId: node.id,
            };
          } else if (relativeY >= node.bounds.height - threshold) {
            return {
              x: node.bounds.x,
              y: node.bounds.y + node.bounds.height / 2,
              width: node.bounds.width,
              height: node.bounds.height / 2,
              side: "bottom",
              targetNodeId: node.id,
            };
          }
        } else {
          // Snap on left or right
          if (relativeX <= threshold) {
            return {
              x: node.bounds.x,
              y: node.bounds.y,
              width: node.bounds.width / 2,
              height: node.bounds.height,
              side: "left",
              targetNodeId: node.id,
            };
          } else if (relativeX >= node.bounds.width - threshold) {
            return {
              x: node.bounds.x + node.bounds.width / 2,
              y: node.bounds.y,
              width: node.bounds.width / 2,
              height: node.bounds.height,
              side: "right",
              targetNodeId: node.id,
            };
          }
        }
      } else if (node.type === "container" && node.container) {
        // Recursively check children
        for (const child of node.container.children) {
          const result = findSnapTargetInNode(child, mouseX, mouseY);
          if (result) return result;
        }
      }
    }

    return null;
  };

  // Snap execution
  const executeSnap = (windowData: WindowData, indicator: SnapIndicator) => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    if (indicator.targetNodeId) {
      // Snapping to an existing window
      setSnappedLayout((prev) =>
        snapToExistingWindow(
          prev,
          indicator.targetNodeId!,
          windowData,
          indicator.side
        )
      );
    } else {
      // Snapping to screen edge
      const newWindowNode: SnapNode = {
        id: windowData.id,
        type: "window",
        window: windowData,
        bounds: {
          x: indicator.x,
          y: indicator.y,
          width: indicator.width,
          height: indicator.height,
        },
      };

      if (snappedLayout) {
        // Create a new container that splits the screen
        const direction =
          indicator.side === "left" || indicator.side === "right"
            ? "horizontal"
            : "vertical";
        const isFirstChild =
          indicator.side === "left" || indicator.side === "top";

        const containerNode: SnapNode = {
          id: getId(),
          type: "container",
          container: {
            direction,
            children: isFirstChild
              ? [newWindowNode, snappedLayout]
              : [snappedLayout, newWindowNode],
            splitRatio: 0.5,
          },
          bounds: {
            x: 0,
            y: 0,
            width: containerRect.width,
            height: containerRect.height,
          },
        };

        // Update child bounds to absolute coordinates
        if (direction === "horizontal" && containerNode.container) {
          // Horizontal left
          containerNode.container.children[0].bounds = getWindowConfig(
            "left",
            containerRect
          );

          // Horizontal right
          containerNode.container.children[1].bounds = getWindowConfig(
            "right",
            containerRect
          );
        } else if (direction === "vertical" && containerNode.container) {
          // Vertical top
          containerNode.container.children[0].bounds = getWindowConfig(
            "top",
            containerRect
          );

          // Vertical bottom
          containerNode.container.children[1].bounds = getWindowConfig(
            "bottom",
            containerRect
          );
        }

        setSnappedLayout(containerNode);
      } else {
        // First snapped window
        newWindowNode.bounds = getWindowConfig(indicator.side, containerRect);
        setSnappedLayout(newWindowNode);
      }
    }
  };

  const snapToExistingWindow = (
    layout: SnapNode | null,
    targetId: string,
    newWindow: WindowData,
    side: "top" | "bottom" | "left" | "right"
  ): SnapNode | null => {
    if (!layout) return null;

    if (layout.id === targetId && layout.type === "window") {
      // Replace the target window with a container
      const direction =
        side === "left" || side === "right" ? "horizontal" : "vertical";
      const isNewWindowFirst = side === "left" || side === "top";

      const newWindowNode: SnapNode = {
        id: newWindow.id,
        type: "window",
        window: newWindow,
        bounds: { x: 0, y: 0, width: 0, height: 0 }, // Will be updated below
      };

      const existingWindowNode: SnapNode = {
        ...layout,
        bounds: { x: 0, y: 0, width: 0, height: 0 }, // Will be updated below
      };

      const containerNode: SnapNode = {
        id: getId(),
        type: "container",
        container: {
          direction,
          children: isNewWindowFirst
            ? [newWindowNode, existingWindowNode]
            : [existingWindowNode, newWindowNode],
          splitRatio: 0.5,
        },
        bounds: layout.bounds, // Keep the original window's bounds
      };

      // Update child bounds to absolute coordinates
      if (!containerNode.container) {
        return null;
      }
      if (direction === "horizontal") {
        containerNode.container.children[0].bounds = {
          x: layout.bounds.x,
          y: layout.bounds.y,
          width: layout.bounds.width / 2,
          height: layout.bounds.height,
        };

        containerNode.container.children[1].bounds = {
          x: layout.bounds.x + layout.bounds.width / 2,
          y: layout.bounds.y,
          width: layout.bounds.width / 2,
          height: layout.bounds.height,
        };
      } else {
        containerNode.container.children[0].bounds = {
          x: layout.bounds.x,
          y: layout.bounds.y,
          width: layout.bounds.width,
          height: layout.bounds.height / 2,
        };

        containerNode.container.children[1].bounds = {
          x: layout.bounds.x,
          y: layout.bounds.y + layout.bounds.height / 2,
          width: layout.bounds.width,
          height: layout.bounds.height / 2,
        };
      }

      return containerNode;
    } else if (layout.type === "container" && layout.container) {
      // Recursively search in children
      return {
        ...layout,
        container: {
          ...layout.container,
          children: layout.container.children.map(
            (child) =>
              snapToExistingWindow(child, targetId, newWindow, side) || child
          ),
        },
      };
    }

    return layout;
  };

  // Mouse event handlers
  const handleMouseDown = (
    e: React.MouseEvent,
    windowId: string,
    type: "floating" | "snapped"
  ) => {
    let offsetX = 0,
      offsetY = 0;

    if (type === "floating") {
      const window = floatingWindows.find((w) => w.id === windowId);
      if (window) {
        offsetX = e.clientX - window.x;
        offsetY = e.clientY - window.y;
      }
    } else {
      // For snapped windows, we'll handle dragging out later
      offsetX = e.clientX;
      offsetY = e.clientY;
    }

    setDraggedWindow({
      id: windowId,
      type,
      offset: { x: offsetX, y: offsetY },
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedWindow || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    if (draggedWindow.type === "floating") {
      // Update floating window position
      const newX = e.clientX - draggedWindow.offset.x;
      const newY = e.clientY - draggedWindow.offset.y;

      setFloatingWindows((prev) =>
        prev.map((window) =>
          window.id === draggedWindow.id
            ? { ...window, x: newX, y: newY }
            : window
        )
      );

      // Check for snap targets
      const snapTarget = getSnapTarget(e.clientX, e.clientY, containerRect);
      setSnapIndicator(snapTarget);
    } else {
      // Handle dragging snapped window out
      const dragDistance =
        Math.abs(e.clientX - draggedWindow.offset.x) +
        Math.abs(e.clientY - draggedWindow.offset.y);

      if (dragDistance > DRAG_OUT_THRESHOLD) {
        // Convert snapped window to floating
        const snappedNode = findNodeById(snappedLayout, draggedWindow.id);
        if (snappedNode && snappedNode.window) {
          const newFloatingWindow: FloatingWindow = {
            ...snappedNode.window,
            x: e.clientX - MIN_WIDTH / 2,
            y: e.clientY - HEADER_HEIGHT / 2,
            width: MIN_WIDTH,
            height: MIN_HEIGHT,
          };

          setFloatingWindows((prev) => [...prev, newFloatingWindow]);
          setSnappedLayout((prev) => removeNodeById(prev, draggedWindow.id));
          setDraggedWindow({
            id: draggedWindow.id,
            type: "floating",
            offset: { x: MIN_WIDTH / 2, y: HEADER_HEIGHT / 2 },
          });
        }
      }
    }
  };

  const handleMouseUp = () => {
    if (snapIndicator && draggedWindow && draggedWindow.type === "floating") {
      // Execute the snap
      const floatingWindow = floatingWindows.find(
        (w) => w.id === draggedWindow.id
      );
      if (floatingWindow) {
        const windowData: WindowData = {
          id: floatingWindow.id,
          color: floatingWindow.color,
          title: floatingWindow.title,
        };

        executeSnap(windowData, snapIndicator);
        deleteFloatingWindow(draggedWindow.id);
      }
    }

    setDraggedWindow(null);
    setSnapIndicator(null);
  };

  const renderSnappedNode = (node: SnapNode): JSX.Element => {
    if (node.type === "window" && node.window) {
      return (
        <div
          key={node.id}
          className="absolute border border-gray-300"
          style={{
            left: node.bounds.x, // Direct use - no conversion needed!
            top: node.bounds.y, // Direct use - no conversion needed!
            width: node.bounds.width, // Direct use - no conversion needed!
            height: node.bounds.height, // Direct use - no conversion needed!
            backgroundColor: node.window.color,
          }}
        >
          <div className="h-[40px] flex justify-between bg-gray-800 text-white">
            <div
              onMouseDown={(e) => handleMouseDown(e, node.id, "snapped")}
              className="flex-1 flex items-center px-2 cursor-grab select-none"
            >
              {node.window.title}
            </div>
            <button
              onClick={() => deleteSnappedWindow(node.id)}
              className="bg-red-600 hover:bg-red-700 w-[40px] flex items-center justify-center"
            >
              ×
            </button>
          </div>
          <div className="p-2 h-full overflow-hidden">
            <div className="text-sm opacity-70">Snapped Window</div>
          </div>
        </div>
      );
    } else if (node.type === "container" && node.container) {
      return (
        <div key={node.id}>
          {node.container.children.map((child) => renderSnappedNode(child))}
        </div>
      );
    }

    return <div key={node.id}></div>;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="w-screen h-screen relative overflow-hidden bg-gray-100"
    >
      {/* Snapped windows */}
      {snappedLayout &&
        containerRef.current &&
        renderSnappedNode(snappedLayout)}

      {/* Floating windows */}
      {floatingWindows.map((window) => (
        <div
          key={window.id}
          className="absolute border border-gray-400 shadow-lg"
          style={{
            left: window.x,
            top: window.y,
            width: window.width,
            height: window.height,
            backgroundColor: window.color,
          }}
        >
          <div className="h-[40px] flex justify-between bg-gray-800 text-white">
            <div
              onMouseDown={(e) => handleMouseDown(e, window.id, "floating")}
              className={`flex-1 flex items-center px-2 select-none ${
                draggedWindow?.id === window.id
                  ? "cursor-grabbing"
                  : "cursor-grab"
              }`}
            >
              {window.title}
            </div>
            <button
              onClick={() => deleteFloatingWindow(window.id)}
              className="bg-red-600 hover:bg-red-700 w-[40px] flex items-center justify-center"
            >
              ×
            </button>
          </div>
          <div className="p-2">
            <div className="text-sm opacity-70">Floating Window</div>
          </div>
        </div>
      ))}

      {/* Add button */}
      <button
        onClick={addFloatingWindow}
        className="cursor-pointer fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-2xl shadow-lg transition-colors"
      >
        +
      </button>

      {/* Snap indicator */}
      {snapIndicator && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-50 pointer-events-none"
          style={{
            left: snapIndicator.x,
            top: snapIndicator.y,
            width: snapIndicator.width,
            height: snapIndicator.height,
          }}
        />
      )}
    </div>
  );
}
