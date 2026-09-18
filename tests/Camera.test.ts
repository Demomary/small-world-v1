import { describe, expect, it } from 'vitest';
import { worldView, screenToWorld } from '../src/render/Camera';

describe('world camera', () => {
  it('fills a desktop viewport without stretching the world', () => {
    const view = worldView(1440, 900, { x: 600, y: 360 });
    expect(view.scale).toBe(1.25);
    expect(view.x).toBe(-30);
    expect(view.y).toBe(0);
  });

  it('keeps a mobile player visible and maps taps back to world coordinates', () => {
    const focus = { x: 950, y: 430 };
    const view = worldView(390, 844, focus);
    const screen = { x: focus.x * view.scale + view.x, y: focus.y * view.scale + view.y };
    expect(screen.x).toBeGreaterThan(40);
    expect(screen.x).toBeLessThan(350);
    expect(screenToWorld(screen, view).x).toBeCloseTo(focus.x);
    expect(screenToWorld(screen, view).y).toBeCloseTo(focus.y);
  });

  it('never exposes empty space at the world edges', () => {
    for (const focus of [{ x: 0, y: 0 }, { x: 1200, y: 720 }]) {
      const view = worldView(390, 844, focus);
      expect(view.x).toBeLessThanOrEqual(0);
      expect(view.y).toBeLessThanOrEqual(0);
      expect(view.x + 1200 * view.scale).toBeGreaterThanOrEqual(390);
      expect(view.y + 720 * view.scale).toBeGreaterThanOrEqual(844);
    }
  });

  it('keeps the player above the controls on a short phone screen', () => {
    const view = worldView(320, 568, { x: 350, y: 540 });
    expect(540 * view.scale + view.y).toBeLessThan(400);
  });
});
