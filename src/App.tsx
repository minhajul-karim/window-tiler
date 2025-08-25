import { useState, useRef, useEffect } from "react";
import { getRandomPosition, MIN_HEIGHT, MIN_WIDTH } from "./helpers";

interface FloatingWindow {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

interface SnappedDiv {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  background: string;
}
interface SnappedWindow {
  x: number;
  y: number;
  width: number;
  height: number;
  background: string;
  left: SnappedWindow | null;
  right: SnappedWindow | null;
}

interface SnappedWindows {
  root: SnappedWindow | null;
}

interface SnapIndicator {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const SNAP_WIDTH = 30;
const SNAP_HEIGHT = 30;
const SNAP_INDICATOR = 100;

const getId = () => Math.random().toString(36).substring(2, 9);

const getRandomColor = () =>
  `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [floatingWindows, setFloatingWindows] = useState<FloatingWindow[]>([]);
  const [snappedWindows, setSnappedWindows] = useState<SnappedWindows>({
    root: null,
  });
  const [snappedWindowsArr, setSnappedWindowsArr] = useState<SnappedDiv[]>([]);
  const [draggedWindowId, setDraggedWindowId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null
  );
  const [snapIndicator, setSnapIndicator] = useState<SnapIndicator | null>(
    null
  );

  const createWindow = () => {
    if (containerRef.current === null) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const { x, y } = getRandomPosition(rect.width, rect.height);
    const newWindow: FloatingWindow = {
      id: getId(),
      x,
      y,
      width: MIN_WIDTH,
      height: MIN_HEIGHT,
      color: getRandomColor(),
    };
    setFloatingWindows((curWindows) => [...curWindows, newWindow]);
  };

  const deleteWindow = (id: string) => {
    setFloatingWindows((curWindows) =>
      curWindows.filter((window) => window.id !== id)
    );
  };

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    id: string
  ) => {
    setDraggedWindowId(id);

    const draggedWindow = floatingWindows.find((window) => window.id === id);
    if (draggedWindow) {
      setDragOffset({
        x: e.clientX - draggedWindow.x,
        y: e.clientY - draggedWindow.y,
      });
    }

    if (dragOffset) {
      setFloatingWindows((curWindows) =>
        curWindows.map((window) => {
          if (window.id !== id) {
            return window;
          }

          return {
            ...window,
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y,
          };
        })
      );
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (draggedWindowId && dragOffset) {
      setFloatingWindows((curWindows) =>
        curWindows.map((window) => {
          if (window.id !== draggedWindowId) {
            return window;
          }

          return {
            ...window,
            x: e.clientX - dragOffset.x,
            y: e.clientY - dragOffset.y,
          };
        })
      );
    }

    // check if a dragged window is close to screen edges
    checkSnapping();
  };

  const handleMouseUp = () => {
    setDraggedWindowId(null);
    setDragOffset(null);
  };

  const checkSnapping = () => {
    if (containerRef.current === null) {
      return;
    }

    const { left, right, top, bottom } =
      containerRef.current.getBoundingClientRect();
    const draggedWindow = floatingWindows.find(
      (window) => window.id === draggedWindowId
    );

    if (!draggedWindow) {
      setSnapIndicator(null);
      return;
    }

    if (draggedWindow.x <= left + SNAP_WIDTH) {
      // Snapping indicator on the left
      setSnapIndicator({
        top: 0,
        bottom: 0,
        left: 0,
        right: right - SNAP_INDICATOR,
      });
    } else if (draggedWindow.x + draggedWindow.width >= right - SNAP_WIDTH) {
      // Snapping indicator on the right
      setSnapIndicator({
        top: 0,
        bottom: 0,
        left: right - SNAP_INDICATOR,
        right: 0,
      });
    } else if (draggedWindow.y <= top + SNAP_HEIGHT) {
      // Snapping indicator on the top
      setSnapIndicator({
        top: 0,
        bottom: bottom - SNAP_INDICATOR,
        left: 0,
        right: 0,
      });
    } else if (draggedWindow.y + draggedWindow.height >= bottom - SNAP_HEIGHT) {
      // Snapping indicator on the bottom
      setSnapIndicator({
        top: bottom - SNAP_INDICATOR,
        bottom: 0,
        left: 0,
        right: 0,
      });
    } else {
      setSnapIndicator(null);
    }
  };

  // const spannedWindowsContent = [];
  useEffect(() => {
    const renderSnappedWindows = (node: SnappedWindow | null) => {
      if (node === null) {
        return;
      }

      renderSnappedWindows(node.left);
      setSnappedWindowsArr((curArr) => {
        return [
          ...curArr,
          {
            id: getId(),
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            background: node.background,
          },
        ];
      });
      renderSnappedWindows(node.right);
    };

    if (snappedWindows.root && snappedWindowsArr.length === 0) {
      renderSnappedWindows(snappedWindows.root);
    }
  }, [snappedWindows.root, snappedWindowsArr]);

  useEffect(() => {
    if (containerRef.current) {
      const SNAPPED_WINDOWS = {
        root: {
          x: 0,
          y: 0,
          width: containerRef.current.getBoundingClientRect().width,
          height: containerRef.current.getBoundingClientRect().height,
          background: "none",
          left: {
            x: 0,
            y: 0,
            width: containerRef.current.getBoundingClientRect().width / 2,
            height: containerRef.current.getBoundingClientRect().height,
            background: getRandomColor(),
            left: null,
            right: null,
          },
          right: {
            x: containerRef.current.getBoundingClientRect().width / 2,
            y: 0,
            width: containerRef.current.getBoundingClientRect().width / 2,
            height: containerRef.current.getBoundingClientRect().height,
            background: getRandomColor(),
            left: null,
            right: null,
          },
        },
      };

      setSnappedWindows(SNAPPED_WINDOWS as any);
    }
  }, [containerRef.current]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="w-screen h-screen relative overflow-hidden"
    >
      {snappedWindowsArr.map((w, i) => (
        <div
          key={w.id}
          className="absolute"
          style={{
            left: w.x,
            top: w.y,
            width: w.width,
            height: w.height,
            backgroundColor: w.background,
          }}
        >
          {`Node ${i}`}
        </div>
      ))}
      {floatingWindows.map((window, i) => (
        <div
          key={window.id}
          className="absolute"
          style={{
            left: window.x,
            top: window.y,
            width: window.width,
            height: window.height,
            backgroundColor: window.color,
          }}
        >
          <div className="h-[50px] flex justify-between">
            <div
              onMouseDown={(e) => handleMouseDown(e, window.id)}
              className={`bg-black h-full w-full ${
                window.id === draggedWindowId
                  ? "cursor-grabbing"
                  : "cursor-grab"
              }`}
            />
            <button
              onClick={() => deleteWindow(window.id)}
              className="bg-red-800 text-white h-full w-[50px] cursor-pointer"
            >
              X
            </button>
          </div>
          Node {i + 1}
        </div>
      ))}
      <button
        onClick={createWindow}
        className="fixed bottom-10 right-10 w-15 h-15 rounded-full bg-black text-white text-2xl cursor-pointer"
      >
        +
      </button>
      {/* Snap indicator */}
      <div
        className="absolute"
        style={{
          backgroundColor: "rgba(255, 0, 0, 0.5)",
          top: snapIndicator?.top,
          bottom: snapIndicator?.bottom,
          left: snapIndicator?.left,
          right: snapIndicator?.right,
        }}
      />
    </div>
  );
}

export default App;
