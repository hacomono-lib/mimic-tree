import { describe, it } from 'vitest'
import { promises } from 'fs'
import { resolve } from 'path'
import { mimicTree } from '../../src'

const { rmdir } = promises

describe('basic', () => {
  it('clone tree with same values', async () => {
    const outputDir = 'basic-result'
    await rmdir(resolve(__dirname, outputDir), { recursive: true })

    await mimicTree({
      src: 'basic',
      cwd: __dirname,
      dist: 'basic-result',
      extensions: ['json', 'yaml'],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      convert: (v: any) => v + v
    })
  })
})
