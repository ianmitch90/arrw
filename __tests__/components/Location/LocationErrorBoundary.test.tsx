import { render, fireEvent } from '@testing-library/react';
import { LocationErrorBoundary } from '@/components/ui/Location/LocationErrorBoundary';
import { LocationError } from '@/utils/location-error-handling';

describe('LocationErrorBoundary', () => {
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('renders children when there is no error', () => {
    const { getByText } = render(
      <LocationErrorBoundary>
        <div>Test Content</div>
      </LocationErrorBoundary>
    );

    expect(getByText('Test Content')).toBeInTheDocument();
  });

  it('renders error UI when there is a location error', () => {
    const ThrowError = () => {
      throw new LocationError('Test location error', 'TEST_ERROR');
    };

    const { getByText } = render(
      <LocationErrorBoundary>
        <ThrowError />
      </LocationErrorBoundary>
    );

    expect(getByText('Location Error')).toBeInTheDocument();
    expect(getByText('Test location error')).toBeInTheDocument();
  });

  it('allows retry when error occurs', () => {
    const ThrowError = () => {
      throw new LocationError('Test location error', 'TEST_ERROR');
    };

    const { getByText } = render(
      <LocationErrorBoundary>
        <ThrowError />
      </LocationErrorBoundary>
    );

    const reloadSpy = jest.spyOn(window.location, 'reload');
    fireEvent.click(getByText('Try Again'));

    expect(reloadSpy).toHaveBeenCalled();
  });
});
