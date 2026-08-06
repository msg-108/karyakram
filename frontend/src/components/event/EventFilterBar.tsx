import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { EventCategory } from '../../types/event.types';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

export interface EventFilterBarProps {
  categories?: EventCategory[];
  onFilterChange: (filters: { q?: string; category?: string; city?: string }) => void;
}

export const EventFilterBar: React.FC<EventFilterBarProps> = ({
  categories = [],
  onFilterChange,
}) => {
  const [q, setQ] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [city, setCity] = useState('');

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

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    ...categories.map((c) => ({ value: c.slug, label: c.name })),
  ];

  const cityOptions = [
    { value: '', label: 'All Cities' },
    { value: 'Kathmandu', label: 'Kathmandu' },
    { value: 'Pokhara', label: 'Pokhara' },
    { value: 'Lalitpur', label: 'Lalitpur' },
    { value: 'Bhaktapur', label: 'Bhaktapur' },
    { value: 'Chitwan', label: 'Chitwan' },
  ];

  return (
    <form onSubmit={handleSearchSubmit} className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
        {/* Search input */}
        <div className="sm:col-span-5 relative">
          <Input
            placeholder="Search events by title or venue..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-10"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
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
          />
        </div>

        {/* Actions */}
        <div className="sm:col-span-2 flex items-center gap-2">
          <Button type="submit" className="w-full">
            Filter
          </Button>
          {(q || selectedCategory || city) && (
            <Button type="button" variant="outline" onClick={handleReset} className="p-2.5">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
