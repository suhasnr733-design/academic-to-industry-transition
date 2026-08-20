// frontend/cypress/e2e/final_complete_flow.cy.js

describe('Final Complete Flow', () => {
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

    // 4. View Jobs
    cy.visit('/jobs')
    cy.get('[data-testid="job-list"]').should('be.visible')

    // 5. View Skills
    cy.visit('/skills')
    cy.get('[data-testid="skill-chart"]').should('be.visible')

    // 6. View Learning Path
    cy.visit('/learning')
    cy.get('[data-testid="learning-path"]').should('be.visible')

    // 7. Check Notifications
    cy.get('[data-testid="notification-bell"]').click()
    cy.get('[data-testid="notification-list"]').should('be.visible')

    // 8. Update Profile
    cy.visit('/profile')
    cy.get('input[name="full_name"]').clear().type('Updated User')
    cy.get('button[type="submit"]').click()
    cy.contains('Profile updated').should('be.visible')

    // 9. Logout
    cy.get('[data-testid="logout-button"]').click()
    cy.url().should('include', '/login')
  })

  it('should work offline', () => {
    cy.visit('/login')
    cy.window().then((win) => {
      cy.stub(win.navigator, 'onLine').value(false)
    })
    cy.reload()
    cy.contains('Offline Mode').should('be.visible')
  })

  it('should support dark mode', () => {
    cy.visit('/login')
    cy.get('[data-testid="theme-toggle"]').click()
    cy.get('html').should('have.attr', 'data-theme', 'dark')
    cy.get('[data-testid="theme-toggle"]').click()
    cy.get('html').should('have.attr', 'data-theme', 'light')
  })

  it('should be responsive', () => {
    cy.viewport('iphone-x')
    cy.visit('/login')
    cy.get('[data-testid="mobile-menu-button"]').click()
    cy.get('[data-testid="mobile-menu"]').should('be.visible')
  })
})
