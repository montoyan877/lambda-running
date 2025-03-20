# Lambda Layers Support

Lambda Running supports AWS Lambda layers through a configuration system that maps layer paths to local directories. This allows your Lambda functions to use the same import paths they would use in AWS, but running locally.

## How Lambda Layers Work

In AWS Lambda, layers are added to your function and are made available in the `/opt` directory. For Node.js layers, the code is typically placed in `/opt/nodejs` and imported using absolute paths:

```javascript
// In AWS Lambda with a layer
const myModule = require('/opt/nodejs/my-layer/some-module');
```

## Configuration

Lambda Running provides a configuration system to map these layer paths to local directories through a `lambdarunning.config.json` file in your project root.

### Basic Example

The most basic configuration is to list your layer names:

```json
{
  "layers": ["my-layer", "another-layer"]
}
```

This automatically maps:
- `/opt/nodejs/my-layer` to `./layers/my-layer` in your project
- `/opt/nodejs/another-layer` to `./layers/another-layer` in your project

### Advanced Configuration

For more control, use the `layerMappings` property:

```json
{
  "layerMappings": {
    "/opt/nodejs/my-layer": "./layers/my-custom-location",
    "/opt/nodejs/aws-sdk": "./node_modules/aws-sdk"
  }
}
```

### Complete Configuration

A complete `lambdarunning.config.json` file can include:

```json
{
  "layers": [
    "common-utils"
  ],
  "layerMappings": {
    "/opt/nodejs/lodash": "./node_modules/lodash",
    "/opt/nodejs/custom-path": "./my-layers/special-location"
  },
  "envFiles": [
    ".env",
    ".env.local"
  ],
  "ignorePatterns": [
    "**/*.test.js"
  ],
  "ignoreLayerFilesOnScan": true,
  "debug": false
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `layers` | Array | `[]` | Simple array of layer names that will be mapped to the `./layers/{name}` directory |
| `layerMappings` | Object | `{}` | Detailed mappings from Lambda layer paths to local directories |
| `envFiles` | Array | `['.env']` | List of environment files to load (in order of precedence) |
| `ignorePatterns` | Array | `[]` | Additional glob patterns to ignore when scanning for handlers |
| `ignoreLayerFilesOnScan` | Boolean | `true` | Whether to ignore files in the layers directory when scanning for handlers |
| `debug` | Boolean | `false` | Enable debug mode for detailed logging |

### ignoreLayerFilesOnScan

The `ignoreLayerFilesOnScan` option (enabled by default) prevents scanning layer files as potential handlers, while still detecting handlers that use layers. This feature works as follows:

When enabled:
- All files in the `./layers/` directory are ignored during handler scanning
- All files in directories specified in `layerMappings` are ignored during handler scanning
- Lambda handlers that import from layers (using `/opt/nodejs/` paths) are still detected
- Lambda Running uses content analysis to identify handlers that couldn't be loaded due to layer dependencies

The system intelligently distinguishes between:
1. Handler files that use layers (which are included in the handler list)
2. Layer files that depend on other layers (which are excluded from the handler list)

If you have handlers inside your layers directory that you want to scan, you can disable this option by setting `"ignoreLayerFilesOnScan": false`.

## Setting Up Layers

1. Create a directory structure that mirrors your Lambda layers
2. Create the `lambdarunning.config.json` file in your project root
3. Define the mappings for your layers

### Example Directory Structure

```
my-project/
├── lambdarunning.config.json
├── handlers/
│   └── my-handler.js
├── layers/
│   ├── my-layer/
│   │   ├── index.js
│   │   └── utils.js
│   └── another-layer/
│       └── index.js
└── node_modules/
```

### Example Handler Using Layers

```javascript
// my-handler.js
const myLayer = require('/opt/nodejs/my-layer');
const anotherLayer = require('/opt/nodejs/another-layer');

exports.handler = async (event) => {
  const result = myLayer.doSomething(event.data);
  return anotherLayer.format(result);
};
```

## Auto-Resolution

Lambda Running will attempt to automatically resolve layer paths that are not explicitly mapped:

1. It first checks your defined mappings
2. If not found, it checks `node_modules` for the package name
3. If not found in `node_modules`, it checks the `layers` directory

This means simple cases might work without configuration, but explicit configuration is recommended for reliability.

## Debugging Layer Resolution

If you're having trouble with layer imports, set `"debug": true` in your configuration file to see detailed logs of how paths are being resolved.

## Best Practices

1. Structure your local layers folder to match how the code is organized within the actual Lambda layer
2. Use the same versions of dependencies locally as in your Lambda layers
3. For npm packages that you use in layers, consider mapping to your `node_modules` folder
4. Keep your layer code modular and follow good import practices 