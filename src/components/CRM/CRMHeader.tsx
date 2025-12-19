// CRMHeader - Header con navegación para todas las páginas del CRM

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/AuthProvider';
import { crmService } from '@/services/crmService';
import type { KommoContact } from '@/types/crm';
import {
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
import { MigroLogo } from '@/components/common/MigroLogo';
import { useState, useEffect, useRef } from 'react';
import { Switch } from '@/components/ui/switch';
import { PiliChatModal } from './PiliChatModal';

interface CRMHeaderProps {
  onMenuClick?: () => void;
}

export function CRMHeader({ onMenuClick: _onMenuClick }: CRMHeaderProps = {}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KommoContact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login');
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

    // Usar 'click' en lugar de 'mousedown' para evitar conflictos con los clicks en los resultados
    document.addEventListener('click', handleClickOutside, true);
    return () => {
      document.removeEventListener('click', handleClickOutside, true);
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

  const handleContactSelect = (contactId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
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
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Primera fila: Logo, Buscador y User info */}
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo y título */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <Link to="/crm" className="flex items-center gap-2">
              <MigroLogo variant="header" />
              <h1 className="text-base sm:text-lg md:text-xl font-display font-bold text-gray-900 hidden sm:block">CRM</h1>
            </Link>
          </div>

          {/* Buscador de Contactos Desktop - Solo mostrar en páginas del CRM, no en Home */}
          {location.pathname !== '/' && (
            <div ref={searchRef} className="hidden md:block relative mx-2 md:mx-4 flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 md:w-4 md:h-4" />
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
                className="pl-8 md:pl-10 pr-3 md:pr-4 w-full text-sm md:text-base h-9 md:h-10"
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
                        onClick={(e) => handleContactSelect(contact.id, e)}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevenir que el blur cierre el dropdown antes del click
                          e.stopPropagation(); // Evitar que el click se propague al document
                        }}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
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
                        className="px-4 py-2 border-t border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer text-center text-sm text-primary font-medium transition-colors"
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

          {/* Buscador móvil - Solo en móvil */}
          {location.pathname !== '/' && (
            <div ref={searchRef} className="md:hidden relative flex-1 mx-1 sm:mx-2 min-w-0">
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                <Input
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                  onKeyDown={handleSearchKeyDown}
                  className="pl-8 sm:pl-10 pr-3 sm:pr-4 w-full text-xs sm:text-sm h-8 sm:h-9"
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
                          onClick={(e) => {
                            handleContactSelect(contact.id, e);
                            setMobileMenuOpen(false);
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold flex-shrink-0">
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
                    </div>
                  ) : searchQuery.trim().length >= 2 ? (
                    <div className="p-4 text-center text-gray-500">
                      <p className="text-sm">No se encontraron contactos</p>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}

          {/* User info y acciones */}
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs md:text-sm font-medium text-gray-900">
                  {user?.full_name || user?.email || 'Usuario'}
                </p>
                <p className="text-[10px] md:text-xs text-gray-500">
                  {user?.role === 'lawyer' ? 'Abogado' : 
                   user?.role === 'agent' ? 'Agente' : 
                   user?.role === 'admin' ? 'Administrador' : 
                   'Usuario'}
                </p>
              </div>
            </div>
            
            {/* Botón de Chat con Pili */}
            <PiliChatModal variant="header" />

            {/* Menú hamburguesa - Visible en todas las pantallas */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center p-1.5 sm:p-2 h-8 sm:h-9 md:h-10"
              aria-label="Menú de navegación"
            >
              {mobileMenuOpen ? <X size={18} className="sm:w-5 sm:h-5" /> : <Menu size={18} className="sm:w-5 sm:h-5" />}
            </Button>
          </div>
        </div>

        {/* Segunda fila: Navegación Desktop - Debajo del buscador */}
        {location.pathname !== '/' && (
          <nav className="hidden md:flex items-center gap-0.5 md:gap-1 border-t border-gray-100 py-1.5 md:py-2 overflow-x-auto">
            {/* Bloque 1: Switch Admin/CRM - Solo visible para admins */}
            {isAdmin && (
              <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 border-r border-gray-200 mr-1 md:mr-2">
                <div className="flex items-center gap-1.5 bg-gray-100 rounded-lg p-1">
                  <span className={`text-xs font-medium whitespace-nowrap ${location.pathname.startsWith('/admin') ? 'text-gray-900' : 'text-gray-500'}`}>
                    Admin
                  </span>
                  <Switch
                    checked={!location.pathname.startsWith('/admin')}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        navigate('/crm');
                      } else {
                        navigate('/admin/dashboard');
                      }
                    }}
                    aria-label="Cambiar entre Admin y CRM"
                    className="scale-90"
                  />
                  <span className={`text-xs font-medium whitespace-nowrap ${location.pathname.startsWith('/crm') ? 'text-gray-900' : 'text-gray-500'}`}>
                    CRM
                  </span>
                </div>
              </div>
            )}

            {/* Bloque 2: Módulos de navegación */}
            {navItems.map((item) => {
              const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={16} className="md:w-[18px] md:h-[18px]" />
                      {item.label}
                    </Link>
                  );
            })}

            {/* Bloque 3: Logout */}
            <div className="ml-auto flex items-center border-l border-gray-200 pl-2 md:pl-3">
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut size={16} className="md:w-[18px] md:h-[18px]" />
                <span>Cerrar Sesión</span>
              </Button>
            </div>
          </nav>
        )}

        {/* Navegación móvil - Visible cuando el menú está abierto */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="py-2">
              {/* Bloque 1: Switch Admin/CRM - Solo visible para admins */}
              {isAdmin && (
                <div className="px-4 py-3 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Cambiar módulo</span>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1.5">
                      <span className={`text-xs font-medium whitespace-nowrap ${location.pathname.startsWith('/admin') ? 'text-gray-900' : 'text-gray-500'}`}>
                        Admin
                      </span>
                      <Switch
                        checked={!location.pathname.startsWith('/admin')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            navigate('/crm');
                          } else {
                            navigate('/admin/dashboard');
                          }
                          setMobileMenuOpen(false);
                        }}
                        aria-label="Cambiar entre Admin y CRM"
                      />
                      <span className={`text-xs font-medium whitespace-nowrap ${location.pathname.startsWith('/crm') ? 'text-gray-900' : 'text-gray-500'}`}>
                        CRM
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Bloque 2: Módulos de navegación */}
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
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                          active
                            ? 'bg-primary/10 text-primary'
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

              {/* Bloque 3: Logout */}
              <div className="px-4 py-3 border-t border-gray-200">
                <Button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  variant="ghost"
                  className="w-full flex items-center gap-3 justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut size={20} />
                  <span className="text-sm font-medium">Cerrar Sesión</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

