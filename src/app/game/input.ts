import type { NgZone } from '@angular/core';
import type { GameService } from './game.service';

/** Keyboard state and the drag-to-move joystick for touch and mouse. */
export function createInput(canvas: HTMLCanvasElement, svc: GameService, zone: NgZone) {
  const keys: Record<string, boolean> = {};
  const onKeyDown = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = true;
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keys[e.key.toLowerCase()] = false;
  };
  addEventListener('keydown', onKeyDown);
  addEventListener('keyup', onKeyUp);
  let joy: { id: number; x: number; y: number; dx: number; dy: number } | null = null;
  const onPointerDown = (e: PointerEvent) => {
    if (svc.talking()) return;
    joy = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
    zone.run(() => {
      svc.joy.set({ x: e.clientX, y: e.clientY, dx: 0, dy: 0 });
    });
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    if (joy?.id !== e.pointerId) return;
    let dx = e.clientX - joy.x,
      dy = e.clientY - joy.y;
    const l = Math.hypot(dx, dy),
      m = 45;
    if (l > m) {
      dx *= m / l;
      dy *= m / l;
    }
    joy.dx = dx / m;
    joy.dy = dy / m;
    zone.run(() => {
      svc.joy.set({ x: joy!.x, y: joy!.y, dx: joy!.dx, dy: joy!.dy });
    });
  };
  const endJoy = (e: PointerEvent) => {
    if (joy?.id === e.pointerId) {
      joy = null;
      zone.run(() => {
        svc.joy.set(null);
      });
    }
  };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endJoy);
  canvas.addEventListener('pointercancel', endJoy);
  return {
    keys,
    joy: () => joy,
    dispose() {
      removeEventListener('keydown', onKeyDown);
      removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', endJoy);
      canvas.removeEventListener('pointercancel', endJoy);
    },
  };
}
