# Lambda Running Development Scripts

This directory contains utility scripts for development and maintenance of the lambda-running package.

## Release Script

The `release.js` script automates the process of publishing new versions of the package to npm.

### Usage

Run the script using:

```bash
npm run release
```

The script will:

1. Check for uncommitted Git changes (optional to continue)
2. Display the current version from package.json
3. Prompt for the type of version increment:
   - Patch (0.1.0 -> 0.1.1) for bug fixes
   - Minor (0.1.0 -> 0.2.0) for new features (backward compatible)
   - Major (0.1.0 -> 1.0.0) for breaking changes
   - Custom (enter your own version)
4. Ask for confirmation of the new version
5. Update package.json with the new version
6. Prompt for release notes (enter an empty line to finish)
7. Save the release notes to the releases directory
8. Run the build script (`npm run build`)
9. Run the tests (`npm test`)
10. Publish to npm (`npm publish`)
11. Optionally create and push a Git tag

### Requirements

- Node.js 14.0.0 or higher
- npm account with publish access to the package
- Git (optional, for tagging)
