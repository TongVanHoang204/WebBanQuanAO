import { useState, useEffect } from 'react';
import { ProductVariant } from '../../types';

interface VariantSelectorProps {
  variants: ProductVariant[];
  onVariantSelect: (variant: ProductVariant | null) => void;
  selectedVariant: ProductVariant | null;
}

interface OptionGroup {
  code: string;
  name: string;
  values: { value: string; available: boolean }[];
}

export default function VariantSelector({ 
  variants, 
  onVariantSelect,
  selectedVariant 
}: VariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  // Extract unique option groups from variants
  const optionGroups: OptionGroup[] = (() => {
    const groups: Record<string, { name: string; values: Set<string> }> = {};
    
    variants.forEach(variant => {
      variant.variant_option_values?.forEach(vov => {
        const code = vov.option_value.option?.code || '';
        const name = vov.option_value.option?.name || '';
        const value = vov.option_value.value;
        
        if (!groups[code]) {
          groups[code] = { name, values: new Set() };
        }
        groups[code].values.add(value);
      });
    });

    return Object.entries(groups).map(([code, { name, values }]) => ({
      code,
      name,
      values: Array.from(values).map(value => ({
        value,
        available: isValueAvailable(code, value)
      }))
    }));
  })();

  // Check if a value is available given current selections
  function isValueAvailable(optionCode: string, value: string): boolean {
    const testSelections = { ...selectedOptions, [optionCode]: value };
    
    return variants.some(variant => {
      if (!variant.is_active || variant.stock_qty <= 0) return false;
      
      return Object.entries(testSelections).every(([code, selectedValue]) => {
        return variant.variant_option_values?.some(vov => 
          vov.option_value.option?.code === code && 
          vov.option_value.value === selectedValue
        );
      });
    });
  }

  // Find matching variant based on selections
  function findVariant(selections: Record<string, string>): ProductVariant | null {
    const selectionCount = Object.keys(selections).length;
    const requiredCount = optionGroups.length;
    
    if (selectionCount !== requiredCount) return null;

    return variants.find(variant => {
      if (!variant.is_active) return false;
      
      return Object.entries(selections).every(([code, selectedValue]) => {
        return variant.variant_option_values?.some(vov => 
          vov.option_value.option?.code === code && 
          vov.option_value.value === selectedValue
        );
      });
    }) || null;
  }

  // Handle option selection
  const handleOptionSelect = (optionCode: string, value: string) => {
    const newSelections = { ...selectedOptions, [optionCode]: value };
    setSelectedOptions(newSelections);
    
    const matchingVariant = findVariant(newSelections);
    onVariantSelect(matchingVariant);
  };

  // Auto-select first available options on mount
  useEffect(() => {
    if (optionGroups.length > 0 && Object.keys(selectedOptions).length === 0) {
      const initialSelections: Record<string, string> = {};
      
      optionGroups.forEach(group => {
        const availableValue = group.values.find(v => v.available);
        if (availableValue) {
          initialSelections[group.code] = availableValue.value;
        }
      });
      
      setSelectedOptions(initialSelections);
      const matchingVariant = findVariant(initialSelections);
      onVariantSelect(matchingVariant);
    }
  }, [variants]);

  if (optionGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {optionGroups.map(group => (
        <div key={group.code}>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-bold text-secondary-900 uppercase tracking-wider">
              {(() => {
                const code = group.code.toLowerCase();
                 // Normalize name for checking
                const name = group.name.toLowerCase();
                
                if (code === 'color' || code.includes('mau') || name.includes('màu')) return 'Màu sắc';
                if (code === 'size' || code.includes('kich') || name.includes('kích') || name.includes('size')) return 'Kích cỡ';
                if (code === 'material' || name.includes('chất liệu')) return 'Chất liệu';
                if (code === 'style' || name.includes('kiểu')) return 'Kiểu dáng';
                
                return group.name;
              })()}: <span className="font-normal text-secondary-500 normal-case ml-1">{selectedOptions[group.code]}</span>
            </label>
            {/size|kích|kich/i.test(group.code) || /size|kích|kich/i.test(group.name) ? (
              <button className="text-xs font-semibold text-secondary-600 hover:text-secondary-900 hover:underline">Hướng dẫn chọn size</button>
            ) : null}
          </div>
          
          <div className="flex flex-wrap gap-3">
            {group.values.map(({ value, available }) => {
              const isSelected = selectedOptions[group.code] === value;
              const isColor = group.code === 'color';
              
              if (isColor) {
                const colorMap: Record<string, string> = {
                  'Đen': '#111827',
                  'Trắng': '#FFFFFF',
                  'Xám': '#9CA3AF',
                  'Navy': '#1E3A8A',
                  'Be': '#F5F5DC',
                  'Đỏ': '#EF4444',
                  'Hồng': '#FBCFE8',
                  'Xanh lá': '#10B981',
                  'Vàng': '#F59E0B',
                };
                const bgColor = colorMap[value] || '#E5E7EB';
                
                return (
                  <button
                    key={value}
                    onClick={() => handleOptionSelect(group.code, value)}
                    disabled={!available}
                    className={`w-10 h-10 rounded-full border-2 transition-all relative p-0.5 ${
                      isSelected 
                        ? 'border-primary-600 ring-2 ring-primary-100' 
                        : 'border-transparent hover:border-secondary-300'
                    } ${!available ? 'opacity-30 cursor-not-allowed' : ''}`}
                    title={value}
                  >
                    <span 
                      className="block w-full h-full rounded-full border border-secondary-200"
                      style={{ backgroundColor: bgColor }}
                    />
                    {!available && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-full h-0.5 bg-secondary-400 rotate-45 absolute opacity-60" />
                      </span>
                    )}
                  </button>
                );
              }
              
              return (
                <button
                  key={value}
                  onClick={() => handleOptionSelect(group.code, value)}
                  disabled={!available}
                  className={`min-w-[80px] px-4 py-2.5 rounded-lg border-2 font-medium text-sm transition-all ${
                    isSelected 
                      ? 'border-primary-600 bg-primary-50 text-primary-700' 
                      : 'border-secondary-200 bg-white text-secondary-600 hover:border-secondary-400'
                  } ${!available ? 'opacity-40 cursor-not-allowed line-through' : ''}`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
