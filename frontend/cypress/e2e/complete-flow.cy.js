// frontend/cypress/e2e/complete-flow.cy.js

describe('Complete User Flow', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should register and login', () => {
    // Register
    cy.visit('/register')
    cy.get('input[name="full_name"]').type('Test User')
    cy.get('input[name="username"]').type('testuser')
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('TestPass123!')
    cy.get('input[name="confirmPassword"]').type('TestPass123!')
    cy.get('button[type="submit"]').click()
    
    cy.url().should('include', '/login')
    cy.contains('Registration successful').should('be.visible')
    
    // Login
    cy.get('input[name="username"]').type('testuser')
    cy.get('input[name="password"]').type('TestPass123!')
    cy.get('button[type="submit"]').click()
    
    cy.url().should('include', '/dashboard')
    cy.contains('Welcome back').should('be.visible')
  })

  it('should upload resume', () => {
    cy.visit('/login')
    cy.get('input[name="username"]').type('testuser')
    cy.get('input[name="password"]').type('TestPass123!')
    cy.get('button[type="submit"]').click()
    
    cy.visit('/resume/upload')
    cy.get('input[type="file"]').attachFile('sample_resume.pdf')
    cy.contains('Upload All').click()
    
    cy.contains('Resume uploaded successfully', { timeout: 10000 }).should('be.visible')
  })

  it('should view jobs', () => {
    cy.visit('/login')
    cy.get('input[name="username"]').type('testuser')
    cy.get('input[name="password"]').type('TestPass123!')
    cy.get('button[type="submit"]').click()
    
    cy.visit('/jobs')
    cy.get('[data-testid="job-list"]').should('be.visible')
  })

  it('should be responsive', () => {
    cy.viewport('iphone-x')
    cy.visit('/login')
    cy.get('[data-testid="mobile-menu-button"]').click()
    cy.get('[data-testid="mobile-menu"]').should('be.visible')
  })
})
