import { describe, it, expect } from 'vitest';
import { isPosNavLocked, isPosSafePath } from './pos-nav-lock';

describe('isPosSafePath', () => {
  it('allows only POS routes', () => {
    expect(isPosSafePath('/pos')).toBe(true);
    expect(isPosSafePath('/pos/')).toBe(true);
    expect(isPosSafePath('/products')).toBe(false);
    expect(isPosSafePath('/dashboard')).toBe(false);
  });
});

describe('isPosNavLocked', () => {
  it('locks only while on POS and the API is down', () => {
    expect(isPosNavLocked('/pos', false)).toBe(true);
    expect(isPosNavLocked('/pos', true)).toBe(false);
    expect(isPosNavLocked('/products', false)).toBe(false);
    expect(isPosNavLocked('/dashboard', false)).toBe(false);
    expect(isPosNavLocked(null, false)).toBe(false);
  });
});
