export interface Point { x: number; y: number }
export interface WorldView extends Point { scale: number }

export function worldView(width: number, height: number, focus: Point): WorldView {
  const scale = Math.max(width / 1200, height / 720, width < 600 && height < 650 ? 1 : 0);
  return {
    scale,
    x: Math.min(0, Math.max(width - 1200 * scale, width / 2 - focus.x * scale)),
    y: Math.min(0, Math.max(height - 720 * scale, height / 2 - focus.y * scale)),
  };
}

export function screenToWorld(point: Point, view: WorldView): Point {
  return { x: (point.x - view.x) / view.scale, y: (point.y - view.y) / view.scale };
}
