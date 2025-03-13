# Using .lambdarunignore

Lambda Running now supports a `.lambdarunignore` file to exclude directories and files from the scan process.

## Overview

The `.lambdarunignore` file works similarly to `.gitignore` files. You can use it to exclude:

- Large directories that slow down scanning
- Directories with code that shouldn't be executed as Lambda handlers
- Generated files or build artifacts

## Default Behavior

By default, Lambda Running **always excludes** the `node_modules` directory to prevent scanning potentially thousands of files.

## File Format

Create a `.lambdarunignore` file in the root of your project with each line representing a pattern to ignore:

```
# Comments start with a # character
node_modules    # This is already excluded by default
dist
coverage
.git

# You can use * as a wildcard character
*.test.js
*.spec.js
```

## Pattern Matching

The ignore patterns work in the following ways:

1. Exact directory name match: `node_modules` will ignore all directories named "node_modules"
2. File name match: `index.js` will ignore all files named "index.js"
3. Pattern with wildcard: `*.test.js` will ignore all files ending with ".test.js"

## Command Line Options

When using the CLI, you can override the ignore settings:

```bash
# Include node_modules in scan (not recommended)
lambda-run scan --include-node-modules

# Ignore the .lambdarunignore file
lambda-run scan --no-ignore-file
```

## Programmatic API

When using the programmatic API, you can pass options to control ignoring:

```javascript
const { scanForHandlers } = require('lambda-running');

// Override default options
const handlers = scanForHandlers('./src', ['.js', '.ts'], {
  ignoreNodeModules: false,
  useIgnoreFile: false,
});
```

## Best Practices

- Keep your `.lambdarunignore` file in your project root
- Exclude test files, build directories, and any large directories
- Remember that node_modules is already excluded by default
- Use comments to document why certain patterns are ignored
