import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: { cssMinify: false },
  // Electronのfile://読み込みでも、生成されたCSS・JavaScriptを正しく参照する。
  base: './',
  plugins: [react()],
  test: { environment: 'node', include: ['tests/unit/**/*.test.ts'] },
});
