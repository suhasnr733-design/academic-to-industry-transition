// frontend/src/tests/components/AnimatedButton.test.jsx

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AnimatedButton } from '../../components/animations/Interactions'

describe('AnimatedButton', () => {
  it('renders children', () => {
    render(<AnimatedButton>Click me</AnimatedButton>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<AnimatedButton onClick={handleClick}>Click me</AnimatedButton>)
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies hover animations', () => {
    const { container } = render(<AnimatedButton>Click me</AnimatedButton>)
    const button = container.firstChild
    expect(button).toHaveStyle({ transform: 'scale(1)' })
  })
})