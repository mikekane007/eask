---
name: accessibility
description: Accessibility and inclusive-design rules for Go and Tell - keyboard play, screen-reader text for the sheet and HUD, contrast, reduced motion, touch targets, and low-bandwidth use. Use when changing any UI, controls or colours.
---

# Accessibility

The game's 3D view is visual, but every decision and all feedback happens in HTML. Keep that HTML solid.

## Checklist

- [ ] All actions are real `<button>`s with an accessible name; icon-only buttons have `aria-label`.
- [ ] Keyboard: WASD/arrows move; Tab reaches the sheet buttons; Enter/Space activates; visible focus.
- [ ] When the sheet opens or the question changes, move focus to its heading (or first option) and
      announce it (`role="dialog"` / `aria-live="polite"` on the feedback block).
- [ ] The toast uses `role="status"` so messages are read out.
- [ ] Colour is never the only signal: verdicts have words ("Wise answer"), not just green/red.
- [ ] Contrast at least 4.5:1 for body text on the dark panels; check the muted grey (`--muted`).
- [ ] Touch targets at least 44x44 px (the round buttons are 44).
- [ ] `prefers-reduced-motion`: stop camera easing extras, bobbing bubbles and cloud drift.
- [ ] Text scales: nothing breaks at 200% zoom or a 360 px wide phone.

## Verifying

Tab through the whole flow with the keyboard only; run the angular-eslint template accessibility rules
(`npm run lint`); screenshot at 400 px width.

## Gotchas

- 2026-10-10: The sheet is rendered without a dialog role and focus is not moved yet - tracked in the
  CLAUDE.md backlog.
- 2026-10-10: The canvas captures pointer events for the joystick; do not put interactive elements
  underneath it.
