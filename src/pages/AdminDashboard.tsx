// Admin Dashboard - Create Hiring Codes

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { adminService } from '@/services/adminService';
import { GRADE_PRICING, GRADE_DESCRIPTIONS, type ClientGrade } from '@/types/admin';
import { UserPlus, LogOut, CheckCircle, Copy, AlertCircle } from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  // Form fields
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPassport, setUserPassport] = useState('');
  const [userNie, setUserNie] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userCity, setUserCity] = useState('');
  const [userProvince, setUserProvince] = useState('');
  const [userPostalCode, setUserPostalCode] = useState('');
  const [serviceName, setServiceName] = useState('Residencia Legal en España');
  const [serviceDescription, setServiceDescription] = useState('Tramitación de expediente para obtención de residencia legal');
  const [grade, setGrade] = useState<ClientGrade>('B');

  useEffect(() => {
    // Check authentication
    if (!adminService.isAuthenticated()) {
      navigate('/admin/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    adminService.logout();
    navigate('/admin/login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!userName.trim()) {
      setError('El nombre completo es obligatorio');
      return;
    }

    if (!userEmail.trim() || !userEmail.includes('@')) {
      setError('El email es obligatorio y debe ser válido');
      return;
    }

    if (!userPassport.trim() && !userNie.trim()) {
      setError('Debe proporcionar al menos Pasaporte o NIE');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedCode(null);
    setGeneratedUrl(null);

    try {
      const response = await adminService.createHiringCode({
        contract_template: "standard", // Campo requerido
        service_name: serviceName,
        service_description: serviceDescription,
        amount: GRADE_PRICING[grade] * 100, // Convertir a centavos
        currency: "EUR",
        grade: grade,
        expires_in_days: 30,
        notes: `Código creado por administrador - Grado ${grade}`,
        // Datos del cliente (información de contacto principal) - REQUERIDOS
        client_name: userName,
        client_email: userEmail,
        // Datos del cliente (información adicional del documento)
        client_passport: userPassport || undefined,
        client_nie: userNie || undefined,
        client_address: userAddress || undefined,
        client_city: userCity || undefined,
        client_province: userProvince || undefined,
        client_postal_code: userPostalCode || undefined,
      });

      console.log('✅ Respuesta del backend:', response);

      // Extraer código y URL de la respuesta
      const hiringCode = response.hiring_code;
      const shortUrl = response.short_url;

      console.log('📝 Código extraído:', hiringCode);
      console.log('🔗 URL extraída:', shortUrl);

      if (hiringCode) {
        setGeneratedCode(hiringCode);
        setSuccess(`¡Código de contratación creado exitosamente!`);
      } else {
        console.warn('⚠️ No se encontró código de contratación en la respuesta');
        setError('Código creado pero no se pudo extraer de la respuesta');
        return;
      }

      if (shortUrl) {
        setGeneratedUrl(shortUrl);
      } else {
        // Generar URL manualmente si no viene en la respuesta
        const manualUrl = `https://contratacion.migro.es/${hiringCode}`;
        setGeneratedUrl(manualUrl);
        console.log('🔗 URL generada manualmente:', manualUrl);
      }
      
      // Clear form
      setUserName('');
      setUserEmail('');
      setUserPassport('');
      setUserNie('');
      setUserAddress('');
      setUserCity('');
      setUserProvince('');
      setUserPostalCode('');
      setGrade('B');
    } catch (err: any) {
      setError(err.message || 'Error al crear el código de contratación');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('¡Copiado al portapapeles!');
  };

  const getPaymentInfo = () => {
    const totalAmount = GRADE_PRICING[grade];
    const firstPayment = grade === 'C' ? 300 : 200;
    const secondPayment = grade === 'C' ? 300 : 200;
    
    return {
      total: totalAmount,
      first: firstPayment,
      second: secondPayment,
    };
  };

  const paymentInfo = getPaymentInfo();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-600 mt-1">Crear códigos de contratación</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut size={18} />
            Salir
          </Button>
        </div>

        {/* Success Message */}
        {success && generatedCode && (
          <Card className="mb-6 border-green-500 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-600 mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-2">{success}</h3>
                  
                  <div className="bg-white border border-green-300 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Código de contratación:</p>
                      <div className="flex items-center gap-2">
                        <code className="text-2xl font-bold text-primary">{generatedCode}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(generatedCode)}
                        >
                          <Copy size={16} />
                        </Button>
                      </div>
                    </div>

                    {generatedUrl && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">URL de contratación:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-3 py-2 rounded flex-1 break-all">
                            {generatedUrl}
                          </code>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(generatedUrl)}
                          >
                            <Copy size={16} />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="border-t pt-3">
                      <p className="text-sm text-gray-700">
                        <strong>Envía este código al cliente</strong> para que inicie el proceso de contratación.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <UserPlus className="text-primary" size={24} />
              Crear Nuevo Código de Contratación
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Datos del Cliente */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-gray-900">Datos del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="userName">Nombre y Apellidos *</Label>
                    <Input
                      id="userName"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Juan Pérez García"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="userEmail">Correo Electrónico *</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="cliente@ejemplo.com"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="userPassport">Número de Pasaporte</Label>
                    <Input
                      id="userPassport"
                      value={userPassport}
                      onChange={(e) => setUserPassport(e.target.value.toUpperCase())}
                      placeholder="ABC123456"
                    />
                  </div>

                  <div>
                    <Label htmlFor="userNie">NIE</Label>
                    <Input
                      id="userNie"
                      value={userNie}
                      onChange={(e) => setUserNie(e.target.value.toUpperCase())}
                      placeholder="X1234567Y"
                    />
                  </div>

                  <div>
                    <Label htmlFor="userAddress">Dirección</Label>
                    <Input
                      id="userAddress"
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      placeholder="Calle Principal 123"
                    />
                  </div>

                  <div>
                    <Label htmlFor="userCity">Ciudad</Label>
                    <Input
                      id="userCity"
                      value={userCity}
                      onChange={(e) => setUserCity(e.target.value)}
                      placeholder="Salamanca"
                    />
                  </div>
                </div>

                {/* Provincia y Código Postal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="userProvince">Provincia (opcional)</Label>
                    <Input
                      id="userProvince"
                      value={userProvince}
                      onChange={(e) => setUserProvince(e.target.value)}
                      placeholder="Salamanca"
                    />
                  </div>

                  <div>
                    <Label htmlFor="userPostalCode">Código Postal (opcional)</Label>
                    <Input
                      id="userPostalCode"
                      value={userPostalCode}
                      onChange={(e) => setUserPostalCode(e.target.value)}
                      placeholder="37001"
                    />
                  </div>
                </div>
              </div>

              {/* Servicio */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-gray-900">Servicio</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label htmlFor="serviceName">Nombre del Servicio</Label>
                    <Input
                      id="serviceName"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      placeholder="Residencia Legal en España"
                    />
                  </div>

                  <div>
                    <Label htmlFor="serviceDescription">Descripción</Label>
                    <Input
                      id="serviceDescription"
                      value={serviceDescription}
                      onChange={(e) => setServiceDescription(e.target.value)}
                      placeholder="Tramitación de expediente..."
                    />
                  </div>
                </div>
              </div>

              {/* Calificación y Coste */}
              <div>
                <h3 className="font-semibold text-lg mb-4 text-gray-900">
                  Calificación y Estudio Migro
                </h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Sistema de Calificación:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li><strong>Nota A:</strong> Excelente - Alta probabilidad de éxito (400€)</li>
                    <li><strong>Nota B:</strong> Bueno - Probabilidad media de éxito (400€)</li>
                    <li><strong>Nota C:</strong> Complejo - Requiere estudio adicional (600€)</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(['A', 'B', 'C'] as ClientGrade[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGrade(g)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        grade === g
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-300 bg-white hover:border-primary'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-2">Nota {g}</div>
                        <div className="text-sm">{GRADE_DESCRIPTIONS[g]}</div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Resumen de Pago */}
                <div className="mt-4 bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Resumen de Pago</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Coste Total (IVA incluido):</span>
                      <span className="font-bold text-lg text-primary">{paymentInfo.total}€</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Primer pago (al contratar):</span>
                      <span className="font-semibold">{paymentInfo.first}€</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Segundo pago (tras aprobación):</span>
                      <span className="font-semibold">{paymentInfo.second}€</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-center gap-2">
                  <AlertCircle size={20} />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary-700 text-white"
                >
                  {loading ? 'Generando...' : 'Generar Código de Contratación'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

