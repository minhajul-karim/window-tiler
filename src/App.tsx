import { useState, useRef } from "react";
import { getRandomPosition, MIN_HEIGHT, MIN_WIDTH } from "./helpers";

interface Window {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

const getId = () => Math.random().toString(36).substring(2, 9);

const getRandomColor = () =>
  `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [windows, setWindows] = useState<Window[]>([]);
  const [draggedWindowId, setDraggedWindowId] = useState<string | null>(null);

  const createWindow = () => {
    if (containerRef.current === null) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const { x, y } = getRandomPosition(rect.width, rect.height);
    const newWindow: Window = {
      id: getId(),
      x,
      y,
      width: MIN_WIDTH,
      height: MIN_HEIGHT,
      color: getRandomColor(),
    };
    setWindows((curWindows) => [...curWindows, newWindow]);
  };

  const deleteWindow = (id: string) => {
    setWindows((curWindows) => curWindows.filter((window) => window.id !== id));
  };

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    id: string
  ) => {
    setDraggedWindowId(id);
    setWindows((curWindows) =>
      curWindows.map((window) => {
        if (window.id !== id) {
          return window;
        }

        return {
          ...window,
          x: e.clientX,
          y: e.clientY,
        };
      })
    );
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (draggedWindowId) {
      setWindows((curWindows) =>
        curWindows.map((window) => {
          if (window.id !== draggedWindowId) {
            return window;
          }

          return {
            ...window,
            x: e.clientX,
            y: e.clientY,
          };
        })
      );
    }
  };

  const handleMouseUp = () => {
    setDraggedWindowId(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="w-screen h-screen relative"
    >
      {windows.map((window, i) => (
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
              className="bg-black h-full w-full"
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
    </div>
  );
}

export default App;
