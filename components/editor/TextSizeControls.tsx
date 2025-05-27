'use client';

import { useState, useEffect } from 'react';

export default function TextSizeControls() {
  const [textSize, setTextSize] = useState<number>(100);

  // Aplicar el tamaño de texto al elemento raíz
  useEffect(() => {
    document.documentElement.style.setProperty('--text-base-size', `${textSize / 100 * 1.18}rem`);
  }, [textSize]);

  const decreaseSize = () => {
    if (textSize > 80) {
      setTextSize(textSize - 10);
    }
  };

  const increaseSize = () => {
    if (textSize < 150) {
      setTextSize(textSize + 10);
    }
  };

  const resetSize = () => {
    setTextSize(100);
  };

  return (
    <div className="text-size-controls" aria-label="Controles de tamaño de texto">
      <button 
        onClick={decreaseSize} 
        aria-label="Disminuir tamaño de texto"
        disabled={textSize <= 80}
      >
        A-
      </button>
      <button 
        onClick={resetSize} 
        aria-label="Restablecer tamaño de texto"
      >
        A
      </button>
      <button 
        onClick={increaseSize} 
        aria-label="Aumentar tamaño de texto"
        disabled={textSize >= 150}
      >
        A+
      </button>
    </div>
  );
}