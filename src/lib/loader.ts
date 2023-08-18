import type { MimicTreeContxt, FixedConfig, Extension } from './type'
import { resolve } from 'path'
import { promises } from 'fs'
import globby from 'globby'
import { FileContext } from './type'

const { readFile } = promises

export async function loadContext(config: FixedConfig): Promise<MimicTreeContxt> {
  const baseDir = resolve(config.cwd ?? process.cwd(), config.src)

  const [founds, ignores] = await Promise.all([
    globFiles(baseDir, config),
    ignoreFiles(baseDir, config)
  ])

  const files = founds.filter((file) => !ignores.includes(file))

  return {
    files: await loadAllFiles(baseDir, files, config),
    config
  }
}

const extensionAliases = {
  yaml: ['yml', 'yaml'],
  json: ['json']
} satisfies Record<Extension, string[]>
Object.freeze(extensionAliases)

const extensions = Object.keys(extensionAliases) as Extension[]
Object.freeze(extensions)

function globFiles(baseDir: string, config: FixedConfig): Promise<string[]> {
  return globby(baseDir, {
    expandDirectories: {
      extensions: (config.extensions ?? ['json']).flatMap((ext) => extensionAliases[ext])
    },
    gitignore: false,
    cwd: config.cwd
  })
}

async function ignoreFiles(baseDir: string, config: FixedConfig): Promise<string[]> {
  if ((config.ignore ?? []).length <= 0) {
    return []
  }

  return globby(config.ignore!, {
    gitignore: true,
    cwd: config.cwd
  })
}

async function loadAllFiles(
  baseDir: string,
  files: string[],
  config: FixedConfig
): Promise<FileContext[]> {
  const loader = new JsonLoader(baseDir, config)
  await loader.init()

  const load = async (filePath: string) => loader.load(filePath)

  const results = await Promise.all(files.map(load))

  if (results.some((result) => result.error)) {
    throw new Error()
  }

  const outputBaseDir = resolve(config.cwd ?? process.cwd(), config.dist)
  console.log(outputBaseDir)

  return results.map((result) => ({
    ...(result as Omit<FileContext, 'outputFile'>),
    outputFile: resolve(outputBaseDir, result.filePath, result.fileName).replace(outputBaseDir, '.')
  }))
}

type LoadJsonResult = Omit<FileContext, 'outputFile' | 'json'> & { json?: unknown; error?: string }

type Parser = (raw: string) => unknown

class JsonLoader {
  constructor(
    private readonly baseDir: string,
    private readonly config: FixedConfig
  ) {}

  #parsers: Partial<Record<Extension, Parser>> = {
    json: (raw) => JSON.parse(raw)
  }

  async init() {
    if (this.config.extensions?.includes('yaml')) {
      this.#parsers['yaml'] = await this.#createYamlParser()
    }
  }

  async #createYamlParser(): Promise<Parser> {
    const { parse } = await import('yaml')
    return (raw) => parse(raw, { prettyErrors: true })
  }

  #assertSupportedExtension(ext: string): asserts ext is Extension {
    if (!(this.config.extensions ?? ['json']).includes(ext as Extension)) {
      throw new Error(`Unsupported file extension: ${ext}`)
    }
  }

  #getPath(fullpath: string): string {
    return (
      './' +
      fullpath
        .replace(/^\.\//, '')
        .replace(new RegExp(`^${this.baseDir.replace(/^\.\//, '')}/`), '')
        .replace(getFileName(fullpath), '')
    )
  }

  #parse(raw: string, ext: Extension): unknown {
    const parser = this.#parsers[ext]
    if (!parser) {
      throw new Error(`Unsupported file extension: ${ext}`)
    }
    return parser(raw)
  }

  #errorToString(e: unknown): string {
    if (e instanceof Error) {
      return `${e.name}: ${e.message}`
    }
    return String(e)
  }

  async load(filePath: string): Promise<LoadJsonResult> {
    const importPath = resolve(this.baseDir, filePath)
    const fileName = getFileName(filePath)
    const extension = getExtension(filePath)
    this.#assertSupportedExtension(extension)
    const fixedFilePath = this.#getPath(filePath)

    const raw = await readFile(importPath, 'utf-8')

    try {
      return {
        filePath: fixedFilePath,
        fileName,
        extension: extension,
        json: this.#parse(raw, extension)
      }
    } catch (e) {
      return {
        filePath: fixedFilePath,
        fileName,
        extension,
        error: this.#errorToString(e)
      }
    }
  }
}

function getExtension(filePath: string): Extension {
  const ext = filePath.split('.').pop() ?? ''
  const found = Object.entries(extensionAliases).find(([, aliases]) =>
    (aliases as readonly string[]).includes(ext)
  )
  return (found?.[0] as Extension) ?? ext
}

function getFileName(filePath: string): string {
  return filePath.split('/').pop() ?? ''
}
