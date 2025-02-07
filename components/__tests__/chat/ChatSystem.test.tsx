import { render, screen } from '@testing-library/react';
import ChatSystem from '../../chat/ChatSystem';

describe('ChatSystem', () => {
  test('displays loading state', () => {
    render(<ChatSystem />);
    expect(screen.getByText('Loading messages...')).toBeInTheDocument();
  });
});
