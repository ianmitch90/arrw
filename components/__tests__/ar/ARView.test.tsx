import { render } from '@testing-library/react';
import ARView from '../../ar/ARView';

describe('ARView', () => {
  test('renders AR canvas', () => {
    const { container } = render(<ARView />);
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
});
