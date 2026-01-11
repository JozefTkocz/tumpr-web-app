//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  {
    ignores: ['dev-dist/**', 'dist/**'],
  },
  ...tanstackConfig,
]
