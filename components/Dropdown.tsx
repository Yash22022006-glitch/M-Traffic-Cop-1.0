
import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  options: { label: string; value: string }[];
  selectedValue: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  size?: 'sm' | 'md';
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  selectedValue,
  onSelect,
  placeholder = 'Select...',
  className,
  buttonClassName,
  menuClassName,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const selectedOptionLabel = options.find(opt => opt.value === selectedValue)?.label || placeholder;

  const sizeStyles = {
    sm: 'px-2 py-1 text-[8px] font-black uppercase tracking-widest',
    md: 'px-3 py-1.5 text-[10px] font-black uppercase tracking-widest',
  };

  const iconSizeStyles = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <div>
        <button
          type="button"
          className={`inline-flex items-center justify-between w-full rounded-lg border border-gray-800 shadow-sm bg-gray-900 text-gray-300 hover:bg-gray-800 focus:outline-none transition-all ${sizeStyles[size]} ${buttonClassName}`}
          onClick={handleToggle}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <span className="truncate">{selectedOptionLabel}</span>
          <svg className={`ml-2 text-gray-500 ${iconSizeStyles[size]}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div
          className={`origin-top-left absolute left-0 mt-1 w-full rounded-lg ring-1 ring-white/10 focus:outline-none z-[100] max-h-60 overflow-y-auto bg-gray-950 shadow-2xl border border-gray-800 ${menuClassName}`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex={-1}
        >
          <div className="py-1" role="none">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`block w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  option.value === selectedValue ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
                role="menuitem"
                tabIndex={-1}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;