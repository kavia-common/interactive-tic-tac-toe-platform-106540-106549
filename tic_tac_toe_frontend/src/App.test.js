import { render, screen } from '@testing-library/react';
import App from './App';

test('renders status bar', () => {
  render(<App />);
  const status = screen.getByRole('status');
  expect(status).toBeInTheDocument();
});
