import { describe, expect, it } from 'vitest';
import { isTyping } from './input';

describe('isTyping', () => {
  it('treats text fields as typing, so their letters do not move the player', () => {
    expect(isTyping(document.createElement('input'))).toBe(true);
    expect(isTyping(document.createElement('textarea'))).toBe(true);
  });

  it('lets keys pressed anywhere else reach the game', () => {
    expect(isTyping(document.createElement('button'))).toBe(false);
    expect(isTyping(document.body)).toBe(false);
    expect(isTyping(null)).toBe(false);
  });
});
