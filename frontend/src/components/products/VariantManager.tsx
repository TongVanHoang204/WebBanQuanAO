
import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';

interface Option {
  id: string;
  name: string; // e.g. "Color"
  values: string[]; // e.g. ["Red", "Blue"]
}

interface Variant {
  id: string;
  name: string; // "Red / S"
  sku: string;
  price: number | '';
  stock: number | '';
  options: Record<string, string>; // { "Color": "Red", "Size": "S" }
}

interface VariantManagerProps {
  variants: Variant[];
  setVariants: (variants: Variant[]) => void;
  options: Option[];
  setOptions: (options: Option[]) => void;
}

export default function VariantManager({ variants, setVariants, options, setOptions }: VariantManagerProps) {
  const [newOptionName, setNewOptionName] = useState('');
  
  // Bulk Edit State
  const [bulkPrice, setBulkPrice] = useState<string>('');
  const [bulkStock, setBulkStock] = useState<string>('');

  // Add a new Option (Attribute)
  const addOption = () => {
    if (!newOptionName.trim()) return;
    const newOption: Option = {
      id: Date.now().toString(),
      name: newOptionName,
      values: []
    };
    setOptions([...options, newOption]);
    setNewOptionName('');
  };

  // Remove an Option
  const removeOption = (id: string) => {
    setOptions(options.filter(opt => opt.id !== id));
    // Regenerate would clear variants, so we might want to keep robust logic
    // For simplicity, re-trigger generate
    // Note: Removing an option technically invalidates current variants structure
    // We should probably clear variants or try to map.
    // For now: clear variants to force regeneration/setup
    setVariants([]);
  };

  // Add a Value to an Option
  const addValue = (optionId: string, value: string) => {
    if (!value.trim()) return;
    const updatedOptions = options.map(opt => {
      if (opt.id === optionId && !opt.values.includes(value)) {
        return { ...opt, values: [...opt.values, value] };
      }
      return opt;
    });
    setOptions(updatedOptions);
    generateVariants(updatedOptions);
  };

  // Remove a Value from an Option
  const removeValue = (optionId: string, valueToRemove: string) => {
    const updatedOptions = options.map(opt => {
      if (opt.id === optionId) {
        return { ...opt, values: opt.values.filter(v => v !== valueToRemove) };
      }
      return opt;
    });
    setOptions(updatedOptions);
    generateVariants(updatedOptions);
  };

  // Cartesian Product to generate Variants
  const generateVariants = (currentOptions: Option[]) => {
    const validOptions = currentOptions.filter(opt => opt.values.length > 0);
    if (validOptions.length === 0) {
      setVariants([]);
      return;
    }

    const combine = (index: number, current: Record<string, string>): any[] => {
      if (index === validOptions.length) {
        return [current];
      }
      const option = validOptions[index];
      let results: any[] = [];
      option.values.forEach(val => {
        results = results.concat(combine(index + 1, { ...current, [option.name]: val }));
      });
      return results;
    };

    const combinations = combine(0, {});
    
    // Map combinations to Variant objects
    const newVariants: Variant[] = combinations.map((combo, idx) => {
      const name = Object.values(combo).join(' / ');
      const existing = variants.find(v => v.name === name);
      // Keep existing data if name matches, else default
      return existing ? { ...existing, options: combo } : {
        id: `var-${Date.now()}-${idx}`,
        name,
        sku: `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`, // Auto-gen SKU suggestion
        price: '',
        stock: 0,
        options: combo
      };
    });

    setVariants(newVariants);
  };

  const applyBulkPrice = () => {
    if (!bulkPrice) return;
    setVariants(variants.map(v => ({ ...v, price: parseFloat(bulkPrice) })));
  };

  const applyBulkStock = () => {
    if (!bulkStock) return;
    setVariants(variants.map(v => ({ ...v, stock: parseInt(bulkStock) })));
  };

  return (
    <div className="space-y-8">
      {/* 1. Attributes Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">1</span>
          Thuộc tính & Tùy chọn
        </h3>
        
        <div className="space-y-4">
          {options.map(opt => (
            <div key={opt.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 transition-all hover:border-primary-200">
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-gray-900">{opt.name}</span>
                <button 
                    onClick={() => removeOption(opt.id)} 
                    className="text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {opt.values.map(val => (
                  <span key={val} className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 shadow-sm">
                    {val}
                    <button 
                        onClick={() => removeValue(opt.id, val)} 
                        className="ml-2 text-gray-400 hover:text-red-500 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="relative">
                 <input 
                   type="text" 
                   placeholder={`Thêm giá trị cho ${opt.name} và nhấn Enter...`}
                   className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       e.preventDefault();
                       addValue(opt.id, e.currentTarget.value);
                       e.currentTarget.value = '';
                     }
                   }}
                 />
              </div>
            </div>
          ))}
          
          <div className="flex gap-3 items-center pt-2">
             <input 
               type="text" 
               placeholder="Tên thuộc tính (VD: Màu sắc, Size)"
               value={newOptionName}
               onChange={(e) => setNewOptionName(e.target.value)}
               className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
               onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                    e.preventDefault();
                    addOption();
                 }
               }}
             />
             <button 
               type="button" 
               onClick={addOption}
               disabled={!newOptionName.trim()}
               className="px-4 py-2 font-medium text-white bg-secondary-900 hover:bg-black rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
             >
               <Plus className="w-4 h-4" />
               Thêm thuộc tính
             </button>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center mt-3">
             <span className="text-sm text-gray-500 mr-2">Gợi ý nhanh:</span>
             {['Màu sắc', 'Kích cỡ', 'Chất liệu', 'Kiểu dáng'].map(name => (
               <button
                 key={name}
                 type="button"
                 onClick={() => {
                    if (!options.some(o => o.name.toLowerCase() === name.toLowerCase())) {
                       const newOption: Option = {
                         id: Date.now().toString(),
                         name: name,
                         values: []
                       };
                       setOptions([...options, newOption]);
                    }
                 }}
                 disabled={options.some(o => o.name.toLowerCase() === name.toLowerCase())}
                 className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
               >
                 <Plus className="w-3 h-3" /> {name}
               </button>
             ))}
          </div>
        </div>
      </div>

      {/* 2. Variants Table */}
      {variants.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
             
          {/* Bulk Actions Header */}
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">2</span>
                Danh sách biến thể ({variants.length})
             </h3>
             
             <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2">
                    <input 
                        type="number" 
                        placeholder="Giá bán hàng loạt..." 
                        value={bulkPrice}
                        onChange={(e) => setBulkPrice(e.target.value)}
                        className="w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <button 
                        onClick={applyBulkPrice}
                        className="px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
                    >
                        Áp dụng
                    </button>
                </div>
                <div className="w-px h-6 bg-gray-300 mx-2 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                    <input 
                        type="number" 
                        placeholder="Tồn kho hàng loạt..." 
                        value={bulkStock}
                        onChange={(e) => setBulkStock(e.target.value)}
                        className="w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <button 
                        onClick={applyBulkStock}
                        className="px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg transition-colors"
                    >
                        Áp dụng
                    </button>
                </div>
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Biến thể</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-48">Giá bán (VNĐ)</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Tồn kho</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-40">Mã SKU</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider w-16"></th>
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {variants.map((variant, idx) => (
                    <tr key={variant.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900 bg-gray-100 px-3 py-1 rounded-full text-sm">
                            {variant.name}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        <div className="relative rounded-md shadow-sm">
                            <input 
                            type="number" 
                            value={variant.price}
                            onChange={(e) => {
                                const newVariants = [...variants];
                                newVariants[idx].price = e.target.value ? parseFloat(e.target.value) : '';
                                setVariants(newVariants);
                            }}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            placeholder="0"
                            />
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <input 
                        type="number" 
                        value={variant.stock}
                        onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[idx].stock = e.target.value ? parseInt(e.target.value) : '';
                            setVariants(newVariants);
                        }}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        placeholder="0"
                        />
                    </td>
                    <td className="px-6 py-4">
                        <input 
                        type="text" 
                        value={variant.sku}
                        onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[idx].sku = e.target.value;
                            setVariants(newVariants);
                        }}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-xs focus:ring-primary-500 focus:border-primary-500"
                        placeholder="SKU"
                        />
                    </td>
                    <td className="px-6 py-4 text-right">
                        <button 
                            onClick={() => {
                                const newVariants = variants.filter((_, i) => i !== idx);
                                setVariants(newVariants);
                            }}
                            className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 rounded-lg"
                            title="Xóa biến thể này"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
