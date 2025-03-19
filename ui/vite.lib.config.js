import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isAnalyze = mode === 'analyze';
  
  const plugins = [vue()];
  
  if (isAnalyze) {
    plugins.push(
      visualizer({
        open: true,
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true
      })
    );
  }
  
  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    build: {
      outDir: 'dist',
      lib: {
        entry: path.resolve(__dirname, 'src/lib.js'),
        name: 'LambdaRunningUI',
        fileName: (format) => `lambda-running-ui.${format}.js`
      },
      rollupOptions: {
        // Externalize peer dependencies
        external: ['vue', 'vue-router', 'pinia'],
        output: {
          // Global variables to use in UMD build for externalized deps
          globals: {
            vue: 'Vue',
            'vue-router': 'VueRouter',
            pinia: 'Pinia'
          },
          // Desactivar inlineDynamicImports para permitir manualChunks
          inlineDynamicImports: false,
          // Chunk configuration for large dependencies
          chunkFileNames: 'chunks/[name]-[hash].js',
          manualChunks: {
            'monaco': ['monaco-editor'],
            'terminal': ['xterm', 'xterm-addon-fit', 'xterm-addon-web-links']
          }
        }
      },
      // Reduce the size of the output
      minify: 'terser',
      sourcemap: true,
      // Force CSS to be extracted
      cssCodeSplit: true
    }
  };
}); 