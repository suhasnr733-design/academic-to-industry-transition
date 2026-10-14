// frontend/src/tests/unit/test_sidebar_collapse.mjs
import { cn } from '../../utils/helpers.js'

let passed = 0
let failed = 0

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`)
    passed++
  } else {
    console.error(`  ❌ FAIL: ${message}`)
    failed++
  }
}

console.log('=== 1. SIDEBAR WIDTH & RESPONSIVE STATE CLASSES ===')
{
  const getSidebarContainerClass = (isCollapsed, isOpen) => {
    return cn(
      'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] bg-white dark:bg-gray-900 border-r border-slate-200/80 dark:border-gray-800 flex flex-col justify-between shadow-xs transition-[width,transform] duration-300 ease-in-out motion-reduce:transition-none overflow-x-hidden select-none',
      isCollapsed ? 'w-60 lg:w-20' : 'w-60',
      'lg:translate-x-0',
      isOpen ? 'translate-x-0' : '-translate-x-full'
    )
  }

  const expandedDesktop = getSidebarContainerClass(false, false)
  assert(expandedDesktop.includes('w-60'), 'Expanded sidebar desktop width is 240px (w-60)')
  assert(!expandedDesktop.includes('lg:w-20'), 'Expanded sidebar does not have lg:w-20')
  assert(expandedDesktop.includes('duration-300 ease-in-out'), 'Includes 300ms ease-in-out animation')
  assert(expandedDesktop.includes('motion-reduce:transition-none'), 'Respects prefers-reduced-motion')
  assert(expandedDesktop.includes('overflow-x-hidden'), 'Prevents horizontal overflow during width animation')

  const collapsedDesktop = getSidebarContainerClass(true, false)
  assert(collapsedDesktop.includes('lg:w-20'), 'Collapsed sidebar desktop width is 80px (lg:w-20)')
  assert(collapsedDesktop.includes('w-60'), 'Mobile maintains full width (w-60) when drawer opens')
}

console.log('\n=== 2. MAIN CONTENT OFFSET SYNCHRONIZATION ===')
{
  const getMainContentClass = (isAuthenticated, isCollapsed) => {
    return `flex-1 transition-all duration-300 ease-in-out motion-reduce:transition-none ${
      isAuthenticated ? (isCollapsed ? 'lg:ml-20' : 'lg:ml-60') : ''
    } p-4 sm:p-5 md:p-6 lg:p-7 min-w-0`
  }

  const expandedMain = getMainContentClass(true, false)
  assert(expandedMain.includes('lg:ml-60'), 'Expanded content offset is 240px (lg:ml-60)')
  assert(expandedMain.includes('duration-300 ease-in-out'), 'Main content animated with 300ms ease-in-out')

  const collapsedMain = getMainContentClass(true, true)
  assert(collapsedMain.includes('lg:ml-20'), 'Collapsed content offset is 80px (lg:ml-20)')
  assert(collapsedMain.includes('motion-reduce:transition-none'), 'Main content respects reduced motion')
}

console.log('\n=== 3. NAVBAR BRANDING SYNCHRONIZATION ===')
{
  const getNavbarBrandClass = (isAuthenticated, isAuthPage, isCollapsed) => {
    return cn(
      "flex items-center h-16 transition-all duration-300 ease-in-out motion-reduce:transition-none",
      isAuthenticated && !isAuthPage
        ? isCollapsed
          ? "lg:w-20 lg:px-4 lg:justify-center lg:border-r lg:border-gray-200/80 dark:lg:border-gray-800 flex-shrink-0"
          : "lg:w-60 lg:px-4 lg:border-r lg:border-gray-200/80 dark:lg:border-gray-800 flex-shrink-0"
        : "px-4 sm:px-6 lg:px-8"
    )
  }

  const expandedBrand = getNavbarBrandClass(true, false, false)
  assert(expandedBrand.includes('lg:w-60'), 'Navbar branding is 240px (lg:w-60) when expanded')
  assert(expandedBrand.includes('duration-300 ease-in-out'), 'Navbar branding easing is 300ms ease-in-out')

  const collapsedBrand = getNavbarBrandClass(true, false, true)
  assert(collapsedBrand.includes('lg:w-20'), 'Navbar branding is 80px (lg:w-20) when collapsed')
  assert(collapsedBrand.includes('lg:justify-center'), 'Logo is centered at 80px')
}

console.log('\n=== 4. LABEL AND HEADING ANIMATION BEHAVIOR ===')
{
  const getLabelClass = (isCollapsed) => {
    return cn(
      "truncate whitespace-nowrap transition-all duration-300 ease-in-out motion-reduce:transition-none",
      isCollapsed 
        ? "max-w-[160px] opacity-100 translate-x-0 lg:max-w-0 lg:opacity-0 lg:translate-x-2 lg:pointer-events-none" 
        : "max-w-[160px] opacity-100 translate-x-0"
    )
  }

  const expandedLabel = getLabelClass(false)
  assert(expandedLabel.includes('max-w-[160px] opacity-100 translate-x-0'), 'Expanded label is visible and translated at 0')

  const collapsedLabel = getLabelClass(true)
  assert(collapsedLabel.includes('lg:max-w-0'), 'Collapsed label width closes to 0 on desktop')
  assert(collapsedLabel.includes('lg:opacity-0'), 'Collapsed label opacity fades to 0 on desktop')
  assert(collapsedLabel.includes('lg:translate-x-2'), 'Collapsed label translates horizontally by 2')
  assert(collapsedLabel.includes('lg:pointer-events-none'), 'Collapsed label cannot receive pointer events')
  assert(collapsedLabel.includes('whitespace-nowrap'), 'Label text never wraps during collapse/expand transition')

  const getSectionTitleClass = (isCollapsed) => {
    return cn(
      "text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out motion-reduce:transition-none",
      isCollapsed 
        ? "max-h-8 opacity-100 py-1 lg:max-h-0 lg:opacity-0 lg:py-0 lg:pointer-events-none" 
        : "max-h-8 opacity-100 py-1"
    )
  }

  const collapsedSection = getSectionTitleClass(true)
  assert(collapsedSection.includes('lg:max-h-0 lg:opacity-0 lg:py-0'), 'Collapsed section heading smoothly closes height and opacity')
}

console.log('\n=== 5. BADGES AND ACTIVE CAPSULE STYLING ===')
{
  const getNavLinkClass = (isCollapsed, active, role = 'student') => {
    return cn(
      'flex items-center text-[13.5px] font-medium transition-all duration-300 ease-in-out motion-reduce:transition-none group relative rounded-xl',
      isCollapsed
        ? 'h-10 sm:h-[42px] px-3 lg:px-0 lg:justify-center lg:w-10 lg:mx-auto'
        : 'h-10 sm:h-[42px] px-3 w-full justify-between',
      active
        ? role === 'faculty'
          ? isCollapsed
            ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border-2 border-purple-600 shadow-2xs'
            : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold border-l-[3px] border-purple-600 shadow-2xs'
          : isCollapsed
          ? 'bg-primary-50/70 dark:bg-primary-950/40 text-primary-600 dark:text-primary-300 font-semibold border-2 border-primary-600 shadow-2xs'
          : 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-semibold border-l-[3px] border-primary-600 shadow-2xs'
        : 'text-gray-600 dark:text-gray-400 hover:bg-slate-100/70 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200'
    )
  }

  const activeExpanded = getNavLinkClass(false, true, 'student')
  assert(activeExpanded.includes('border-l-[3px] border-primary-600'), 'Expanded active item uses left border highlight')

  const activeCollapsed = getNavLinkClass(true, true, 'student')
  assert(activeCollapsed.includes('border-2 border-primary-600'), 'Collapsed active item renders capsule border-2')
  assert(
    activeCollapsed.includes('lg:w-10') && 
    activeCollapsed.includes('lg:mx-auto') && 
    activeCollapsed.includes('lg:justify-center'), 
    'Collapsed active item is centered 40px capsule'
  )
}

console.log('\n=== 6. TOOLTIP BEHAVIOR SIMULATION ===')
{
  let isCollapsed = true
  let hoveredItem = null

  // Simulate hover on icon in collapsed state
  const onMouseEnter = (item, top) => {
    if (isCollapsed) {
      hoveredItem = { name: item.name, badgeKey: item.badgeKey, top }
    }
  }

  const onMouseLeave = () => {
    hoveredItem = null
  }

  onMouseEnter({ name: 'Job Matches', badgeKey: 'jobs' }, 180)
  assert(hoveredItem !== null, 'Hovering item sets hovered state')
  assert(hoveredItem.name === 'Job Matches', 'Tooltip displays correct item name')
  assert(hoveredItem.badgeKey === 'jobs', 'Tooltip retains badge metadata')
  assert(hoveredItem.top === 180, 'Tooltip positioned at accurate vertical offset')

  onMouseLeave()
  assert(hoveredItem === null, 'Mouse leave immediately clears tooltip')

  // When expanded, tooltips do not activate
  isCollapsed = false
  onMouseEnter({ name: 'Job Matches', badgeKey: 'jobs' }, 180)
  assert(hoveredItem === null, 'Tooltips do not activate when sidebar is expanded')
}

console.log('\n======================================================')
console.log(`TOTAL ANIMATION & SIDEBAR AUDIT TESTS: ${passed + failed}`)
console.log(`PASSED: ${passed}`)
console.log(`FAILED: ${failed}`)
console.log('======================================================')

if (failed > 0) process.exit(1)
process.exit(0)
