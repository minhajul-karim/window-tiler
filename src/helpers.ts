export const MIN_WIDTH = 300;
export const MIN_HEIGHT = 200;

export function getRandomPosition(
  containerWidth: number,
  containerHeight: number
) {
  const maxX = containerWidth - MIN_WIDTH;
  const maxY = containerHeight - MIN_HEIGHT;

  // Prevent negative values in case the div is larger than the container
  const x = Math.max(0, Math.floor(Math.random() * (maxX + 1)));
  const y = Math.max(0, Math.floor(Math.random() * (maxY + 1)));

  return { x, y };
}

interface WindowConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getWindowConfig(
  position: string,
  containerRect: DOMRect
): WindowConfig {
  switch (position) {
    case "left":
      return {
        x: 0,
        y: 0,
        width: containerRect.width / 2,
        height: containerRect.height,
      };
    case "right":
      return {
        x: containerRect.width / 2,
        y: 0,
        width: containerRect.width / 2,
        height: containerRect.height,
      };
    case "top":
      return {
        x: 0,
        y: 0,
        width: containerRect.width,
        height: containerRect.height / 2,
      };
    case "bottom":
      return {
        x: 0,
        y: containerRect.height / 2,
        width: containerRect.width,
        height: containerRect.height / 2,
      };

    default:
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}
