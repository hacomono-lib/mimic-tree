# mimic-tree

mimic-tree is a Node.js package designed to convert values in JSON and YAML files within a specified directory, outputting the transformed content to a new directory while preserving the original structure. This can be particularly useful, for instance, when you want to batch translate language resource data.

## Features

- Preserves hierarchical directory structure during conversion and output
- Custom function-based value conversion for JSON and YAML files
- Can be combined with translation APIs for batch translation capabilities

## Installation

```sh
npm install mimic-tree
```

## Usage

Import the mimicTree function and use it with the necessary options as shown below:

```ts
import { mimicTree } from 'mimic-tree'

async function main() {
  await mimicTree({
    src: 'basic',
    cwd: __dirname,
    dist: 'basic-result',
    extensions: ['json', 'yaml'],
    convert: (v: string | number | null) => v /* ... convert value ... */
  })
}
```

## Options

- src (required): Specifies the source root path.
- cwd: Specifies the current working directory. Defaults to process.cwd().
- dist (required): Specifies the destination path.
- extensions: Specifies the file extensions to target. Defaults to `['json']`.
  If you want to target both JSON and YAML files, specify `['json', 'yaml']` and run `npm install yarn`.
- convert (required): A function to convert the value. This function is invoked for each value, and it returns the new value.

## Use Cases

If your language resource data is managed in JSON or YAML formats, you can use this package to apply translation APIs or custom functions and output the translated data into a new directory.

For instance, when combined with a translation API like Google Translate, you could set it up for batch translations as shown:

```ts
import { mimicTree } from 'mimic-tree'
import { resolve } from 'path'
import { translate } from 'your-translate-api'

/**
 * @params fromLocale (e.g. 'en')
 * @params toLocale (e.g. 'ja')
 */
export async function translate(fromLocale: string, toLocale: string) {
  await mimicTree({
    src: fromLocale,
    cwd: resolve(__dirname, 'locales'),
    dist: toLocale,
    extensions: ['json', 'yaml'],
    convert: async (v: string) =>
      typeof v === 'string' ? await translate(v, fromLocale, toLocale) : v
  })
}
```

## License

[MIT](./LICENSE)

## Contributing

see [CONTRIBUTING.md](./CONTRIBUTING.md)
