"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Calendar as CalendarIcon, CheckCircle, AlertCircle, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { api } from "@/services/api"; // Usando o cliente seguro
import UserDrawer from "@/components/UserDrawer"; // Importando o nosso menu lateral

interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}

export default function Agendar() {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Estado para controlar o Drawer Lateral de Conta
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    api.get('/services')
      .then(res => setServices(res.data))
      .catch(err => console.error("Erro ao buscar serviços:", err));
  }, []);

  const handleAgendar = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const startsAt = new Date(`${date}T${time}:00`).toISOString();
      
      // O token vai automaticamente pelo interceptor do api!
      await api.post('/appointments', {
        serviceId: selectedService,
        startsAt
      });

      setStep(4); // Sucesso! Tela verde
      
    } catch (error: any) {
      if (error.response?.status === 401) {
        setStep(3); // Pede login se não estiver autorizado
      } else {
        setErrorMsg(error.response?.data?.error || "Erro ao agendar. Tente outro horário.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-text-main p-6 relative">
      
      {/* Botão Fixo de Perfil no Topo Direito */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="absolute top-6 right-6 p-3 bg-white rounded-full shadow-sm text-primary hover:bg-primary-light transition flex items-center gap-2 px-4 z-20 border border-gray-100 cursor-pointer"
      >
        <UserIcon size={18} />
        <span className="text-xs font-medium">Minha Conta</span>
      </button>

      {/* Drawer Lateral de Conta */}
      <UserDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <div className="max-w-md mx-auto pt-8">
        
        {step < 3 && (
          <header className="flex items-center mb-8">
            <Link href="/" className="p-2 bg-white rounded-full shadow-sm text-primary hover:bg-primary-light transition">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-semibold ml-4">Agendar Horário</h1>
          </header>
        )}

        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-lg font-medium mb-4">1. Escolha o serviço</h2>
            <div className="space-y-3">
              {services.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => setSelectedService(svc.id)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 ${
                    selectedService === svc.id 
                      ? "border-primary bg-primary/5" 
                      : "border-transparent bg-white shadow-sm hover:border-primary-light"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-text-main">{svc.name}</span>
                    <span className="text-primary font-semibold">R$ {Number(svc.price).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center text-sm text-text-light mt-2">
                    <Clock size={14} className="mr-1" /> {svc.durationMinutes} min
                  </div>
                </button>
              ))}
            </div>
            
            <button
              disabled={!selectedService}
              onClick={() => setStep(2)}
              className="w-full mt-8 bg-primary text-white py-4 rounded-full font-medium disabled:opacity-50 hover:bg-primary-dark transition shadow-lg shadow-primary/20"
            >
              Continuar
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <h2 className="text-lg font-medium mb-4">2. Escolha data e hora</h2>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm mb-6 border border-gray-100">
              <label className="block text-sm font-medium text-text-main mb-2">Data</label>
              <div className="relative">
                <CalendarIcon size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
                <input 
                  type="date" 
                  value={date}
                  min={today}
                  onChange={(e) => { setDate(e.target.value); setErrorMsg(""); }}
                  className="w-full bg-background rounded-xl py-3 pl-10 pr-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <label className="block text-sm font-medium text-text-main mb-2 mt-5">Horário</label>
              <div className="relative">
                <Clock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => { setTime(e.target.value); setErrorMsg(""); }}
                  className="w-full bg-background rounded-xl py-3 pl-10 pr-4 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-xl border border-red-100">
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="w-1/3 py-4 rounded-full font-medium bg-white text-text-main shadow-sm border border-gray-100">
                Voltar
              </button>
              <button disabled={!date || !time || loading} onClick={handleAgendar} className="w-2/3 bg-primary text-white py-4 rounded-full font-medium disabled:opacity-50 flex justify-center items-center shadow-lg shadow-primary/20">
                {loading ? "Processando..." : "Confirmar"}
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center mt-12">
            <div className="text-primary mb-4 bg-primary/10 p-4 rounded-full">
              <AlertCircle size={48} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-text-main">Identifique-se</h2>
            <p className="text-text-light mb-8 max-w-xs">
              Para salvar seu agendamento, precisamos que você acesse sua conta.
            </p>
            {/* Em vez de levar para uma página separada, agora podemos abrir o Drawer diretamente se quisermos, ou manter o botão que abre o Drawer */}
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="w-full bg-primary text-white py-4 rounded-full font-medium flex justify-center hover:bg-primary-dark shadow-lg shadow-primary/30 transition"
            >
              Fazer Login ou Cadastrar
            </button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center text-center mt-12">
            <div className="text-green-500 mb-6 bg-green-50 p-5 rounded-full shadow-inner border border-green-100">
              <CheckCircle size={56} strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-text-main">Horário Confirmado!</h2>
            <p className="text-text-light mb-8 max-w-sm leading-relaxed">
              Tudo certo! Seu horário foi salvo. Se você ativou as notificações, enviaremos um lembrete no WhatsApp horas antes.
            </p>
            <Link href="/" className="w-full bg-background text-primary border-2 border-primary py-4 rounded-full font-medium flex justify-center hover:bg-primary hover:text-white transition-all">
              Voltar ao Início
            </Link>
          </motion.div>
        )}

      </div>
    </main>
  );
}
