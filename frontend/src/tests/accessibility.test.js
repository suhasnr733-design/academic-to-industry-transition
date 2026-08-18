// frontend/src/tests/accessibility.test.js

import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { AccessibleModal } from '../components/common/AccessibleModal'
import { Login } from '../pages/auth/Login'

expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  it('Login page should have no accessibility violations', async () => {
    const { container } = render(<Login />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('Modal should have no accessibility violations', async () => {
    const { container } = render(
      <AccessibleModal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </AccessibleModal>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})