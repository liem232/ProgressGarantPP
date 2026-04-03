import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';

const ScrollToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      aria-hidden={!visible}
      className={`fixed left-4 bottom-4 sm:left-6 sm:bottom-6 z-40 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <Button
        onClick={scrollTop}
        className="h-11 w-11 p-0 rounded-full shadow-button"
        variant="default"
        size="icon"
        aria-label="Наверх"
      >
        <ArrowUp className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ScrollToTop;
