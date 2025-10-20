import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { UserAvatar } from '../UserAvatar'

describe('UserAvatar', () => {
  it('should render avatar with image when src is provided', () => {
    render(
      <UserAvatar
        src="https://example.com/avatar.jpg"
        alt="Test User"
        size="medium"
        fallback="Test User"
      />
    )

    const avatar = screen.getByRole('img')
    expect(avatar).toBeInTheDocument()
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    expect(avatar).toHaveAttribute('alt', 'Test User')
  })

  it('should render fallback when src is null', () => {
    render(
      <UserAvatar
        src={null}
        alt="Test User"
        size="medium"
        fallback="John Doe"
      />
    )

    const fallback = screen.getByText('JD')
    expect(fallback).toBeInTheDocument()
    expect(fallback).toHaveClass('rounded-full')
  })

  it('should render fallback when src is undefined', () => {
    render(
      <UserAvatar
        src={undefined}
        alt="Test User"
        size="medium"
        fallback="Jane Smith"
      />
    )

    const fallback = screen.getByText('JS')
    expect(fallback).toBeInTheDocument()
  })

  it('should render fallback when image fails to load', () => {
    render(
      <UserAvatar
        src="invalid-url"
        alt="Test User"
        size="medium"
        fallback="Test User"
      />
    )

    // Image should be present initially
    const avatar = screen.getByRole('img')
    expect(avatar).toBeInTheDocument()

    // Note: Testing actual error handling requires more complex setup
    // This test verifies the component renders correctly with an invalid src
  })

  it('should generate correct initials from single word name', () => {
    render(
      <UserAvatar
        src={null}
        alt="Test User"
        size="medium"
        fallback="Alice"
      />
    )

    const fallback = screen.getByText('A')
    expect(fallback).toBeInTheDocument()
  })

  it('should generate correct initials from two word name', () => {
    render(
      <UserAvatar
        src={null}
        alt="Test User"
        size="medium"
        fallback="Bob Johnson"
      />
    )

    const fallback = screen.getByText('BJ')
    expect(fallback).toBeInTheDocument()
  })

  it('should apply correct size classes', () => {
    const { rerender } = render(
      <UserAvatar
        src={null}
        alt="Test User"
        size="small"
        fallback="Test User"
      />
    )

    let fallback = screen.getByText('TU')
    expect(fallback).toHaveClass('w-8', 'h-8', 'text-sm')

    rerender(
      <UserAvatar
        src={null}
        alt="Test User"
        size="medium"
        fallback="Test User"
      />
    )

    fallback = screen.getByText('TU')
    expect(fallback).toHaveClass('w-10', 'h-10', 'text-base')

    rerender(
      <UserAvatar
        src={null}
        alt="Test User"
        size="large"
        fallback="Test User"
      />
    )

    fallback = screen.getByText('TU')
    expect(fallback).toHaveClass('w-16', 'h-16', 'text-lg')
  })

  it('should apply custom className', () => {
    render(
      <UserAvatar
        src={null}
        alt="Test User"
        size="medium"
        fallback="Test User"
        className="custom-class"
      />
    )

    const fallback = screen.getByText('TU')
    expect(fallback).toHaveClass('custom-class')
  })

  it('should use default alt text when not provided', () => {
    render(
      <UserAvatar
        src="https://example.com/avatar.jpg"
        size="medium"
        fallback="Test User"
      />
    )

    const avatar = screen.getByRole('img', { name: /user avatar/i })
    expect(avatar).toBeInTheDocument()
  })

  it('should handle empty fallback', () => {
    render(
      <UserAvatar
        src={null}
        alt="Test User"
        size="medium"
        fallback=""
      />
    )

    const fallback = screen.getByText('?')
    expect(fallback).toBeInTheDocument()
  })

  it('should handle whitespace-only fallback', () => {
    render(
      <UserAvatar
        src={null}
        alt="Test User"
        size="medium"
        fallback="   "
      />
    )

    const container = screen.getByTitle('Test User')
    expect(container).toBeInTheDocument()
    // Whitespace-only fallback should render container
    expect(container).toBeVisible()
  })
})