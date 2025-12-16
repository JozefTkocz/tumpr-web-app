import {
  defineConfig,
  minimal2023Preset as preset,
} from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset,
  images: [
    'public/favicon.svg',
    'public/TUMPr_logo.svg',
    'public/TUMPr_logo_text.svg',
  ],
})
