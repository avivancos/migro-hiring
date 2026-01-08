import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  generateCollabAgreementPdfFromMd,
  generateCollabAgreementPdfFromText,
} from '@/utils/collabAgreementPdfFromMd.ts';
import { buildCollaboratorAgreementText } from '@/utils/collabAgreementTemplate';
// @ts-ignore - Vite raw import
import agreementMd from '@/legal/colab_agreement.md?raw';

export function Colaboradores() {
  const [downloading, setDownloading] = useState(false);
  const [customDownloading, setCustomDownloading] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [collaboratorName, setCollaboratorName] = useState('');
  const [collaboratorAddress, setCollaboratorAddress] = useState('');
  const [collaboratorCity, setCollaboratorCity] = useState('');
  const [collaboratorProvince, setCollaboratorProvince] = useState('');
  const [collaboratorDni, setCollaboratorDni] = useState('');
  const [signatureCity, setSignatureCity] = useState('Salamanca');
  const todayIso = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [signatureDateIso, setSignatureDateIso] = useState(todayIso);
  const [collaborationCode, setCollaborationCode] = useState('');
  const [customAgreementText, setCustomAgreementText] = useState('');
  const [formError, setFormError] = useState('');

  const resetCustomSection = () => {
    setCollaborationCode('');
    setCustomAgreementText('');
  };

  const handlePasswordSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (password === 'Pomelo2005.1@') {
      setIsAuthorized(true);
      setPasswordError('');
    } else {
      setPasswordError('Contraseña incorrecta.');
    }
  };

  const generateCollaborationCode = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `COL-${timestamp}-${random}`;
  };

  const handleGenerateContract = (event: FormEvent) => {
    event.preventDefault();
    if (!collaboratorName || !collaboratorAddress || !collaboratorCity || !collaboratorProvince || !collaboratorDni) {
      setFormError('Completa todos los campos obligatorios.');
      return;
    }

    setFormError('');
    const code = generateCollaborationCode();
    const contractText = buildCollaboratorAgreementText({
      collaboratorName,
      collaboratorAddress,
      collaboratorCity,
      collaboratorProvince,
      collaboratorDni,
      signatureCity,
      signatureDateIso,
      collaborationCode: code,
    });

    setCollaborationCode(code);
    setCustomAgreementText(contractText);
  };

  const handleCustomDownload = () => {
    if (!customAgreementText.trim()) {
      setFormError('Genera el contrato antes de intentar descargarlo.');
      return;
    }
    setCustomDownloading(true);
    try {
      const blob = generateCollabAgreementPdfFromText(customAgreementText);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = collaboratorName || 'Colaborador';
      a.download = `Contrato_Colaborador_${safeName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setCustomDownloading(false), 300);
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    try {
      const blob = generateCollabAgreementPdfFromMd();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Convenio_Colaboracion_Migro.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setDownloading(false), 300);
    }
  };

  const handlePreview = () => {
    const blob = generateCollabAgreementPdfFromMd();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    // No revocar inmediatamente para permitir la previsualización
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-10">
      <section>
        <h1 className="text-2xl font-bold text-green-600 mb-2">Convenio de Colaboración</h1>
        <p className="text-sm text-gray-600 mb-6">
        Visualiza o descarga el convenio marco de colaboración entre abogados colaboradores y MIGRO.
        </p>
        <div className="flex gap-3">
          <Button onClick={handlePreview} variant="default" className="bg-green-600 hover:bg-green-700">
            Ver en el navegador
          </Button>
          <Button onClick={handleDownload} disabled={downloading} variant="outline">
            {downloading ? 'Generando…' : 'Descargar PDF'}
          </Button>
        </div>

        <div className="mt-8 space-y-2">
          <h2 className="text-lg font-semibold text-green-700">Registro de modificaciones (publicado)</h2>
          <div className="text-sm text-gray-700">
            <p className="mb-2">
              Última modificación publicada: <span className="font-medium">
                {
                  (() => {
                    const raw = (agreementMd as unknown as string) || '';
                    const anchor = '16. REGISTRO DE MODIFICACIONES';
                    const start = raw.indexOf(anchor);
                    if (start === -1) return '—';
                    const endMarker = '\nY en prueba de conformidad';
                    const end = raw.indexOf(endMarker, start);
                    const section = raw.substring(start, end === -1 ? raw.length : end);
                    const m = section.match(/16\.1\.\s*Última modificación:\s*([^\n]+)/);
                    return m ? m[1].trim() : '—';
                  })()
                }
              </span>
            </p>
            <div className="rounded-md border border-gray-200">
              <div className="bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700">
                Texto del changelog
              </div>
              <div className="p-4 text-xs leading-6 font-mono">
                {(() => {
                  const raw = (agreementMd as unknown as string) || '';
                  const anchor = '16. REGISTRO DE MODIFICACIONES';
                  const start = raw.indexOf(anchor);
                  if (start === -1) return <span>No hay registro de modificaciones.</span>;
                  const endMarker = '\nY en prueba de conformidad';
                  const end = raw.indexOf(endMarker, start);
                  const section = raw.substring(start, end === -1 ? raw.length : end).trim();
                  const lines = section.split(/\r?\n/);
                  return (
                    <div className="space-y-0.5">
                      {lines.map((line, idx) => {
                        const highlight =
                          line.includes('Ajuste de 11.3') ||
                          line.toLowerCase().includes('registro en crm');
                        return (
                          <div
                            key={idx}
                            className={highlight ? 'bg-yellow-200 px-1 rounded' : undefined}
                          >
                            {line}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="rounded-md border border-gray-200">
            <div className="bg-green-600 text-white px-4 py-2 text-sm font-semibold">
              Vista previa (texto íntegro)
            </div>
            <div className="p-4 whitespace-pre-wrap text-sm leading-6 font-serif">
              {agreementMd as unknown as string}
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-green-600 mb-4">Generador de contrato personalizado</h2>
        {!isAuthorized ? (
          <form
            onSubmit={handlePasswordSubmit}
            className="max-w-md border border-gray-200 rounded-lg p-6 bg-white shadow-sm"
          >
            <h3 className="text-base font-medium mb-4">Acceso restringido</h3>
            <Label htmlFor="wizard-password" className="text-sm font-medium">
              Introduce la contraseña de acceso
            </Label>
            <Input
              id="wizard-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2"
            />
            {passwordError && <p className="text-red-600 text-sm mt-2">{passwordError}</p>}
            <Button type="submit" className="mt-4 bg-green-600 hover:bg-green-700">
              Desbloquear generador
            </Button>
          </form>
        ) : (
          <div className="space-y-8">
            <form
              onSubmit={handleGenerateContract}
              className="grid gap-4 md:grid-cols-2 border border-gray-200 rounded-lg p-6 bg-white shadow-sm"
            >
              <div className="md:col-span-2">
                <h3 className="text-base font-semibold mb-2">Datos del despacho colaborador</h3>
                <p className="text-sm text-gray-600">
                  Completa la información. Los campos son obligatorios.
                </p>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="collaborator-name">Nombre completo</Label>
                <Input
                  id="collaborator-name"
                  value={collaboratorName}
                  onChange={(e) => {
                    setCollaboratorName(e.target.value);
                    resetCustomSection();
                  }}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="collaborator-address">Dirección</Label>
                <Input
                  id="collaborator-address"
                  value={collaboratorAddress}
                  onChange={(e) => {
                    setCollaboratorAddress(e.target.value);
                    resetCustomSection();
                  }}
                />
              </div>

              <div>
                <Label htmlFor="collaborator-city">Ciudad</Label>
                <Input
                  id="collaborator-city"
                  value={collaboratorCity}
                  onChange={(e) => {
                    setCollaboratorCity(e.target.value);
                    resetCustomSection();
                  }}
                />
              </div>

              <div>
                <Label htmlFor="collaborator-province">Provincia</Label>
                <Input
                  id="collaborator-province"
                  value={collaboratorProvince}
                  onChange={(e) => {
                    setCollaboratorProvince(e.target.value);
                    resetCustomSection();
                  }}
                />
              </div>

              <div>
                <Label htmlFor="collaborator-dni">DNI / NIF</Label>
                <Input
                  id="collaborator-dni"
                  value={collaboratorDni}
                  onChange={(e) => {
                    setCollaboratorDni(e.target.value);
                    resetCustomSection();
                  }}
                />
              </div>

              <div>
                <Label htmlFor="signature-city">Ciudad de firma</Label>
                <Input
                  id="signature-city"
                  value={signatureCity}
                  onChange={(e) => {
                    setSignatureCity(e.target.value);
                    resetCustomSection();
                  }}
                />
              </div>

              <div>
                <Label htmlFor="signature-date">Fecha de firma</Label>
                <Input
                  id="signature-date"
                  type="date"
                  value={signatureDateIso}
                  onChange={(e) => {
                    setSignatureDateIso(e.target.value);
                    resetCustomSection();
                  }}
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Generar contrato personalizado
                </Button>
                <Button type="button" variant="outline" onClick={resetCustomSection}>
                  Limpiar borrador
                </Button>
              </div>

              {formError && (
                <div className="md:col-span-2">
                  <p className="text-red-600 text-sm">{formError}</p>
                </div>
              )}
            </form>

            {customAgreementText && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Código de contratación generado:</p>
                    <p className="font-mono text-green-700 text-base">{collaborationCode}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const newCode = generateCollaborationCode();
                      const regenerated = buildCollaboratorAgreementText({
                        collaboratorName,
                        collaboratorAddress,
                        collaboratorCity,
                        collaboratorProvince,
                        collaboratorDni,
                        signatureCity,
                        signatureDateIso,
                        collaborationCode: newCode,
                      });
                      setCollaborationCode(newCode);
                      setCustomAgreementText(regenerated);
                    }}
                  >
                    Generar nuevo código
                  </Button>
                </div>

                <div>
                  <Label htmlFor="custom-agreement-text" className="text-sm font-medium">
                    Texto del contrato (editable antes de generar el PDF)
                  </Label>
                  <textarea
                    id="custom-agreement-text"
                    className="mt-2 w-full rounded-md border border-gray-300 bg-white p-4 text-sm font-serif leading-6 focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={24}
                    value={customAgreementText}
                    onChange={(e) => setCustomAgreementText(e.target.value)}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Puedes adaptar cláusulas específicas antes de descargar el PDF. El contenido final se guardará tal cual lo ves aquí.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    onClick={handleCustomDownload}
                    disabled={customDownloading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {customDownloading ? 'Generando…' : 'Descargar PDF personalizado'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const refreshed = buildCollaboratorAgreementText({
                        collaboratorName,
                        collaboratorAddress,
                        collaboratorCity,
                        collaboratorProvince,
                        collaboratorDni,
                        signatureCity,
                        signatureDateIso,
                        collaborationCode,
                      });
                      setCustomAgreementText(refreshed);
                    }}
                  >
                    Restaurar formato original
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

