// components/PageTransition.jsx
import { useEffect, useRef } from 'react';

const PageTransition = ({ children }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Scroll to top of the container or focus it
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="animate-fadeUp opacity-0"
    >
      {children}
    </div>
  );
};

export default PageTransition;
