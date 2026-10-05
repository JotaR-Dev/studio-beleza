"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, X, LogOut, Calendar, AlertCircle } from "lucide-react";
import { isAxiosError } from "axios";
import { api } from "@/services/api";
import { getApiErrorMessage } from "@/services/errorMessage";

interface UserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserDrawer({ isOpen, onClose }: UserDrawerProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tab, setTab] = useState<"login" | "register" | "profile" | "appointments">("login");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [userProfile, setUserProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
    currentPassword: "",
    newPassword: "",
    whatsappOptIn: true,
  });

  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const clearLocalSession = () => {
    localStorage.removeItem('@studio-beleza:token');
    setIsLoggedIn(false);
    setUserProfile(null);
    setAppointments([]);
    setTab("login");
  };

  // Verifica a sessão no servidor e carrega os dados da conta.
  const checkAuthAndFetchData = async () => {
    const token = localStorage.getItem('@studio-beleza:token');
    if (token) {
      setIsLoggedIn(true);
      setTab("appointments");
    }

    try {
      const [profileRes, apptsRes] = await Promise.all([
        api.get('/user/profile'),
        api.get('/user/appointments')
      ]);
      setIsLoggedIn(true);
      setTab("appointments");
      setUserProfile(profileRes.data);
      setFormData(prev => ({
        ...prev,
        firstName: profileRes.data.firstName || "",
        lastName: profileRes.data.lastName || "",
        email: profileRes.data.email || "",
        phone: profileRes.data.phone || "",
        whatsappOptIn: profileRes.data.whatsappOptIn ?? true,
      }));
      setAppointments(apptsRes.data);
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 401) {
        clearLocalSession();
      } else {
        setErrorMsg("Não foi possível carregar os dados da conta. Tente novamente.");
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setSuccessMsg("");
      checkAuthAndFetchData();
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      clearLocalSession();
    } catch (err: unknown) {
      console.error("Não foi possível encerrar a sessão:", err);
    }
  };

  const handlePhoneMask = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d{5})(\d{4})$/, '$1-$2')
      .slice(0, 15);
  };

  const checkPasswordStrength = (pass: string) => {
    if (pass.length < 6) return { text: "Fraca", color: "text-red-500 bg-red-50" };
    if (pass.match(/[A-Z]/) && pass.match(/[0-9]/) && pass.length >= 8) {
      return { text: "Forte", color: "text-green-600 bg-green-50" };
    }
    return { text: "Média", color: "text-amber-500 bg-amber-50" };
  };

  const handleSubmitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (tab === "register") {
        if (formData.password !== formData.confirmPassword) {
          setErrorMsg("As senhas não coincidem.");
          setLoading(false);
          return;
        }
        await api.post('/auth/register', formData);
      }

      const res = await api.post('/auth/login', {
        username: formData.username,
        password: formData.password,
      });

      if (res.data.token) {
        localStorage.setItem('@studio-beleza:token', res.data.token);
        // Atualiza imediatamente o estado do Drawer para logado e busca os dados
        await checkAuthAndFetchData();
      }
    } catch (err: unknown) {
      setErrorMsg(getApiErrorMessage(err, "Erro na autenticação. Verifique os dados."));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        whatsappOptIn: formData.whatsappOptIn,
      };

      if (formData.newPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      const res = await api.put('/user/profile', payload);
      setUserProfile(res.data.user);
      setSuccessMsg("Dados atualizados com sucesso!");
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "" }));
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Erro ao atualizar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;
    try {
      await api.put(`/user/appointments/${id}`, { action: 'cancel' });
      checkAuthAndFetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Não foi possível cancelar o agendamento.");
    }
  };

  const handleReschedule = async (id: string) => {
    if (!newDate || !newTime) {
      alert("Selecione a nova data e horário.");
      return;
    }
    try {
      const startsAt = new Date(`${newDate}T${newTime}:00`).toISOString();
      await api.put(`/user/appointments/${id}`, { action: 'reschedule', startsAt });
      setReschedulingId(null);
      setNewDate("");
      setNewTime("");
      checkAuthAndFetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || "Não foi possível remarcar.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-background">
              <h2 className="text-xl font-semibold text-text-main flex items-center gap-2">
                <User className="text-primary" size={22} />
                <span>{isLoggedIn ? `Olá, ${userProfile?.firstName || 'Cliente'}` : "Conta"}</span>
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200/50 transition cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {isLoggedIn && (
              <div className="flex border-b border-gray-100 bg-background/50">
                <button
                  onClick={() => setTab("appointments")}
                  className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
                    tab === "appointments" ? "border-primary text-primary bg-white" : "border-transparent text-text-light"
                  }`}
                >
                  Meus Agendamentos
                </button>
                <button
                  onClick={() => setTab("profile")}
                  className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
                    tab === "profile" ? "border-primary text-primary bg-white" : "border-transparent text-text-light"
                  }`}
                >
                  Meus Dados
                </button>
              </div>
            )}

            {!isLoggedIn && (
              <div className="flex border-b border-gray-100 bg-background/50">
                <button
                  onClick={() => setTab("login")}
                  className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
                    tab === "login" ? "border-primary text-primary bg-white" : "border-transparent text-text-light"
                  }`}
                >
                  Entrar
                </button>
                <button
                  onClick={() => setTab("register")}
                  className={`flex-1 py-3 text-sm font-medium border-b-2 transition ${
                    tab === "register" ? "border-primary text-primary bg-white" : "border-transparent text-text-light"
                  }`}
                >
                  Cadastrar
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {!isLoggedIn && tab === "login" && (
                <form onSubmit={handleSubmitAuth} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-light mb-1">Nome de Usuário</label>
                    <input
                      required
                      type="text"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-background rounded-xl p-3 text-sm border border-gray-100 focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-light mb-1">Senha</label>
                    <input
                      required
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-background rounded-xl p-3 text-sm border border-gray-100 focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                  </div>
                  {errorMsg && <p className="text-red-500 text-xs text-center font-medium">{errorMsg}</p>}
                  <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-full font-medium hover:bg-primary-dark transition shadow-md shadow-primary/20 cursor-pointer">
                    {loading ? "Entrando..." : "Entrar"}
                  </button>
                </form>
              )}

              {!isLoggedIn && tab === "register" && (
                <form onSubmit={handleSubmitAuth} className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-text-light mb-1">Nome</label>
                      <input
                        required
                        type="text"
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full bg-background rounded-xl p-3 text-sm border border-gray-100 focus:ring-2 focus:ring-primary/50 outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-text-light mb-1">Sobrenome</label>
                      <input
                        required
                        type="text"
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full bg-background rounded-xl p-3 text-sm border border-gray-100 focus:ring-2 focus:ring-primary/50 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-light mb-1">E-mail</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-background rounded-xl p-3 text-sm border border-gray-100 focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-light mb-1">Telefone (WhatsApp)</label>
                    <input
                      required
                      type="text"
                      placeholder="(21) 99999-9999"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: handlePhoneMask(e.target.value) })}
                      className="w-full bg-background rounded-xl p-3 text-sm border border-gray-100 focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-light mb-1">Nome de Usuário</label>
                    <input
                      required
                      type="text"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-background rounded-xl p-3 text-sm border border-gray-100 focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-medium text-text-light">Senha</label>
                      {formData.password && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${checkPasswordStrength(formData.password).color}`}>
                          {checkPasswordStrength(formData.password).text}
                        </span>
                      )}
                    </div>
                    <input
                      required
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-background rounded-xl p-3 text-sm border border-gray-100 focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-light mb-1">Confirmar Senha</label>
                    <input
                      required
                      type="password"
                      value={formData.confirmPassword}
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full bg-background rounded-xl p-3 text-sm border border-gray-100 focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                  </div>

                  <label className="flex items-start gap-2 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.whatsappOptIn}
                      onChange={e => setFormData({ ...formData, whatsappOptIn: e.target.checked })}
                      className="mt-1 accent-primary w-4 h-4"
                    />
                    <span className="text-xs text-text-light leading-relaxed">
                      Aceito receber lembretes dos meus agendamentos por WhatsApp.
                    </span>
                  </label>

                  {errorMsg && <p className="text-red-500 text-xs text-center font-medium">{errorMsg}</p>}
                  <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-full font-medium hover:bg-primary-dark transition shadow-md shadow-primary/20 cursor-pointer">
                    {loading ? "Cadastrando..." : "Criar Conta"}
                  </button>
                </form>
              )}

              {isLoggedIn && tab === "appointments" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-text-light mb-2">Seus Horários Agendados</h3>
                  {appointments.length === 0 ? (
                    <p className="text-center text-sm text-text-light py-8">Nenhum agendamento encontrado.</p>
                  ) : (
                    appointments.map(appt => {
                      const dateObj = new Date(appt.startsAt);
                      const now = new Date().getTime();
                      const diffHours = (dateObj.getTime() - now) / (1000 * 60 * 60);
                      const canModify = diffHours >= 24;
                      const isEditing = reschedulingId === appt.id;

                      return (
                        <div key={appt.id} className="bg-background p-4 rounded-2xl border border-gray-100 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-text-main">{appt.service.name}</h4>
                              <p className="text-xs text-text-light mt-1">
                                📅 {dateObj.toLocaleDateString('pt-BR')} às {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${appt.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {appt.status === 'CONFIRMED' ? 'Confirmado' : appt.status}
                            </span>
                          </div>

                          {!canModify && (
                            <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-xl flex items-center gap-1">
                              <AlertCircle size={14} /> Faltam menos de 24h. Remarcação/Cancelamento indisponíveis online.
                            </p>
                          )}

                          <div className="flex gap-2 pt-2 border-t border-gray-200">
                            <button
                              disabled={!canModify}
                              onClick={() => setReschedulingId(isEditing ? null : appt.id)}
                              className="flex-1 py-2 text-xs font-medium bg-white rounded-xl shadow-sm border border-gray-100 disabled:opacity-40 hover:text-primary transition cursor-pointer"
                            >
                              Remarcar
                            </button>
                            <button
                              disabled={!canModify}
                              onClick={() => handleCancelAppointment(appt.id)}
                              className="flex-1 py-2 text-xs font-medium bg-white text-red-500 rounded-xl shadow-sm border border-gray-100 disabled:opacity-40 hover:bg-red-50 transition cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </div>

                          {isEditing && (
                            <div className="pt-2 space-y-2 bg-white p-3 rounded-xl border border-gray-200">
                              <input
                                type="date"
                                value={newDate}
                                onChange={e => setNewDate(e.target.value)}
                                className="w-full text-xs p-2 bg-background rounded-lg border border-gray-100"
                              />
                              <input
                                type="time"
                                value={newTime}
                                onChange={e => setNewTime(e.target.value)}
                                className="w-full text-xs p-2 bg-background rounded-lg border border-gray-100"
                              />
                              <button
                                onClick={() => handleReschedule(appt.id)}
                                className="w-full bg-primary text-white text-xs py-2 rounded-lg font-medium cursor-pointer"
                              >
                                Confirmar Nova Data
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {isLoggedIn && tab === "profile" && (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-text-light mb-1">Nome</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full bg-background rounded-xl p-3 text-sm border border-gray-100 focus:ring-2 focus:ring-primary/50 outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-text-light mb-1">Sobrenome</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full bg-background rounded-xl p-3 text-sm border border-gray-100 focus:ring-2 focus:ring-primary/50 outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-light mb-1">E-mail</label>
                    <input
                      disabled
                      type="email"
                      value={formData.email}
                      className="w-full bg-gray-100 text-gray-500 rounded-xl p-3 text-sm border border-gray-100 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-light mb-1">Telefone (WhatsApp)</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: handlePhoneMask(e.target.value) })}
                      className="w-full bg-background rounded-xl p-3 text-sm border border-gray-100 focus:ring-2 focus:ring-primary/50 outline-none"
                    />
                  </div>

                  <label className="flex items-start gap-2 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.whatsappOptIn}
                      onChange={e => setFormData({ ...formData, whatsappOptIn: e.target.checked })}
                      className="mt-1 accent-primary w-4 h-4"
                    />
                    <span className="text-xs text-text-light">Aceito receber lembretes dos meus agendamentos por WhatsApp.</span>
                  </label>

                  <div className="pt-4 border-t border-gray-100 space-y-3">
                    <h4 className="text-xs font-semibold text-text-main uppercase tracking-wider">Alterar Senha (Opcional)</h4>
                    <div>
                      <label className="block text-xs font-medium text-text-light mb-1">Senha Atual</label>
                      <input
                        type="password"
                        placeholder="Digite para confirmar alteração"
                        value={formData.currentPassword}
                        onChange={e => setFormData({ ...formData, currentPassword: e.target.value })}
                        className="w-full bg-background rounded-xl p-3 text-sm border border-gray-100 focus:ring-2 focus:ring-primary/50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-text-light mb-1">Nova Senha</label>
                      <input
                        type="password"
                        placeholder="Deixe em branco para manter a atual"
                        value={formData.newPassword}
                        onChange={e => setFormData({ ...formData, newPassword: e.target.value })}
                        className="w-full bg-background rounded-xl p-3 text-sm border border-gray-100 focus:ring-2 focus:ring-primary/50 outline-none"
                      />
                    </div>
                  </div>

                  {errorMsg && <p className="text-red-500 text-xs text-center font-medium">{errorMsg}</p>}
                  {successMsg && <p className="text-green-600 text-xs text-center font-medium">{successMsg}</p>}

                  <button type="submit" disabled={loading} className="w-full bg-primary text-white py-3 rounded-full font-medium hover:bg-primary-dark transition shadow-md shadow-primary/20 cursor-pointer">
                    {loading ? "Salvando..." : "Salvar Alterações"}
                  </button>
                </form>
              )}

            </div>

            {isLoggedIn && (
              <div className="p-4 border-t border-gray-100 bg-background/50">
                <button
                  onClick={handleLogout}
                  className="w-full py-3 text-red-500 hover:bg-red-50 rounded-full text-sm font-medium flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Sair da Conta</span>
                </button>
              </div>
            )}

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
