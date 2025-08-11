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
