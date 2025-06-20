# 📦 Lambda Running: Lambda Layers

Lambda Running allows you to use AWS Lambda layers locally, making development and testing seamless.

## 🔍 What Are Lambda Layers?

In AWS Lambda, layers are a way to package libraries and dependencies that can be shared across multiple functions. They're mounted at the `/opt` directory in your Lambda execution environment.

For Node.js, these are typically found at `/opt/nodejs/`:

```javascript
// In AWS Lambda with a layer
const myModule = require('/opt/nodejs/my-layer/some-module');
```

## ⚠️ Important Note

Lambda Layers support in Lambda Running **only works for local development**. You must download the layer code and place it in your project directory. This feature does not fetch layers from AWS cloud.

## 🛠️ Setting Up Layers

### 1. Create the Layer Directory Structure

Set up your project with a directory structure that matches AWS Lambda layers:

```
my-project/
├── package.json
├── tsconfig.json
├── lambda-running.json
├── handlers/
│   └── my-handler.js
└── layers/
    └── my-layer/
        └── nodejs/
            └── utils/
                └── index.js
```

### 2. Configure Lambda Running

Create a `lambda-running.json` file in your project root with your layer configuration:

```json
{
  "layerMappings": {
    "/opt/nodejs": "layers/common",
  }
}
```

### 3. Write Your Handler Code

In your Lambda handler, import from layers using the absolute paths as you would in AWS:

```javascript
// my-handler.js
const myLayer = require('/opt/nodejs/my-layer/utils');

exports.handler = async (event) => {
  const result = myLayer.doSomething(event.data);
  return {
    statusCode: 200,
    body: JSON.stringify({ result })
  };
};
```

### 4. Run Your Handler

Now run your handler with Lambda Running. The layer imports will be automatically resolved:

```bash
lambda-run run ./handlers/my-handler.js handler --event '{"data":"test"}'
```

## 🔧 Advanced Layer Features

### Layer Scanning Control

By default, Lambda Running ignores layer files when scanning for handlers. You can control this with:

```json
{
  "ignoreLayerFilesOnScan": true  // default
}
```

### Custom Layer Directories

You can store layers in any location by using custom mappings:

```json
{
  "layerMappings": {
    "/opt/nodejs/my-layer": "./custom/path/to/layer"
  }
}
```

## 💡 Best Practices

1. **Match AWS structure**: Keep your layer structure identical to how it's deployed in AWS
2. **Use versioning**: Consider versioning your layers locally as you do in AWS
3. **NPM modules**: For NPM modules, map to `node_modules` instead of duplicating
4. **Documentation**: Comment your layer structure and usage in your code

## 🔎 Debugging Layer Resolution

If you're having trouble with layer imports, set `"debug": true` in your configuration file:

```json
{
  "debug": true
}
```

This will show detailed logs of how layer paths are being resolved.

## 🔍 Next Steps

- [Configure Lambda Running](../configuration.md)
- [Explore TypeScript support](./typescript.md)
- [Learn about event management](./event-management.md) 