import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/app/game/**'],
      exclude: ['src/app/game/engine.ts', 'src/app/game/*.data.ts'],
    },
  },
});
