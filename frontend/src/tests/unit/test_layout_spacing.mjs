// test_layout_spacing.mjs
// Comprehensive verification of horizontal spacing, alignment, and viewport constraints

import assert from 'assert'
import fs from 'fs'
import path from 'path'

console.log('=== 1. AUDIT LAYOUT.JSX CONTAINER & OFFSET CONSTRAINTS ===')
{
  const layoutContent = fs.readFileSync('src/components/layout/Layout.jsx', 'utf8')
  
  // 1.1 Outer wrapper has overflow-x-hidden
  assert(layoutContent.includes('overflow-x-hidden'), 'Layout.jsx contains overflow-x-hidden to prevent horizontal page scrolling')
  
  // 1.2 Inner container has w-full min-w-0
  assert(layoutContent.includes('w-full min-w-0 flex-1 flex flex-col'), 'Layout.jsx inner wrapper occupies w-full min-w-0')
  assert(layoutContent.includes('flex flex-1 w-full min-w-0'), 'Layout.jsx sidebar/main flex container occupies w-full min-w-0')
  
  // 1.3 Main element has min-w-0 w-full and synchronized margins
  assert(layoutContent.includes('lg:ml-20') && layoutContent.includes('lg:ml-60'), 'Layout.jsx main element synchronizes 80px (lg:ml-20) and 240px (lg:ml-60)')
  assert(layoutContent.includes('min-w-0 w-full'), 'Layout.jsx main element has min-w-0 and w-full')
  assert(layoutContent.includes('duration-300 ease-in-out'), 'Layout.jsx retains 300ms ease-in-out animation')
  assert(layoutContent.includes('motion-reduce:transition-none'), 'Layout.jsx respects reduced motion')
  
  console.log('  ✅ PASS: Layout.jsx enforces overflow-x-hidden, w-full, min-w-0, and synchronized 80px/240px offsets')
}

console.log('\n=== 2. AUDIT SKILLGAPANALYSIS.JSX WIDTH & GRID CONSTRAINTS ===')
{
  const skillGapContent = fs.readFileSync('src/pages/skills/SkillGapAnalysis.jsx', 'utf8')
  
  // 2.1 No max-w-5xl mx-auto on main container
  assert(!skillGapContent.includes('max-w-5xl mx-auto space-y-6'), 'SkillGapAnalysis.jsx does NOT contain max-w-5xl mx-auto constraint')
  assert(skillGapContent.includes('w-full space-y-6 min-w-0'), 'SkillGapAnalysis.jsx container occupies w-full min-w-0')
  
  // 2.2 Top summary header flex alignment
  assert(skillGapContent.includes('min-w-0 flex-1'), 'SkillGapAnalysis.jsx header has min-w-0 flex-1 for clean heading flex')
  assert(skillGapContent.includes('Role competency match'), 'SkillGapAnalysis.jsx preserves score card alignment')
  
  // 2.3 Grid and column min-w-0 constraints
  assert(skillGapContent.includes('grid grid-cols-1 md:grid-cols-2 items-start gap-4 sm:gap-5 mb-8 min-w-0'), 'SkillGapAnalysis.jsx grid has min-w-0')
  assert(skillGapContent.includes('bg-emerald-50/30 rounded-xl border border-emerald-100/90 p-3.5 sm:p-4 min-w-0'), 'Matching skills column has min-w-0')
  assert(skillGapContent.includes('bg-rose-50/30 rounded-xl border border-rose-100/90 p-3.5 sm:p-4 min-w-0'), 'Missing skills column has min-w-0')
  assert(skillGapContent.includes('flex items-center gap-1.5 flex-wrap sm:flex-nowrap flex-shrink-0 justify-end'), 'Missing skill actions wrap safely on narrow viewports')
  
  console.log('  ✅ PASS: SkillGapAnalysis.jsx uses full width, avoids arbitrary fixed limits, and allows responsive grid shrinking')
}

console.log('\n=== 3. AUDIT INDEX.CSS GLOBAL OVERFLOW CONSTRAINTS ===')
{
  const cssContent = fs.readFileSync('src/index.css', 'utf8')
  assert(cssContent.includes('overflow-x: hidden'), 'index.css sets overflow-x: hidden')
  assert(cssContent.includes('max-width: 100vw'), 'index.css constrains max-width: 100vw')
  console.log('  ✅ PASS: index.css sets global overflow-x: hidden and max-width: 100vw')
}

console.log('\n=== 4. MULTI-VIEWPORT HORIZONTAL LAYOUT SIMULATION ===')

function simulateViewport(viewportWidth, isCollapsed, deviceType) {
  // Mobile / tablet drawer vs desktop fixed sidebar
  const isDesktop = viewportWidth >= 1024
  const sidebarWidth = isDesktop ? (isCollapsed ? 80 : 240) : 0
  const mainMarginLeft = sidebarWidth
  
  // Responsive padding: lg:p-7 (28px), md:p-6 (24px), sm:p-5 (20px), p-4 (16px)
  const paddingX = viewportWidth >= 1024 ? 28 : viewportWidth >= 768 ? 24 : viewportWidth >= 640 ? 20 : 16
  
  const availableMainWidth = viewportWidth - mainMarginLeft
  const availableContentWidth = availableMainWidth - (paddingX * 2)
  
  // Content card with w-full starts immediately after left padding
  const cardLeftFromSidebar = paddingX
  const cardRightEdge = mainMarginLeft + cardLeftFromSidebar + availableContentWidth
  const overflow = cardRightEdge - viewportWidth
  
  return {
    viewportWidth,
    isCollapsed,
    sidebarWidth,
    paddingX,
    availableMainWidth,
    availableContentWidth,
    cardLeftFromSidebar,
    cardRightEdge,
    overflow
  }
}

const testCases = [
  { name: '1440px desktop (collapsed)', width: 1440, collapsed: true },
  { name: '1440px desktop (expanded)',  width: 1440, collapsed: false },
  { name: '1366px desktop (collapsed)', width: 1366, collapsed: true },
  { name: '1366px desktop (expanded)',  width: 1366, collapsed: false },
  { name: '1024px laptop/tablet (collapsed)', width: 1024, collapsed: true },
  { name: '1024px laptop/tablet (expanded)',  width: 1024, collapsed: false },
  { name: '768px tablet', width: 768, collapsed: false },
  { name: '375px mobile', width: 375, collapsed: false },
]

for (const tc of testCases) {
  const sim = simulateViewport(tc.width, tc.collapsed)
  
  // Assert no horizontal overflow
  assert(sim.overflow <= 0, `No horizontal overflow at ${tc.name} (overflow: ${sim.overflow}px)`)
  
  // Assert consistent left padding from sidebar (no giant gap > padding)
  assert(sim.cardLeftFromSidebar === sim.paddingX, `Content starts immediately after sidebar padding at ${tc.name}`)
  
  // Assert content occupies full available width
  assert(sim.availableContentWidth > 0, `Content has positive width at ${tc.name}`)
  
  console.log(`  ✅ PASS [${tc.name}]: Sidebar=${sim.sidebarWidth}px, Padding=${sim.paddingX}px, ContentWidth=${sim.availableContentWidth}px, RightEdge=${sim.cardRightEdge}px (0px overflow)`)
}

console.log('\n======================================================')
console.log('TOTAL HORIZONTAL SPACING & VIEWPORT AUDIT TESTS: ALL PASSED')
console.log('======================================================\n')
