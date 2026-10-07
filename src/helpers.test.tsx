import { render } from 'preact';
import { useLayoutEffect, useState } from 'preact/hooks';
import { afterEach, describe, expect, it } from 'vitest';
import { flushSync } from './helpers';

let setCount: (count: number) => void;

const Counter = () => {
  const [count, setState] = useState(0);
  useLayoutEffect(() => {
    setCount = setState;
  }, []);
  return <p>{count}</p>;
};

// No `act`: it renders by itself
const container = document.createElement('div');

afterEach(() => {
  render(null, container);
});

describe('flushSync', () => {
  it('renders the state updates before returning', () => {
    render(<Counter />, container);
    flushSync(() => {
      setCount(1);
    });
    expect(container.textContent).toBe('1');
  });

  it('renders asynchronously outside of flushSync', async () => {
    render(<Counter />, container);
    setCount(2);
    expect(container.textContent).toBe('0');
    await Promise.resolve();
    expect(container.textContent).toBe('2');
  });

  it('renders a component that was already queued for a render', () => {
    render(<Counter />, container);
    setCount(3);
    flushSync(() => {
      setCount(4);
    });
    expect(container.textContent).toBe('4');
  });
});
