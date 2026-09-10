import { useEffect, useRef, useState } from 'react';

/**
 * Measure the element a chart is drawn into.
 *
 * The charts here render at real pixel coordinates rather than into a scaled
 * `viewBox`: a viewBox with `preserveAspectRatio="none"` stretches the labels
 * along with the marks, and the axis text is the part a reader has to be able
 * to read. So the SVG is drawn at whatever width the container currently has,
 * and re-drawn when that changes.
 *
 * Falls back to a sensible width when ResizeObserver is unavailable (the
 * prerender step runs in jsdom), so the first paint is never zero-width.
 */
const useChartSize = (fallbackWidth = 640) => {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallbackWidth);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const measure = () => {
      const next = node.getBoundingClientRect().width;
      if (next > 0) setWidth(next);
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
};

export default useChartSize;
