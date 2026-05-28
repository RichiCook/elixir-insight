import { useEffect } from 'react';
import { Building2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useBrands } from '@/hooks/useBrands';
import { useBrandStore } from '@/stores/brandStore';

export function BrandSwitcher() {
  const { data: brands = [] } = useBrands();
  const { activeBrand, setActiveBrand } = useBrandStore();

  // Auto-select the first brand if none is active
  useEffect(() => {
    if (!activeBrand && brands.length > 0) {
      setActiveBrand(brands[0]);
    }
  }, [brands, activeBrand, setActiveBrand]);

  if (brands.length === 0) return null;

  // Single brand — just show the name, no switcher UI needed
  if (brands.length === 1) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Building2 className="w-3.5 h-3.5" />
        <span>{activeBrand?.name ?? brands[0].name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 font-normal h-8">
          <Building2 className="w-3.5 h-3.5 shrink-0" />
          <span className="max-w-[140px] truncate">
            {activeBrand?.name ?? 'Select brand'}
          </span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Switch brand</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {brands.map((brand) => (
          <DropdownMenuItem
            key={brand.id}
            onClick={() => setActiveBrand(brand)}
            className="gap-2 cursor-pointer"
          >
            {brand.primary_color && (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: brand.primary_color }}
              />
            )}
            <span className="truncate">{brand.name}</span>
            {activeBrand?.id === brand.id && (
              <span className="ml-auto text-xs text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
