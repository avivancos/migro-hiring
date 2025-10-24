// Main Hiring Flow Page - Manages the 5-step process

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useHiringData } from '@/hooks/useHiringData';
import { hiringService } from '@/services/hiringService';
import { ServiceDetails } from '@/components/ServiceDetails';
import { ConfirmData } from '@/components/ConfirmData';
import { ContractSignature } from '@/components/ContractSignature';
import { PaymentForm } from '@/components/PaymentForm';
import { ContractSuccess } from '@/components/ContractSuccess';
import { ProgressBar } from '@/components/Layout/ProgressBar';
import { Loader2 } from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5;

export function HiringFlow() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { details, loading, error } = useHiringData(code || '');
  
  // Obtener paso actual de la URL, localStorage o usar 1 por defecto
  const stepFromUrl = parseInt(searchParams.get('step') || '1', 10);
  const stepFromStorage = code ? parseInt(localStorage.getItem(`hiring_step_${code}`) || '1', 10) : 1;
  const initialStep = (stepFromUrl >= 1 && stepFromUrl <= 5) ? stepFromUrl : 
                     (stepFromStorage >= 1 && stepFromStorage <= 5) ? stepFromStorage : 1;
  
  const [currentStep, setCurrentStep] = useState<Step>(initialStep as Step);

  // Sincronizar estado con URL
  useEffect(() => {
    const stepFromUrl = parseInt(searchParams.get('step') || '1', 10);
    if (stepFromUrl >= 1 && stepFromUrl <= 5 && stepFromUrl !== currentStep) {
      setCurrentStep(stepFromUrl as Step);
    }
  }, [searchParams, currentStep]);

  // Actualizar URL y localStorage cuando cambie el paso
  useEffect(() => {
    const currentStepFromUrl = parseInt(searchParams.get('step') || '1', 10);
    if (currentStep !== currentStepFromUrl) {
      setSearchParams({ step: currentStep.toString() }, { replace: true });
    }
    
    // Persistir paso en localStorage
    if (code) {
      localStorage.setItem(`hiring_step_${code}`, currentStep.toString());
    }
  }, [currentStep, searchParams, setSearchParams, code]);

  // Verificar expiración
  useEffect(() => {
    if (details) {
      const expirationDate = new Date(details.expires_at);
      const now = new Date();
      
      if (now > expirationDate) {
        navigate('/expirado');
      }
    }
  }, [details, navigate]);

  // Handlers para navegación entre pasos
  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  // Handler para confirmar datos (Step 2)
  const handleConfirmData = async () => {
    if (!code) return;

    await hiringService.confirmData(code, {
      confirmed: true,
    });
    
    handleNext();
  };

  // Handler para completar firma del contrato (Step 3)
  const handleSignatureComplete = () => {
    handleNext();
  };

  // Handler para completar pago (Step 4)
  const handlePaymentSuccess = () => {
    handleNext();
  };

  // Handler para completar el proceso (Step 5) - Limpiar estado
  const handleComplete = () => {
    // Limpiar estado del localStorage cuando se complete el proceso
    if (code) {
      localStorage.removeItem(`hiring_step_${code}`);
    }
    console.log('Proceso completado - Estado limpiado');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 animate-spin text-primary" size={48} />
          <p className="text-gray-600">Cargando información del servicio...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-4">Error</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!details || !code) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <ProgressBar currentStep={currentStep} />
        </div>
      </div>

      {/* Step Content */}
      <div className="py-8">
        {currentStep === 1 && (
          <ServiceDetails
            details={details}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <ConfirmData
            details={details}
            onConfirm={handleConfirmData}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <ContractSignature
            hiringCode={code}
            userName={details.user_name}
            onComplete={handleSignatureComplete}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <PaymentForm
            hiringCode={code}
            amount={details.amount}
            currency={details.currency}
            serviceName={details.service_name}
            onSuccess={handlePaymentSuccess}
            onBack={handleBack}
          />
        )}

        {currentStep === 5 && (
          <ContractSuccess
            hiringCode={code}
            serviceName={details.service_name}
            userEmail={details.user_email}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}

