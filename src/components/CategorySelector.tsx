import React from 'react';
import { Check, Tag as TagIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Category } from '../types';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory?: Category | null;
  onCategoryChange: (category: Category | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  onCategoryChange,
  disabled = false,
  placeholder = 'Selecionar categoria...',
}) => {
  const getCategoryColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      red: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      orange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      pink: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400',
      gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    return colorMap[color] || colorMap.gray;
  };

  const handleValueChange = (value: string) => {
    if (value === 'none') {
      onCategoryChange(null);
    } else {
      const category = categories.find((c) => c.id === value);
      if (category) {
        onCategoryChange(category);
      }
    }
  };

  return (
    <Select
      value={selectedCategory?.id || 'none'}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue>
          {selectedCategory ? (
            <div className="flex items-center gap-2">
              {selectedCategory.icon && (
                <span className="text-lg">{selectedCategory.icon}</span>
              )}
              <Badge className={cn('text-xs', getCategoryColorClasses(selectedCategory.color))}>
                {selectedCategory.name}
              </Badge>
              {selectedCategory.isSystem && (
                <span className="text-xs text-muted-foreground">(Sistema)</span>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <div className="flex items-center gap-2">
            <TagIcon className="h-4 w-4" />
            <span className="text-muted-foreground">Sem categoria</span>
          </div>
        </SelectItem>
        {categories.length > 0 && (
          <>
            {categories
              .filter((c) => c.isSystem)
              .map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    {category.icon && <span className="text-base">{category.icon}</span>}
                    <Badge className={cn('text-xs', getCategoryColorClasses(category.color))}>
                      {category.name}
                    </Badge>
                    <span className="text-xs text-muted-foreground">(Sistema)</span>
                  </div>
                </SelectItem>
              ))}
            {categories.filter((c) => c.isSystem).length > 0 &&
              categories.filter((c) => !c.isSystem).length > 0 && (
                <div className="border-t my-1" />
              )}
            {categories
              .filter((c) => !c.isSystem)
              .map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center gap-2">
                    {category.icon && <span className="text-base">{category.icon}</span>}
                    <Badge className={cn('text-xs', getCategoryColorClasses(category.color))}>
                      {category.name}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
          </>
        )}
        {categories.length === 0 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma categoria disponível
          </div>
        )}
      </SelectContent>
    </Select>
  );
};

export default CategorySelector;
