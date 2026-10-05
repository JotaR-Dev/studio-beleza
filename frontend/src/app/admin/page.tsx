"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, User, ShieldAlert, Trash2, Edit3, ArrowLeft, X, Check } from "lucide-react";
import Link from "next/link";
import { api } from "@/services/api";

interface Appointment {
  id: string;
  startsAt: string;
  createdAt: string | null;
  updatedAt: string | null;
  status: string;
  service: {
    name: string;
    price: number;
    durationMinutes: number;
  };
  client: {
    firstName: string;
    lastName: string;
    phone: string;
  };
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  
  // Estados para o modal de reagendamento
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const fetchAppointments = useCallback(() => {
    api.get('/admin/appointments')
      .then(res => {
        setAppointments(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao carregar painel admin:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setUnauthorized(true);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchAppointments();
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') fetchAppointments();
    };
    const refreshInterval = window.setInterval(refreshIfVisible, 15000);
    window.addEventListener('focus', refreshIfVisible);
    document.addEventListener('visibilitychange', refreshIfVisible);

    return () => {
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', refreshIfVisible);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [fetchAppointments]);

  const handleCancel = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;
    
    try {
      await api.delete(`/admin/appointments/${id}`);
      setAppointments(appointments.filter(a => a.id !== id));
    } catch (error) {
      alert("Erro ao cancelar o agendamento.");
    }
  };

  const handleReschedule = async (id: string) => {
    if (!newDate || !newTime) {
      alert("Selecione a nova data e horário.");
      return;
    }

    try {
      const startsAt = new Date(`${newDate}T${newTime}:00`).toISOString();
      await api.put(`/admin/appointments/${id}`, { startsAt });
      
      setEditingId(null);
      setNewDate("");
      setNewTime("");
      fetchAppointments(); // Recarrega a lista
    } catch (error) {
      alert("Erro ao reagendar horário.");
    }
  };

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4 border border-red-100">
          <ShieldAlert size={40} />
        </div>
        <h1 className="text-2xl font-semibold mb-2">Acesso Restrito</h1>
        <p className="text-text-light mb-6 max-w-sm">
          Esta área é exclusiva para a administração do Studio.
        </p>
        <Link href="/login" className="bg-primary text-white px-8 py-3 rounded-full font-medium shadow-md shadow-primary/20 hover:bg-primary-dark transition">
          Fazer Login
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-text-main p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        
        <header className="flex justify-between items-center mb-8">
          <div>
            <Link href="/" className="inline-flex items-center text-sm text-text-light hover:text-primary mb-2 transition">
              <ArrowLeft size={16} className="mr-1" /> Voltar ao site
            </Link>
            <h1 className="text-3xl font-light tracking-tight">Painel da <span className="font-semibold text-primary">Administração</span></h1>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 text-sm font-medium text-text-light">
            Studio Control
          </div>
        </header>

        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium mb-6 flex items-center gap-2">
            <Calendar size={20} className="text-primary" />
            <span>Gerenciar Agendamentos</span>
          </h2>

          {loading ? (
            <p className="text-text-light text-center py-12 animate-pulse">Carregando agenda...</p>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-light mb-2">Nenhum agendamento encontrado no momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => {
                const dateObj = new Date(appt.startsAt);
                const formattedDate = dateObj.toLocaleDateString('pt-BR');
                const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                const isEditing = editingId === appt.id;
                const wasModified = Boolean(appt.createdAt && appt.updatedAt
                  && new Date(appt.updatedAt).getTime() > new Date(appt.createdAt).getTime());

                return (
                  <motion.div 
                    key={appt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col p-5 rounded-2xl bg-background border border-gray-100 hover:border-primary-light transition gap-4"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-main text-lg">{appt.service.name}</span>
                          <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-medium">
                            R$ {Number(appt.service.price).toFixed(2)}
                          </span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            appt.status === 'CANCELED'
                              ? "bg-red-50 text-red-600"
                              : appt.status === 'COMPLETED'
                                ? "bg-green-50 text-green-600"
                                : wasModified
                                  ? "bg-amber-50 text-amber-600"
                                : "bg-blue-50 text-blue-600"
                          }`}>
                            {appt.status === 'CANCELED'
                              ? "Cancelado pelo cliente"
                              : appt.status === 'COMPLETED'
                                ? "Concluído"
                                : wasModified
                                  ? "Alterado"
                                  : "Confirmado"}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-text-light gap-4">
                          <span className="flex items-center gap-1 font-medium text-text-main">
                            <User size={14} className="text-primary" /> {appt.client.firstName} {appt.client.lastName}
                          </span>
                          <span className="text-gray-400">|</span>
                          <span>WhatsApp: {appt.client.phone}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-gray-200">
                        <div className="flex items-center gap-2 text-sm font-medium text-text-main bg-white px-4 py-2 rounded-xl shadow-sm">
                          <Calendar size={16} className="text-primary" />
                          <span>{formattedDate}</span>
                          <Clock size={16} className="text-primary ml-2" />
                          <span>{formattedTime}</span>
                        </div>

                        {/* Botões de Ação do Admin */}
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setEditingId(isEditing ? null : appt.id)}
                            title="Reagendar"
                            className="p-2 text-text-light hover:text-primary bg-white rounded-xl shadow-sm border border-gray-100 transition"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button 
                            onClick={() => handleCancel(appt.id)}
                            title="Cancelar Agendamento"
                            className="p-2 text-red-400 hover:text-red-600 bg-white rounded-xl shadow-sm border border-gray-100 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Caixa retrátil para Reagendar */}
                    {isEditing && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-col md:flex-row items-center gap-3 pt-3 border-t border-gray-200">
                        <input 
                          type="date" 
                          value={newDate} 
                          onChange={(e) => setNewDate(e.target.value)}
                          className="bg-white rounded-xl p-2 text-sm border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <input 
                          type="time" 
                          value={newTime} 
                          onChange={(e) => setNewTime(e.target.value)}
                          className="bg-white rounded-xl p-2 text-sm border border-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button 
                          onClick={() => handleReschedule(appt.id)}
                          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1 hover:bg-primary-dark transition shadow-sm"
                        >
                          <Check size={16} /> Salvar Nova Data
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="text-text-light px-3 py-2 text-sm hover:text-text-main"
                        >
                          Cancelar
                        </button>
                      </motion.div>
                    )}

                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
