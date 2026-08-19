// frontend/cypress/e2e/complete-flow.cy.js

describe('Complete User Flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should complete full user journey', () => {
    // 1. Register
    cy.visit('/register')
    cy.get('input[name="full_name"]').type('Test User')
    cy.get('input[name="username"]').type('testuser')
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('TestPass123!')
    cy.get('input[name="confirmPassword"]').type('TestPass123!')
    cy.get('input[name="department"]').type('Computer Science')
    cy.get('input[name="year_of_study"]').type('4')
    cy.get('button[type="submit"]').click()
    
    cy.url().should('include', '/login')
    cy.contains('Registration successful').should('be.visible')

    // 2. Login
    cy.get('input[name="username"]').type('testuser')
    cy.get('input[name="password"]').type('TestPass123!')
    cy.get('button[type="submit"]').click()
    
    cy.url().should('include', '/dashboard')
    cy.contains('Welcome back').should('be.visible')

    // 3. Upload Resume
    cy.visit('/resume/upload')
    cy.get('input[type="file"]').attachFile('sample_resume.pdf')
    cy.contains('Upload All').click()
    
    cy.contains('Resume uploaded successfully', { timeout: 10000 }).should('be.visible')

    // 4. View Resume List
    cy.visit('/resume')
    cy.contains('sample_resume.pdf').should('be.visible')

    // 5. View Jobs
    cy.visit('/jobs')
    cy.get('[data-testid="job-list"]').should('be.visible')

    // 6. View Dashboard
    cy.visit('/dashboard')
    cy.get('[data-testid="dashboard-stats"]').should('be.visible')

    // 7. View Real-time Dashboard
    cy.visit('/dashboard/realtime')
    cy.contains('Real-time Dashboard').should('be.visible')
  })

  it('should handle mobile view', () => {
    cy.viewport('iphone-x')
    cy.visit('/login')
    cy.get('[data-testid="mobile-menu-button"]').click()
    cy.get('[data-testid="mobile-menu"]').should('be.visible')
  })

  it('should work offline', () => {
    // Simulate offline
    cy.visit('/dashboard')
    cy.wait(1000)
    
    // Go offline
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(false)
    })
    
    cy.reload()
    cy.contains('dashboard').should('exist')
  })
})
