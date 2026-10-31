import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { copyFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function githubPagesSpaPlugin() {
  return {
    name: 'github-pages-spa',
    closeBundle() {
      const distDir = fileURLToPath(new URL('./dist', import.meta.url))
      const indexHtml = resolve(distDir, 'index.html')
      if (!existsSync(indexHtml)) return

      // 1. Create 404.html fallback for GitHub Pages client-side routing
      copyFileSync(indexHtml, resolve(distDir, '404.html'))

      // 2. Pre-create /playbook/index.html so direct visits return HTTP 200 on GitHub Pages
      const playbookDir = resolve(distDir, 'playbook')
      mkdirSync(playbookDir, { recursive: true })
      copyFileSync(indexHtml, resolve(playbookDir, 'index.html'))

      // 3. Add .nojekyll to bypass Jekyll processing on GitHub Pages
      writeFileSync(resolve(distDir, '.nojekyll'), '')
    }
  }
}

export default defineConfig(({ command }) => {
  let base = '/'
  if (command === 'build') {
    if (process.env.BASE_URL) {
      base = process.env.BASE_URL
    } else if (process.env.GITHUB_REPOSITORY) {
      const repo = process.env.GITHUB_REPOSITORY.split('/')[1] || ''
      base = repo.endsWith('.github.io') ? '/' : `/${repo}/`
    } else {
      base = '/courtvision-app/'
    }
  }

  return {
    base,
    plugins: [vue(), githubPagesSpaPlugin()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }
})
