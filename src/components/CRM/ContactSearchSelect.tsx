// ContactSearchSelect - Selector de contacto con buscador

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, X } from 'lucide-react';
import { crmService } from '@/services/crmService';
import type { Contact } from '@/types/crm';
import { cn } from '@/lib/utils';

interface ContactSearchSelectProps {
  value: string;
  onChange: (contactId: string) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function ContactSearchSelect({
  value,
  onChange,
  label = 'Contacto',
  required = false,
  disabled = false,
  className,
  placeholder = 'Buscar contacto...',
}: ContactSearchSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cargar contacto seleccionado si hay value
  useEffect(() => {
    if (value && value !== selectedContact?.id) {
      loadContactById(value);
    } else if (!value && selectedContact) {
      setSelectedContact(null);
      setSearchQuery('');
    }
  }, [value]);

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);

  const loadContactById = async (contactId: string) => {
    try {
      const contact = await crmService.getContact(contactId);
      setSelectedContact(contact);
      const displayName = contact.name || 
        `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 
        contact.email || 
        `Contacto ${contact.id?.slice(0, 8) || 'N/A'}`;
      setSearchQuery(displayName);
    } catch (error) {
      console.error('Error loading contact:', error);
    }
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    setShowDropdown(true);
    try {
      const response = await crmService.getContacts({
        search: query,
        limit: 10,
        skip: 0,
      });
      setSearchResults(response.items || []);
    } catch (error) {
      console.error('Error searching contacts:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    const displayName = contact.name || 
      `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 
      contact.email || 
      `Contacto ${contact.id?.slice(0, 8) || 'N/A'}`;
    setSearchQuery(displayName);
    onChange(contact.id);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setSelectedContact(null);
    setSearchQuery('');
    onChange('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleInputFocus = () => {
    if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    
    // Si se borra todo, limpiar selección
    if (!newValue.trim()) {
      setSelectedContact(null);
      onChange('');
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <Label htmlFor="contact-search">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      
      <div className="relative mt-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            ref={inputRef}
            id="contact-search"
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={placeholder}
            disabled={disabled}
            required={required && !selectedContact}
            className={cn(
              'pl-10 pr-10',
              selectedContact && 'border-green-500 focus:ring-green-500'
            )}
            autoComplete="off"
          />
          {selectedContact && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Dropdown de resultados */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {isSearching && searchQuery.length >= 2 ? (
              <div className="p-4 text-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                <p className="text-sm">Buscando...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                {searchResults.map((contact) => {
                  const displayName = contact.name || 
                    `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 
                    contact.email || 
                    `Contacto ${contact.id?.slice(0, 8) || 'N/A'}`;
                  
                  return (
                    <div
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className={cn(
                        'px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors',
                        selectedContact?.id === contact.id && 'bg-green-50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {displayName}
                          </p>
                          {contact.email && (
                            <p className="text-sm text-gray-500 truncate">
                              {contact.email}
                            </p>
                          )}
                          {contact.phone && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {contact.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : searchQuery.trim().length >= 2 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No se encontraron contactos</p>
                <p className="text-xs text-gray-400 mt-1">
                  Intenta con otro término de búsqueda
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Input oculto para el valor real (para formularios) */}
      <input
        type="hidden"
        name="entity_id"
        value={selectedContact?.id || ''}
        required={required}
      />
    </div>
  );
}

