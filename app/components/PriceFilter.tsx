import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from '@remix-run/react';

export function PriceFilter() {
  const navigate = useNavigate();
  const location = useLocation();
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setMinPrice('');
    setMaxPrice('');
    setIsOpen(false);
    
    const params = new URLSearchParams(location.search);
    if (params.has('minPrice') || params.has('maxPrice')) {
      params.delete('minPrice');
      params.delete('maxPrice');
      navigate(`${location.pathname}?${params.toString()}`, { replace: true });
    }
  }, []);

  const handleFilter = () => {

    const min = parseFloat(minPrice);
    const max = parseFloat(maxPrice);

    if (isNaN(min) || isNaN(max)) {
      alert('Please enter valid numbers for price range');
      return;
    }

    if (min > max) {
      alert('Minimum price cannot be greater than maximum price');
      return;
    }

    if (min < 0 || max < 0) {
      alert('Prices cannot be negative');
      return;
    }

    const params = new URLSearchParams(location.search);
    params.set('minPrice', minPrice);
    params.set('maxPrice', maxPrice);
    navigate(`${location.pathname}?${params.toString()}`);
  };

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-lg font-medium mb-4"
      >
        <span>Filter</span>
        <span className="text-sm">{isOpen ? '▼' : '▶'}</span>
      </button>

      {isOpen && (
        <div className="bg-white p-4 border rounded-lg shadow-sm max-w-sm">
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label htmlFor="minPrice" className="block text-sm text-gray-600">
                  Min Price ($)
                </label>
                <input
                  type="number"
                  id="minPrice"
                  value={minPrice}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-black focus:ring-black"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="maxPrice" className="block text-sm text-gray-600">
                  Max Price ($)
                </label>
                <input
                  type="number"
                  id="maxPrice"
                  value={maxPrice}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 focus:border-black focus:ring-black"
                />
              </div>
            </div>
            <button
              onClick={handleFilter}
              className="w-full bg-black text-white py-2 px-4 text-sm rounded-md hover:bg-gray-800 transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 