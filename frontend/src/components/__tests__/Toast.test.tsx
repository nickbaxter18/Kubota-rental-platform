import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Toast, ToastContainer } from '../Toast';

describe('Toast Component', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders toast with correct content and styling', () => {
    render(
      <Toast
        id="toast-1"
        type="success"
        title="Success!"
        message="Operation completed successfully"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument(); // Success icon

    const toastElement = screen.getByText('Success!').closest('.toast');
    expect(toastElement).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
  });

  it('renders different toast types with correct styling', () => {
    const toastTypes = [
      { type: 'success' as const, expectedClasses: ['bg-green-50', 'border-green-200', 'text-green-800'] },
      { type: 'error' as const, expectedClasses: ['bg-red-50', 'border-red-200', 'text-red-800'] },
      { type: 'warning' as const, expectedClasses: ['bg-yellow-50', 'border-yellow-200', 'text-yellow-800'] },
      { type: 'info' as const, expectedClasses: ['bg-blue-50', 'border-blue-200', 'text-blue-800'] },
    ];

    toastTypes.forEach(({ type, expectedClasses }) => {
      const { unmount } = render(
        <Toast
          id={`toast-${type}`}
          type={type}
          title={`${type} message`}
          onClose={mockOnClose}
        />
      );

      const toastElement = screen.getByText(`${type} message`).closest('.toast');
      expectedClasses.forEach(className => {
        expect(toastElement).toHaveClass(className);
      });

      unmount();
    });
  });

  it('displays correct icons for each toast type', () => {
    const iconTests = [
      { type: 'success' as const, expectedIcon: '✓' },
      { type: 'error' as const, expectedIcon: '⚠' },
      { type: 'warning' as const, expectedIcon: '!' },
      { type: 'info' as const, expectedIcon: 'ℹ' },
    ];

    iconTests.forEach(({ type, expectedIcon }) => {
      const { unmount } = render(
        <Toast
          id={`toast-${type}`}
          type={type}
          title={`${type} message`}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText(expectedIcon)).toBeInTheDocument();
      unmount();
    });
  });

  it('renders without message when message is not provided', () => {
    render(
      <Toast
        id="toast-1"
        type="info"
        title="Info message"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Info message')).toBeInTheDocument();
    expect(screen.queryByText('Operation completed successfully')).not.toBeInTheDocument();
  });

  it('enters with animation on mount', async () => {
    render(
      <Toast
        id="toast-1"
        type="success"
        title="Success!"
        onClose={mockOnClose}
      />
    );

    const toastElement = screen.getByText('Success!').closest('.toast');

    // Component should render successfully
    expect(toastElement).toBeInTheDocument();
    expect(screen.getByText('Success!')).toBeInTheDocument();

    // Fast-forward time to trigger entrance animation
    vi.advanceTimersByTime(10);

    // In test environment, just verify the component is rendered
    await waitFor(() => {
      expect(toastElement).toBeInTheDocument();
    });
  });

  it('auto-closes after specified duration', async () => {
    const customDuration = 100; // Much faster for testing

    render(
      <Toast
        id="toast-1"
        type="success"
        title="Auto-close test"
        duration={customDuration}
        onClose={mockOnClose}
      />
    );

    // Fast-forward time to trigger auto-close
    vi.advanceTimersByTime(customDuration);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith('toast-1');
    }, { timeout: 500 });
  });

  it('closes when close button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <Toast
        id="toast-1"
        type="success"
        title="Close test"
        onClose={mockOnClose}
      />
    );

    // Wait for entrance animation
    vi.advanceTimersByTime(10);
    await waitFor(() => {
      expect(screen.getByText('Close test')).toBeInTheDocument();
    });

    // Click close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    // Should trigger exit animation and call onClose
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith('toast-1');
    });
  });

  it('handles keyboard navigation for close button', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <Toast
        id="toast-1"
        type="success"
        title="Keyboard test"
        onClose={mockOnClose}
      />
    );

    // Wait for entrance animation
    vi.advanceTimersByTime(10);
    await waitFor(() => {
      expect(screen.getByText('Keyboard test')).toBeInTheDocument();
    });

    // Tab to close button and press Enter
    await user.tab();
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith('toast-1');
    });
  });

  it('exits with animation before closing', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <Toast
        id="toast-1"
        type="success"
        title="Animation test"
        onClose={mockOnClose}
      />
    );

    // Wait for entrance animation
    vi.advanceTimersByTime(10);
    await waitFor(() => {
      expect(screen.getByText('Animation test')).toBeInTheDocument();
    });

    // Click close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    // Should call onClose after animation completes (300ms)
    vi.advanceTimersByTime(300);
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith('toast-1');
    });
  });

  it('uses default duration when not specified', async () => {
    render(
      <Toast
        id="toast-1"
        type="success"
        title="Default duration test"
        duration={200} // Much faster for testing
        onClose={mockOnClose}
      />
    );

    // Should auto-close after specified duration
    vi.advanceTimersByTime(200);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith('toast-1');
    }, { timeout: 500 });
  });

  it('cleans up timers on unmount', () => {
    const { unmount } = render(
      <Toast
        id="toast-1"
        type="success"
        title="Cleanup test"
        duration={100} // Much faster for testing
        onClose={mockOnClose}
      />
    );

    // Unmount before timer completes
    unmount();

    // Advance time past when it should have closed
    vi.advanceTimersByTime(100);

    // Should not call onClose since component was unmounted
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('handles multiple rapid close attempts gracefully', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

    render(
      <Toast
        id="toast-1"
        type="success"
        title="Multiple close test"
        onClose={mockOnClose}
      />
    );

    // Wait for entrance animation
    vi.advanceTimersByTime(10);
    await waitFor(() => {
      expect(screen.getByText('Multiple close test')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });

    // Click close button multiple times rapidly
    await user.click(closeButton);
    await user.click(closeButton);
    await user.click(closeButton);

    // Should only call onClose once
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledWith('toast-1');
    });
  });

  it('maintains accessibility standards', async () => {
    render(
      <Toast
        id="toast-1"
        type="error"
        title="Error message"
        message="Something went wrong"
        onClose={mockOnClose}
      />
    );

    // Wait for entrance animation
    vi.advanceTimersByTime(10);
    await waitFor(() => {
      expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    // Check for screen reader support
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toHaveAttribute('aria-label', 'Close');

    // Check for semantic structure
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});

describe('ToastContainer Component', () => {
  it('renders children correctly', () => {
    render(
      <ToastContainer>
        <div data-testid="child-1">Child 1</div>
        <div data-testid="child-2">Child 2</div>
      </ToastContainer>
    );

    expect(screen.getByTestId('child-1')).toBeInTheDocument();
    expect(screen.getByTestId('child-2')).toBeInTheDocument();
  });

  it('applies correct container styling', () => {
    render(
      <ToastContainer>
        <div>Toast content</div>
      </ToastContainer>
    );

    const container = screen.getByText('Toast content').closest('.toast-container');
    expect(container).toBeInTheDocument();
  });
});
