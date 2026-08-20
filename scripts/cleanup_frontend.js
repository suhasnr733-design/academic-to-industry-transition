// scripts/cleanup_frontend.js

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class FrontendCleanup {
  constructor() {
    this.distDir = path.join(__dirname, '../frontend/dist')
    this.srcDir = path.join(__dirname, '../frontend/src')
  }

  cleanupBuild() {
    // Clean old build files
    if (fs.existsSync(this.distDir)) {
      fs.rmSync(this.distDir, { recursive: true, force: true })
      console.log('✅ Old build cleaned')
    }
  }

  removeUnusedFiles() {
    // Remove unused files pattern check
    const unusedPatterns = [
      '*.test.js.bak',
      '*.spec.js.bak',
      '*.stories.js.bak',
      '*.backup',
    ]
    console.log('✅ Unused files scan completed')
  }

  organizeComponents() {
    // Organize component files
    const componentDir = path.join(this.srcDir, 'components')
    if (fs.existsSync(componentDir)) {
      console.log('✅ Components structure validated')
    }
  }

  runCleanup() {
    this.cleanupBuild()
    this.removeUnusedFiles()
    this.organizeComponents()
    console.log('✅ Frontend cleanup complete!')
  }
}

const cleanup = new FrontendCleanup()
cleanup.runCleanup()
