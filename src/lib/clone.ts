import {
  FixedConfig,
  ConvertContext,
  FileContext,
  isPrimitive,
  isPureObject,
  Primitive
} from './type'
import { PromisePool } from '@supercharge/promise-pool'

const ROOT_KEY = '[ROOT]'

export async function convert(fileContext: FileContext, config: FixedConfig): Promise<FileContext> {
  const convertTargets = convertFlattenKV('', fileContext.json)

  const { results, errors } = await createWorker(config)
    .for(convertTargets)
    .process(async ({ key, value }) => {
      const { convert } = config
      const context: ConvertContext = { key, value, file: fileContext }
      const result = await convert(value, context)

      return { key, value: result }
    })

  if (errors.length > 0) {
    throw errors[0]
  }

  return {
    ...fileContext,
    json: toObject(results)
  }
}

/**
 *
 * @param keyPrefix
 * @param value
 */
function convertFlattenKV(
  keyPrefix: string,
  value: unknown
): Array<{ key: string; value: Primitive }> {
  if (isPrimitive(value)) {
    // root の場合 keyPrefix は空文字列
    return [{ key: keyPrefix || ROOT_KEY, value }]
  }

  if (Array.isArray(value)) {
    return value.flatMap((v, i) => convertFlattenKV(`${keyPrefix}[${i}]`, v))
  }

  if (isPureObject(value)) {
    const requiredDot = keyPrefix !== '' && !keyPrefix.endsWith(']')

    return Object.entries(value).flatMap(([k, v]) =>
      convertFlattenKV(`${keyPrefix}${requiredDot ? '.' : ''}${k}`, v)
    )
  }

  return []
}

/**
 *
 * @param flattenKVs
 */
function toObject(flattenKVs: Array<{ key: string; value: Primitive }>): unknown {
  if (flattenKVs.length <= 1) {
    return undefined
  }

  if (flattenKVs.length === 1 && flattenKVs[0]!.key === ROOT_KEY) {
    return flattenKVs[0]!.value
  }

  if (flattenKVs[0]!.key.startsWith('[')) {
    // 先に sort しているので、index 順になっている
    const indexes = flattenKVs
      .map(({ key }) => key.match(/^\[(\d+)\]/)![1]!)
      .map(Number)
      .filter((v, i, self) => self.indexOf(v) === i)

    const pickByIndex = (index: number) =>
      flattenKVs.filter(({ key }) => key.startsWith(`[${index}]`))

    return indexes.reduce((acc, index) => {
      const picked = pickByIndex(index).map(({ key, value }) => ({
        key: key.replace(/^\[\d+\]/, ''),
        value
      }))
      return [...acc, toObject(picked)]
    }, [] as unknown[])
  }

  const keys = flattenKVs
    .map(({ key }) => (key.includes('.') ? key.split('.')[0]! : key))
    .filter((v, i, self) => self.indexOf(v) === i)

  return keys.reduce((acc, key) => {
    const exactMatch = flattenKVs.find(({ key: k }) => k === key)
    if (exactMatch) {
      return { ...acc, [key]: exactMatch.value }
    }

    const picked = flattenKVs
      .filter(({ key: k }) => k.startsWith(`${key}.`))
      .map(({ key, value }) => ({ key: key.replace(/^.+\./, ''), value }))
    return { ...acc, [key]: toObject(picked) }
  }, {})
}

/**
 *
 * @param param0
 */
function createWorker({ parallel }: FixedConfig): typeof PromisePool {
  let pool = PromisePool

  if (typeof parallel === 'number') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pool = pool.withConcurrency(parallel) as any
  }

  return pool
}
