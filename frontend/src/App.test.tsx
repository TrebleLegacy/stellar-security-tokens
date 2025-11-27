import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

describe('App', () => {
    it('renders without crashing', () => {
        render(<App />);
        // Basic check to see if something rendered. 
        // Since we don't know the exact content of App, we just check if it doesn't throw.
        // Ideally we would check for a specific element, e.g. screen.getByText(/Stellar/i)
        expect(document.body).toBeDefined();
    });
});
