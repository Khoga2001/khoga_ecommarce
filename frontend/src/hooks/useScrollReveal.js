import { useEffect, useRef, useState } from 'react';

export function useScrollReveal(options = { threshold: 0.1, rootMargin: '50px' }) {
  const ref = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    
    // Check if browser supports native CSS view() timeline (Chrome 115+, Safari 26+)
    const supportsViewTimeline = typeof CSS !== 'undefined' && 
      CSS.supports('(animation-timeline: view())');
      
    if (supportsViewTimeline) {
      // If native is supported, we just let CSS handle it via class
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(entry.target);
        }
      });
    }, options);

    observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [options.threshold, options.rootMargin]);

  return { ref, isRevealed };
}
