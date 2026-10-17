import {
  type AfterViewInit,
  Component,
  type ElementRef,
  NgZone,
  type OnDestroy,
  ViewChild,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import type { Avatar } from '../game/avatar';
import type { AvatarScene } from '../game/avatar-scene';

const W = 180;
const H = 230;

/**
 * The player's character in 3D, built from the same body as in the city and turning slowly. Drag to turn it by
 * hand. The small scene only draws while the character screen is open; if 3D is not available, nothing is drawn
 * and the choices still work.
 */
@Component({
  selector: 'app-avatar-preview',
  standalone: true,
  template: `<canvas
    #cv
    class="look3d"
    [attr.width]="w"
    [attr.height]="h"
    [hidden]="failed()"
    role="img"
    [attr.aria-label]="label()"
    (pointerdown)="grab($event)"
    (pointermove)="drag($event)"
    (pointerup)="release($event)"
    (pointercancel)="release($event)"
  ></canvas>`,
})
export class AvatarPreviewComponent implements AfterViewInit, OnDestroy {
  readonly look = input.required<Avatar>();
  readonly label = input('');
  readonly failed = signal(false);
  readonly w = W;
  readonly h = H;
  @ViewChild('cv', { static: true }) private cv!: ElementRef<HTMLCanvasElement>;
  private readonly zone = inject(NgZone);

  private scene?: AvatarScene;
  private frame = 0;
  private gone = false;
  private dragX: number | null = null;
  private pulled = 0;
  private last = 0;

  constructor() {
    effect(() => {
      const look = this.look();
      this.scene?.dress(look);
    });
  }

  ngAfterViewInit(): void {
    void this.start();
  }

  /** Loads the 3D code, builds the scene and starts turning the character. */
  private async start(): Promise<void> {
    try {
      const { createAvatarScene } = await import('../game/avatar-scene');
      if (this.gone) return;
      this.scene = createAvatarScene(this.cv.nativeElement, W, H);
    } catch {
      this.failed.set(true);
      return;
    }
    this.scene.dress(this.look());
    this.zone.runOutsideAngular(() => {
      this.last = performance.now();
      this.loop();
    });
  }

  private readonly loop = (): void => {
    const now = performance.now();
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    const by = this.dragX === null ? dt * 0.6 : this.pulled;
    this.pulled = 0;
    this.scene?.draw(by);
    this.frame = requestAnimationFrame(this.loop);
  };

  grab(e: PointerEvent): void {
    this.dragX = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  drag(e: PointerEvent): void {
    if (this.dragX === null) return;
    this.pulled += (e.clientX - this.dragX) * 0.02;
    this.dragX = e.clientX;
  }

  release(e: PointerEvent): void {
    this.dragX = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  ngOnDestroy(): void {
    this.gone = true;
    cancelAnimationFrame(this.frame);
    this.scene?.dispose();
  }
}
