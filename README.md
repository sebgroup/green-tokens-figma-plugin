# Green Tokens Figma Plugin

A Figma plugin that imports and updates Figma variables

## How it works

Using [Green tokens](https://github.com/sebgroup/green/tree/main/libs/tokens) you can genereate a json file with the correct structure to be imported with this Figma plugin. You can also install the latest version of our token through npm at [@sebgroup/green-tokens](https://www.npmjs.com/package/@sebgroup/green-tokens)

## Requirements

If order for the plugin to work you need to have two local variable collections in your Figma file called:

- Ref
- Sys

These refer to the ref tokens and sys tokens structure that Green design system uses.

### Development scripts

#### `yarn run build`

> Builds the plugin

#### `yarn run watch`

> Build plugin and watches for changes and hot reloads plugin in Figma

## Support

If you have questions about this plugin reach out to [vilhelm.sjolander@seb.se](mailto:vilhelm.sjolander@seb.se)