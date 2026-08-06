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

  const handleQueryChange = (val: string) => {
    setQ(val);
    onFilterChange({ q: val, category: selectedCategory, city });
  };

  return (
    <form onSubmit={handleSearchSubmit} className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-4 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search input */}
        <div className="sm:col-span-5 relative">
          <Input
            placeholder="Search events by title, venue, or artist..."
            value={q}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-11 bg-slate-950/80 border-slate-800 text-white placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-indigo-400 absolute left-4 top-4 pointer-events-none" />
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
            className="bg-slate-950/80 border-slate-800 text-white"
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
            className="bg-slate-950/80 border-slate-800 text-white"
          />
        </div>

        {/* Actions */}
        <div className="sm:col-span-2 flex items-center gap-2">
          <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 shadow-md shadow-indigo-600/20">
            Search
          </Button>
          {(q || selectedCategory || city) && (
            <Button type="button" variant="outline" onClick={handleReset} className="p-3 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};
