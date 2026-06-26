import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ComponentType<any>;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showSearch?: boolean;
  className?: string;
  menuWidthClass?: string;
  direction?: 'up' | 'down';
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  showSearch = false,
  className = '',
  menuWidthClass = 'w-full',
  direction = 'down'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search term when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white dark:bg-[#080C14] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-800 dark:text-slate-200 text-sm flex items-center justify-between focus:outline-none focus:border-brandCyan dark:focus:border-brandCyan hover:border-slate-350 hover:dark:border-white/20 transition-all cursor-pointer shadow-sm shadow-black/5"
      >
        <span className="flex items-center space-x-2 truncate">
          {selectedOption?.icon && (
            <selectedOption.icon className="w-4 h-4 text-cyan-600 dark:text-brandCyan shrink-0" />
          )}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 shrink-0 ${
            isOpen ? 'rotate-180 text-brandCyan' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: direction === 'up' ? 10 : -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === 'up' ? 10 : -10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-50 ${direction === 'up' ? 'bottom-full mb-2' : 'mt-2'} ${menuWidthClass} bg-white/95 dark:bg-[#0D1322]/95 backdrop-blur-lg border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden py-1.5`}
          >
            {/* Search Input */}
            {showSearch && (
              <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 flex items-center space-x-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-transparent text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 border-none outline-none focus:ring-0"
                />
              </div>
            )}

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 text-center">
                  No matching options found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-all duration-200 hover:bg-cyan-500/10 hover:text-cyan-700 dark:hover:text-brandCyan cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500/5 text-cyan-600 dark:text-brandCyan font-bold'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="flex items-center space-x-2 truncate">
                        {opt.icon && (
                          <opt.icon className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                        )}
                        <span>{opt.label}</span>
                      </span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-cyan-600 dark:text-brandCyan shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomDropdown;
