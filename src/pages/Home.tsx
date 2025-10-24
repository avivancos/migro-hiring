// Home page - Landing para la aplicación de contratación

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileCheck, Shield, CreditCard, Download } from 'lucide-react';
import { fadeIn, slideUp, staggerContainer, staggerItem } from '@/utils/animations';

export function Home() {
  const navigate = useNavigate();
  const [hiringCode, setHiringCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hiringCode.trim()) {
      navigate(`/contratacion/${hiringCode}`);
    }
  };

  const features = [
    {
      icon: FileCheck,
      title: 'Verifica Datos',
      description: 'Confirma tu información personal de forma segura',
    },
    {
      icon: Shield,
      title: 'KYC Identity',
      description: 'Verificación de identidad con Stripe Identity',
    },
    {
      icon: CreditCard,
      title: 'Pago Seguro',
      description: 'Procesa tu pago de forma segura con Stripe',
    },
    {
      icon: Download,
      title: 'Contrato Digital',
      description: 'Descarga tu contrato firmado instantáneamente',
    },
  ];

  return (
    <Layout>
      <motion.div 
        className="max-w-5xl mx-auto px-4 py-12"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          variants={slideUp}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Sistema de Contratación
            <span className="block text-primary mt-2">Migro</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Completa tu proceso de contratación de servicios legales de forma autónoma,
            segura y 100% digital.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          variants={staggerContainer}
        >
          {features.map((feature, index) => (
            <motion.div key={index} variants={staggerItem}>
              <Card className="h-full">
                <CardHeader>
                  <feature.icon className="w-12 h-12 text-primary mb-2" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={slideUp}>
          <Card className="bg-primary text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">¿Tienes un código de contratación?</h2>
              <p className="mb-6 text-green-100">
                Ingresa tu código único de 5 caracteres para comenzar el proceso
              </p>
              <form onSubmit={handleSubmit} className="flex gap-4 justify-center">
                <input
                  type="text"
                  placeholder="AB12C"
                  maxLength={5}
                  value={hiringCode}
                  onChange={(e) => setHiringCode(e.target.value.toUpperCase())}
                  className="px-4 py-2 rounded-lg text-gray-900 uppercase text-center font-mono text-lg"
                  style={{ width: '150px' }}
                />
                <Button type="submit" variant="secondary" size="lg">
                  Continuar
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info */}
        <motion.div 
          className="mt-12 text-center text-sm text-gray-500"
          variants={fadeIn}
        >
          <p>¿No tienes un código? Contacta con tu asesor de Migro</p>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
