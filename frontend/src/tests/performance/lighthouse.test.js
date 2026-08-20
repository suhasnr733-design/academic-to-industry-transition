// frontend/src/tests/performance/lighthouse.test.js

import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import fs from 'fs'

describe('Lighthouse Performance Tests', () => {
  let chrome

  beforeAll(async () => {
    chrome = await launch({ chromeFlags: ['--headless'] })
  })

  afterAll(async () => {
    await chrome.kill()
  })

  it('should pass performance thresholds', async () => {
    const options = {
      logLevel: 'info',
      output: 'json',
      port: chrome.port,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
    }

    const runnerResult = await lighthouse('http://localhost:3000', options)
    
    const scores = {
      performance: runnerResult.lhr.categories.performance.score,
      accessibility: runnerResult.lhr.categories.accessibility.score,
      bestPractices: runnerResult.lhr.categories['best-practices'].score,
      seo: runnerResult.lhr.categories.seo.score
    }

    console.log('Lighthouse Scores:', {
      performance: scores.performance * 100,
      accessibility: scores.accessibility * 100,
      bestPractices: scores.bestPractices * 100,
      seo: scores.seo * 100
    })

    // Save report
    fs.writeFileSync('lighthouse-report.json', JSON.stringify(runnerResult.lhr, null, 2))

    expect(scores.performance).toBeGreaterThan(0.85)
    expect(scores.accessibility).toBeGreaterThan(0.9)
    expect(scores.bestPractices).toBeGreaterThan(0.8)
    expect(scores.seo).toBeGreaterThan(0.8)
  }, 60000)
})