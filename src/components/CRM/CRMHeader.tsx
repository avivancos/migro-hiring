// CRMHeader - Header con navegación para todas las páginas del CRM

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminService } from '@/services/adminService';
import { crmService } from '@/services/crmService';
import type { KommoContact } from '@/types/crm';
import {
  Building2,
  LayoutDashboard,
  Users,
  Calendar,
  Phone,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Mail,
  MapPin,
  Flag,
  Loader2,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { PiliChatModal } from './PiliChatModal';

export function CRMHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KommoContact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const user = adminService.getUser();

  const handleLogout = () => {
    adminService.logout();
    navigate('/contrato/login');
  };

  // Búsqueda de contactos con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const performSearch = async (query: string) => {
    setIsSearching(true);
    setShowSearchResults(true);
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

  const handleContactSelect = (contactId: string) => {
    setSearchQuery('');
    setShowSearchResults(false);
    navigate(`/crm/contacts/${contactId}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSearchResults(false);
      setSearchQuery('');
    } else if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
      // Navegar a la lista de contactos con la búsqueda
      navigate(`/crm/contacts?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
      setSearchQuery('');
    }
  };

  const isActive = (path: string) => {
    if (path === '/crm') {
      return location.pathname === '/crm';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { path: '/crm', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/crm/contacts', label: 'Contactos', icon: Users },
    { path: '/crm/calendar', label: 'Calendario', icon: Calendar },
    { path: '/crm/call', label: 'Llamadas', icon: Phone },
    { path: '/crm/expedientes', label: 'Expedientes', icon: FileText },
    { path: '/crm/settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y título */}
          <div className="flex items-center gap-4">
            <Link to="/crm" className="flex items-center gap-2">
              <Building2 className="w-8 h-8 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900 hidden sm:block">CRM Migro</h1>
            </Link>
          </div>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-green-50 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Buscador de Contactos - Solo mostrar en páginas del CRM, no en Home */}
          {location.pathname !== '/' && (
            <div ref={searchRef} className="hidden lg:block relative mx-4 flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar contactos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) {
                    setShowSearchResults(true);
                  }
                }}
                onKeyDown={handleSearchKeyDown}
                className="pl-10 pr-4 w-full"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
              )}
            </div>

            {/* Dropdown de resultados */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                {isSearching && searchQuery.length >= 2 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Buscando...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => handleContactSelect(contact.id)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold flex-shrink-0">
                            {(contact.name || contact.first_name || 'C')[0].toUpperCase()}
                            {(contact.last_name || contact.name?.split(' ')[1] || '')[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
                            </p>
                            <div className="mt-1 space-y-1">
                              {contact.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Mail className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{contact.email}</span>
                                </div>
                              )}
                              {(contact.phone || contact.mobile) && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Phone className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{contact.phone || contact.mobile}</span>
                                </div>
                              )}
                              {contact.city && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <MapPin className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{contact.city}{contact.state ? `, ${contact.state}` : ''}</span>
                                </div>
                              )}
                              {contact.nacionalidad && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Flag className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{contact.nacionalidad}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {searchQuery.trim().length >= 2 && (
                      <div
                        onClick={() => {
                          navigate(`/crm/contacts?search=${encodeURIComponent(searchQuery.trim())}`);
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }}
                        className="px-4 py-2 border-t border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer text-center text-sm text-green-600 font-medium transition-colors"
                      >
                        Ver todos los resultados para "{searchQuery}"
                      </div>
                    )}
                  </div>
                ) : searchQuery.trim().length >= 2 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p className="text-sm">No se encontraron contactos</p>
                    <p className="text-xs mt-1">Intenta con otro término de búsqueda</p>
                  </div>
                ) : null}
              </div>
            )}
            </div>
          )}

          {/* User info y acciones */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name || user?.email || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500">Administrador</p>
              </div>
            </div>
            
            {/* Botón de Chat con Pili */}
            <PiliChatModal variant="header" />
            
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>

            {/* Menú móvil */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </Button>
          </div>
        </div>

        {/* Navegación móvil */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            {/* Buscador móvil - Solo mostrar en páginas del CRM, no en Home */}
            {location.pathname !== '/' && (
              <div className="px-4 py-3 border-b border-gray-200">
                <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Buscar contactos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) {
                        setShowSearchResults(true);
                      }
                    }}
                    onKeyDown={handleSearchKeyDown}
                    className="pl-10 pr-4 w-full"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 animate-spin" />
                  )}
                </div>

                {/* Dropdown de resultados móvil */}
                {showSearchResults && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {isSearching && searchQuery.length >= 2 ? (
                      <div className="p-4 text-center text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                        <p className="text-sm">Buscando...</p>
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="py-2">
                        {searchResults.map((contact) => (
                          <div
                            key={contact.id}
                            onClick={() => {
                              handleContactSelect(contact.id);
                              setMobileMenuOpen(false);
                            }}
                            className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold flex-shrink-0">
                                {(contact.name || contact.first_name || 'C')[0].toUpperCase()}
                                {(contact.last_name || contact.name?.split(' ')[1] || '')[0]?.toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">
                                  {contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
                                </p>
                                {contact.email && (
                                  <p className="text-sm text-gray-600 truncate mt-1">{contact.email}</p>
                                )}
                                {(contact.phone || contact.mobile) && (
                                  <p className="text-sm text-gray-600 truncate">{contact.phone || contact.mobile}</p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {searchQuery.trim().length >= 2 && (
                          <div
                            onClick={() => {
                              navigate(`/crm/contacts?search=${encodeURIComponent(searchQuery.trim())}`);
                              setShowSearchResults(false);
                              setSearchQuery('');
                              setMobileMenuOpen(false);
                            }}
                            className="px-4 py-2 border-t border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer text-center text-sm text-green-600 font-medium transition-colors"
                          >
                            Ver todos los resultados
                          </div>
                        )}
                      </div>
                    ) : searchQuery.trim().length >= 2 ? (
                      <div className="p-4 text-center text-gray-500">
                        <p className="text-sm">No se encontraron contactos</p>
                      </div>
                    ) : null}
                  </div>
                )}
                </div>
              </div>
            )}

            {/* Navegación móvil */}
            <nav className="py-2">
              <div className="flex flex-col">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        active
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={20} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

