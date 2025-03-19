import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(() => {
  // Ensure target directory exists
  const outDir = path.resolve(__dirname, '../src/ui-dist');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  return {
    plugins: [
      vue(),
      // Custom plugin to remove all Monaco files after build
      {
        name: 'remove-monaco-files',
        closeBundle: () => {
          const assetsDir = path.join(outDir, 'assets');
          if (fs.existsSync(assetsDir)) {
            const files = fs.readdirSync(assetsDir);
            files.forEach(file => {
              // Remove any Monaco-related files
              if (file.includes('monaco') || 
                  file.includes('basic-languages') ||
                  file.includes('editor.worker') ||
                  file.includes('json.worker') ||
                  file.includes('typescript') ||
                  file.includes('abap') ||
                  file.includes('apex') ||
                  file.includes('azcli') ||
                  file.includes('bat') ||
                  file.includes('bicep') ||
                  file.includes('cameligo') ||
                  file.includes('clojure')) {
                fs.unlinkSync(path.join(assetsDir, file));
                console.log(`Removed: ${file}`);
              }
            });
          }
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
        '/socket.io': {
          target: 'http://localhost:3000',
          ws: true
        }
      }
    },
    build: {
      outDir,
      emptyOutDir: true,
      // Use esbuild minifier which is faster than terser
      minify: 'esbuild',
      cssCodeSplit: true,
      // Completely exclude Monaco from the build
      rollupOptions: {
        external: [
          'monaco-editor',
          /monaco-editor\/.*/, // Exclude all Monaco modules
          /vs\/.*/ // Exclude VS namespace modules
        ],
        output: {
          manualChunks: (id) => {
            // Basic vendor bundle
            if (id.includes('node_modules/vue/') || 
                id.includes('node_modules/pinia/') || 
                id.includes('node_modules/vue-router/') || 
                id.includes('node_modules/@vueuse/')) {
              return 'vendor';
            }
            
            // Terminal support in separate chunk
            if (id.includes('node_modules/xterm')) {
              return 'xterm';
            }
          }
        }
      },
      target: 'esnext',
      esbuildOptions: {
        drop: ['console', 'debugger'],
        pure: [
          'console.log', 
          'console.info', 
          'console.debug', 
          'console.trace'
        ]
      },
      chunkSizeWarningLimit: 1000
    }
  };
}); 