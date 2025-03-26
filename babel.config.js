module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: '14',
      },
    }],
  ],
  plugins: [
    // Custom plugin to transform paths during compilation
    ['module-resolver', {
      resolvePath(sourcePath, currentFile) {
        // Only process imports from bin directory
        if (currentFile.includes('/bin/') || currentFile.includes('\\bin\\')) {
          // Transform '../src/xxx' to '../xxx' when compiling bin files
          if (sourcePath.startsWith('../src/')) {
            return sourcePath.replace('../src/', '../');
          }
        }
        return sourcePath;
      }
    }]
  ]
}; 