export type Extension = 'json' | 'yaml'

export type Primitive = string | number | boolean | null | undefined

export function isPrimitive(value: unknown): value is Primitive {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
  )
}

export function isPureObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

type Pattern = string

/**
 *
 * @params value
 * @params context
 * @returns Primitive | Promise<Primitive>
 */
export type Converter = (
  value: Primitive,
  context: ConvertContext
) => Primitive | Promise<Primitive>

/**
 *
 */
export interface Config {
  /**
   *
   * @default process.cwd()
   */
  cwd?: string

  /**
   *
   */
  src: string

  /**
   *
   */
  dist: string

  /**
   *
   */
  ignore?: Pattern[]

  /**
   *
   * @param value
   * @param context
   */
  convert: Converter

  /**
   *
   * @default ['json']
   */
  extensions?: Extension[]

  /**
   *
   * @default true
   */
  cache?: boolean

  /**
   * @default false
   */
  parallel?: number | false
}

export const defaultConfig = {
  cwd: process.cwd(),
  extensions: ['json'],
  cache: true,
  parallel: false
} satisfies Omit<Config, 'src' | 'dist' | 'convert'>

export type FixedConfig = Config & typeof defaultConfig

export interface ConvertContext {
  /**
   *
   */
  key: string

  /**
   *
   */
  value: Primitive

  /**
   *
   */
  file: FileContext
}

export interface FileContext {
  /**
   *
   */
  filePath: string

  /**
   *
   */
  fileName: string

  /**
   *
   */
  extension: Extension

  /**
   *
   */
  outputFile: string

  /**
   *
   */
  json: unknown
}

export interface MimicTreeContxt {
  /**
   *
   */
  files: FileContext[]

  /**
   *
   */
  config: FixedConfig
}
