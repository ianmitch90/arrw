import React from 'react';
import { render, screen } from '@testing-library/react';
import MapView from '../../map/MapView';

describe('MapView', () => {
  it('renders the map container', () => {
    render(
      <MapView
        initialLocation={[37.7749, -122.4194]}
        onLocationChange={jest.fn()}
      />
    );
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });
});
