import { promises } from 'fs'
import { resolve } from 'path'
import { Extension, FileContext, FixedConfig } from './type'

const { writeFile, mkdir } = promises

export async function exportFile(fileContext: FileContext, config: FixedConfig): Promise<void> {
  const outputData = await stringifyStrategy[fileContext.extension](fileContext)

  await write(fileContext, outputData, config)
}

type Stringify = (fileContext: FileContext) => string | Promise<string>

async function write(fileContext: FileContext, data: string, config: FixedConfig): Promise<void> {
  const outputBaseDir = resolve(config.cwd ?? process.cwd(), config.dist)
  const filePath = fileContext.outputFile.split('/').slice(0, -1).join('/')

  await mkdir(resolve(outputBaseDir, filePath), { recursive: true })

  await writeFile(resolve(outputBaseDir, fileContext.outputFile), data)
}
const stringifyStrategy = {
  json: (fileContext) => JSON.stringify(fileContext.json, null, 2),
  yaml: async (fileContext) => {
    const yaml = await import('yaml')
    return yaml.stringify(fileContext.json)
  }
} as Record<Extension, Stringify>
