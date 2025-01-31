import { useState } from 'react';

export type SortDirection = 'ASC' | 'DESC';

interface PriceSortDropdownProps {
  onSortChange: (direction: SortDirection) => void;
  currentSort: SortDirection;
}

export default function PriceSortDropdown({ onSortChange, currentSort }: PriceSortDropdownProps) {
  return (
    <div className="mb-8 max-w-xs">
      <label htmlFor="price-sort" className="block text-sm font-medium text-gray-700 mb-2">
        Sort by Price
      </label>
      <select
        id="price-sort"
        value={currentSort}
        onChange={(e) => onSortChange(e.target.value as SortDirection)}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="ASC">Price: Low to High</option>
        <option value="DESC">Price: High to Low</option>
      </select>
    </div>
  );
} 