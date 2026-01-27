import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Filter, X, Search } from 'lucide-react';

export interface FilterState {
  search: string;
  category: string;
  difficulty: string;
  priceRange: [number, number];
  freeOnly: boolean;
  sortBy: string;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories?: string[];
  maxPrice?: number;
}

const defaultFilters: FilterState = {
  search: '',
  category: '',
  difficulty: '',
  priceRange: [0, 1000],
  freeOnly: false,
  sortBy: 'newest',
};

export function AdvancedFilters({
  filters,
  onFiltersChange,
  categories = ['Technology', 'Business', 'Design', 'Marketing', 'Development', 'Data Science'],
  maxPrice = 1000,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFilterCount = [
    filters.category,
    filters.difficulty,
    filters.freeOnly,
    filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice,
  ].filter(Boolean).length;

  const handleReset = () => {
    onFiltersChange({ ...defaultFilters, search: filters.search });
  };

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <Input
          placeholder="Search courses..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-10"
          aria-label="Search courses"
        />
      </div>

      {/* Quick Filters */}
      <Select
        value={filters.category}
        onValueChange={(value) => updateFilter('category', value)}
      >
        <SelectTrigger className="w-full sm:w-[180px]" aria-label="Select category">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat} value={cat}>
              {cat}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.difficulty}
        onValueChange={(value) => updateFilter('difficulty', value)}
      >
        <SelectTrigger className="w-full sm:w-[150px]" aria-label="Select difficulty">
          <SelectValue placeholder="Difficulty" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Levels</SelectItem>
          <SelectItem value="beginner">Beginner</SelectItem>
          <SelectItem value="intermediate">Intermediate</SelectItem>
          <SelectItem value="advanced">Advanced</SelectItem>
        </SelectContent>
      </Select>

      {/* Advanced Filters Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Advanced Filters</SheetTitle>
            <SheetDescription>
              Refine your search with additional filters
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Sort By */}
            <div className="space-y-2">
              <Label htmlFor="sort-by">Sort By</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => updateFilter('sortBy', value)}
              >
                <SelectTrigger id="sort-by">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price Range */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Price Range</Label>
                <span className="text-sm text-muted-foreground">
                  ${filters.priceRange[0]} - ${filters.priceRange[1]}
                </span>
              </div>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => updateFilter('priceRange', value as [number, number])}
                max={maxPrice}
                step={10}
                className="w-full"
                aria-label="Price range slider"
              />
            </div>

            {/* Free Only Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="free-only" className="cursor-pointer">
                Free Courses Only
              </Label>
              <Switch
                id="free-only"
                checked={filters.freeOnly}
                onCheckedChange={(checked) => updateFilter('freeOnly', checked)}
              />
            </div>

            {/* Active Filters Display */}
            {activeFilterCount > 0 && (
              <div className="space-y-2">
                <Label>Active Filters</Label>
                <div className="flex flex-wrap gap-2">
                  {filters.category && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.category}
                      <button
                        onClick={() => updateFilter('category', '')}
                        className="ml-1 hover:text-destructive"
                        aria-label={`Remove ${filters.category} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.difficulty && (
                    <Badge variant="secondary" className="gap-1">
                      {filters.difficulty}
                      <button
                        onClick={() => updateFilter('difficulty', '')}
                        className="ml-1 hover:text-destructive"
                        aria-label={`Remove ${filters.difficulty} filter`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filters.freeOnly && (
                    <Badge variant="secondary" className="gap-1">
                      Free Only
                      <button
                        onClick={() => updateFilter('freeOnly', false)}
                        className="ml-1 hover:text-destructive"
                        aria-label="Remove free only filter"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="gap-2">
            <Button variant="outline" onClick={handleReset}>
              Reset All
            </Button>
            <Button onClick={() => setIsOpen(false)}>
              Apply Filters
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
