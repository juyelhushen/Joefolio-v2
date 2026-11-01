type FlightBounds = Pick<DOMRectReadOnly, 'left' | 'top' | 'width' | 'height'>;

export const createFlightPath = (
  stage: FlightBounds,
  launch: FlightBounds,
  earth: FlightBounds,
): string | null => {
  if (!stage.width || !stage.height || !launch.width || !earth.width) return null;

  const startX = launch.left + launch.width / 2 - stage.left;
  const startY = launch.top + launch.height / 2 - stage.top;
  const endX = earth.left + earth.width / 2 - stage.left;
  const endY = earth.top + earth.height / 2 - stage.top;
  const dx = endX - startX;
  const dy = endY - startY;
  const arc = Math.min(110, Math.max(42, Math.abs(dx) * 0.17));
  const controlOneX = startX + dx * 0.34;
  const controlOneY = startY + dy * 0.28 - arc;
  const controlTwoX = startX + dx * 0.78;
  const controlTwoY = endY - dy * 0.14 - arc * 0.35;
  const point = (value: number) => Math.round(value * 10) / 10;

  return `M ${point(startX)} ${point(startY)} C ${point(controlOneX)} ${point(controlOneY)}, ${point(controlTwoX)} ${point(controlTwoY)}, ${point(endX)} ${point(endY)}`;
};
