import { defaultConfig, type Config, FixedConfig } from './lib/type'
import { loadContext } from './lib/loader'
import { convert } from './lib/clone'
import { exportFile } from './lib/export'

export type { Config as Option }

export async function mimicTree(config: Config): Promise<void> {
  const fixedConfig = {
    ...defaultConfig,
    ...config
  } as FixedConfig

  const context = await loadContext(fixedConfig)

  for (const f of context.files) {
    const result = await convert(f, context.config)
    await exportFile(result, context.config)
  }
}
