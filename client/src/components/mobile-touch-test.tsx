
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function MobileTouchTest() {
  const [touchCount, setTouchCount] = useState(0);
  
  const handleTouch = () => {
    setTouchCount(prev => prev + 1);
    console.log('Touch detected:', touchCount + 1);
  };
  
  return (
    <div className="p-4 bg-red-100 border border-red-300 rounded">
      <p>Teste de Toque Mobile: {touchCount}</p>
      <Button onClick={handleTouch} className="mt-2">
        Clique para testar ({touchCount})
      </Button>
    </div>
  );
}
