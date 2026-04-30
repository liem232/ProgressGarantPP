import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

const AgeVerification: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const ageVerified = localStorage.getItem('ageVerified');
    if (!ageVerified) {
      setIsOpen(true);
    }
  }, []);

  const handleYes = () => {
    localStorage.setItem('ageVerified', 'true');
    setIsOpen(false);
  };

  const handleNo = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
        <h2 className="text-lg font-semibold text-center mb-1">
          Вам есть 18 лет?
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Сайт содержит информацию о табачной продукции
        </p>

        <div className="flex gap-3">
          <Button
            onClick={handleNo}
            variant="outline"
            className="flex-1 h-10"
          >
            Нет
          </Button>
          <Button
            onClick={handleYes}
            className="flex-1 h-10 bg-primary"
          >
            Да
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgeVerification;
