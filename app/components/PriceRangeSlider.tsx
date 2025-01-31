import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export interface PriceRangeSliderProps {
  minPrice: number;
  maxPrice: number;
  onPriceChange: (min: number, max: number) => void;
}

export default function PriceRangeSlider({ minPrice, maxPrice, onPriceChange }: PriceRangeSliderProps) {
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);
  const [isOpen, setIsOpen] = useState(true);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.min(Number(e.target.value), localMax);
    setLocalMin(value);
    onPriceChange(value, localMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(Number(e.target.value), localMin);
    setLocalMax(value);
    onPriceChange(localMin, value);
  };

  return (
    <div className="mb-8 p-4 border rounded-lg w-72">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-lg font-semibold mb-4"
      >
        <span>Price Range Filter</span>
        {isOpen ? (
          <ChevronUpIcon className="h-5 w-5" />
        ) : (
          <ChevronDownIcon className="h-5 w-5" />
        )}
      </button>
      
      {isOpen && (
        <>
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <span className="mr-2">$</span>
              <input
                type="number"
                value={localMin}
                onChange={handleMinChange}
                min={0}
                max={maxPrice}
                className="w-20 px-2 py-1 border rounded"
              />
            </div>
            <span>to</span>
            <div className="flex items-center">
              <span className="mr-2">$</span>
              <input
                type="number"
                value={localMax}
                onChange={handleMaxChange}
                min={minPrice}
                className="w-20 px-2 py-1 border rounded"
              />
            </div>
          </div>
          <div className="mt-4">
            <input
              type="range"
              min={0}
              max={maxPrice}
              value={localMin}
              onChange={handleMinChange}
              className="w-full"
            />
            <input
              type="range"
              min={minPrice}
              max={maxPrice}
              value={localMax}
              onChange={handleMaxChange}
              className="w-full"
            />
          </div>
        </>
      )}
    </div>
  );
} 