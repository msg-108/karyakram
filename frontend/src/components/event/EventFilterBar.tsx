import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { EventCategory } from '../../types/event.types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

export interface EventFilterBarProps {
  categories?: EventCategory[];
  initialQ?: string;
  initialCategory?: string;
  initialCity?: string;
  onFilterChange: (filters: { q?: string; category?: string; city?: string }) => void;
}

export const EventFilterBar: React.FC<EventFilterBarProps> = ({
  categories = [],
  initialQ = '',
  initialCategory = '',
  initialCity = '',
  onFilterChange,
}) => {
  const [q, setQ] = useState(initialQ);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [city, setCity] = useState(initialCity);

  useEffect(() => {
    setQ(initialQ);
    setSelectedCategory(initialCategory);
    setCity(initialCity);
  }, [initialQ, initialCategory, initialCity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ q, category: selectedCategory, city });
  };

  const handleReset = () => {
    setQ('');
    setSelectedCategory('');
    setCity('');
    onFilterChange({});
  };

  const categoriesList = Array.isArray(categories)
    ? categories
    : (categories as any)?.results || [];

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categoriesList.map((c: any) => ({ value: c.slug, label: c.name })),
  ];

  const cityOptions = [
    { value: '', label: 'All Cities' },
    { value: 'Kathmandu', label: 'Kathmandu' },
    { value: 'Pokhara', label: 'Pokhara' },
    { value: 'Lalitpur', label: 'Lalitpur' },
    { value: 'Bhaktapur', label: 'Bhaktapur' },
    { value: 'Chitwan', label: 'Chitwan' },
  ];

  const handleQueryChange = (val: string) => {
    setQ(val);
    onFilterChange({ q: val, category: selectedCategory, city });
  };

  return (
    <form onSubmit={handleSearchSubmit} className="bg-[#F3F4F6] border border-slate-300 p-5 rounded-2xl shadow-md space-y-4 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search input */}
        <div className="sm:col-span-5 relative">
          <Input
            placeholder="Search events by title, venue, or artist..."
            value={q}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-11 font-medium"
          />
          <Search className="w-4 h-4 text-karyakram-purple-600 absolute left-4 top-4 pointer-events-none" />
        </div>

        {/* Category select */}
        <div className="sm:col-span-3">
          <Select
            options={categoryOptions}
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              onFilterChange({ q, category: e.target.value, city });
            }}
            className="font-medium"
          />
        </div>

        {/* City select */}
        <div className="sm:col-span-2">
          <Select
            options={cityOptions}
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              onFilterChange({ q, category: selectedCategory, city: e.target.value });
            }}
            className="font-medium"
          />
        </div>

        {/* Actions */}
        <div className="sm:col-span-2 flex items-center gap-2">
          <Button type="submit" className="w-full border-0 shadow-md">
            Search
          </Button>
          {(q || selectedCategory || city) && (
            <Button type="button" variant="outline" onClick={handleReset} className="p-3">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
