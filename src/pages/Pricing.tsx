import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const Pricing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="max-w-2xl w-full p-12 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
            <Construction className="h-20 w-20 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl font-bold">Página em Construção</h1>
          <p className="text-xl text-muted-foreground">
            Estamos trabalhando nos planos e preços do Valtrixapp
          </p>
        </div>

        <div className="pt-6 space-y-3">
          <p className="text-muted-foreground">
            Em breve você poderá escolher entre diferentes planos que melhor se adequam às suas necessidades.
          </p>
          <p className="text-sm text-muted-foreground">
            Por enquanto, aproveite todos os recursos gratuitamente!
          </p>
        </div>

        <div className="pt-4">
          <Button onClick={() => navigate('/dashboard')} size="lg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Pricing;
