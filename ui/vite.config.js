import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(() => {
  // Ensure target directory exists
  const outDir = path.resolve(__dirname, '../lib/ui-dist');
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
      },
      // Custom plugin to correct asset paths in index.html after build
      {
        name: 'fix-html-asset-paths',
        closeBundle: () => {
          const indexPath = path.join(outDir, 'index.html');
          if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, 'utf8');
            // Replace all absolute paths with relative paths
            html = html.replace(/href="\//g, 'href="./');
            html = html.replace(/src="\//g, 'src="./');
            fs.writeFileSync(indexPath, html);
            console.log('Fixed asset paths in index.html');
          }
        }
      }
    ],
    // Set explicit entry point
    build: {
      outDir: '../lib/ui-dist',
      emptyOutDir: true,
      sourcemap: false,
      minify: true,
      // Use relative base path for assets
      base: './',
      cssCodeSplit: true,
      // Specify the entry point explicitly
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
        external: [
          'monaco-editor',
          /monaco-editor\/.*/, // Exclude all Monaco modules
          /vs\/.*/ // Exclude VS namespace modules
        ],
        output: {
          manualChunks(id) {
            // Create a chunk for code editor (monaco)
            if (id.includes('monaco')) {
              return 'monaco';
            }
            // Keep vue in the vendor chunk
            if (id.includes('node_modules')) {
              return 'vendor';
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
    },
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
    }
  };
}); 