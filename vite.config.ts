/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path, { resolve } from 'path';
import { getCacheInvalidationKey, getPlugins } from './utils/vite';
import babel from 'vite-plugin-babel';

const rootDir = resolve(__dirname);
const srcDir = resolve(rootDir, 'src');
const pagesDir = resolve(srcDir, 'pages');

const isDev = process.env.__DEV__ === 'true';
const isProduction = !isDev;

export default defineConfig({
  resolve: {
    alias: {
      '@root': rootDir,
      '@src': srcDir,
      '@assets': resolve(srcDir, 'assets'),
      '@pages': pagesDir,
    },
  },
  plugins: [...getPlugins(isDev), react(), babel()],
  publicDir: resolve(rootDir, 'public'),
  build: {
    outDir: resolve(rootDir, 'dist'),
    /** Can slow down build speed. */
    // sourcemap: isDev,
    minify: isProduction,
    modulePreload: false,
    reportCompressedSize: isProduction,
    emptyOutDir: !isDev,
    rollupOptions: {
      input: {
        contentWindowEventListener: resolve(pagesDir, 'content', 'windowEventListener', 'index.ts'),
        injectedScript: resolve(pagesDir, 'content', 'injectedScript', 'index.ts'),
        contentUI: resolve(pagesDir, 'content', 'ui', 'index.ts'),
        injector: resolve(pagesDir, 'content', 'injector', 'injector.ts'),
        background: resolve(pagesDir, 'background', 'index.ts'),
        contentStyle: resolve(pagesDir, 'content', 'style.scss'),
        contentBannerScript: resolve(pagesDir, 'content', 'banner', 'index.ts'),
        contentWarningScript: resolve(pagesDir, 'content', 'warningPopUp', 'index.ts'),
        popup: resolve(pagesDir, 'popup', 'index.html'),
      },
      output: {
        entryFileNames: 'src/pages/[name]/index.js',
        chunkFileNames: isDev ? 'assets/js/[name].js' : 'assets/js/[name].[hash].js',
        assetFileNames: assetInfo => {
          const { name, ext } = path.parse(assetInfo.name);
          const assetFileName = name === 'contentStyle' ? `${name}${getCacheInvalidationKey()}` : name;

          if (ext === '.woff' || ext === '.woff2' || ext === '.ttf' || ext === '.eot' || ext === '.otf') {
            return `assets/fonts/[name][extname]`;
          }

          return `assets/[ext]/${assetFileName}.chunk.[ext]`;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    setupFiles: './test-utils/vitest.setup.js',
  },
});
