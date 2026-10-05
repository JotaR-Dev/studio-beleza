"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Smile, Lock, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/services/api"; // Usando o cliente seguro
import { getApiErrorMessage } from "@/services/errorMessage";

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    whatsappOptIn: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      let response;
      if (isLogin) {
        response = await api.post('/auth/login', {
          username: formData.username,
          password: formData.password,
        });
      } else {
        response = await api.post('/auth/register', formData);
      }
      
      if (response.data.token) {
        localStorage.setItem('@studio-beleza:token', response.data.token);
      }
      
      // Redireciona de volta para o agendamento com sucesso!
      router.push(response.data.role === "ADMIN" ? "/admin" : "/agendar");
      
    } catch (error: unknown) {
      console.error("Erro na autenticação:", error);
      setErrorMsg(getApiErrorMessage(error, "Ocorreu um erro. Tente novamente."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-text-main p-6 flex flex-col">
      <header className="flex items-center mb-8 pt-8 max-w-md mx-auto w-full">
        <button onClick={() => router.back()} className="p-2 bg-white rounded-full shadow-sm text-primary hover:bg-primary-light transition">
          <ArrowLeft size={20} />
        </button>
      </header>

      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full pb-12">
        <div className="flex w-full bg-white p-1 rounded-full shadow-sm mb-8 border border-gray-100">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setErrorMsg(""); }}
            className={`flex-1 py-3 text-sm font-medium rounded-full transition-all duration-300 ${
              isLogin ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-light hover:text-text-main"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setErrorMsg(""); }}
            className={`flex-1 py-3 text-sm font-medium rounded-full transition-all duration-300 ${
              !isLogin ? "bg-primary text-white shadow-md shadow-primary/20" : "text-text-light hover:text-text-main"
            }`}
          >
            Cadastrar
          </button>
        </div>

        <motion.div key={isLogin ? "login" : "register"} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="text-2xl font-semibold mb-2">{isLogin ? "Bem-vinda de volta!" : "Crie sua conta"}</h1>
          <p className="text-text-light mb-8 text-sm">{isLogin ? "Acesse para gerenciar seus horários." : "Preencha seus dados para agendar seus serviços."}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Smile size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                    <input required type="text" name="firstName" placeholder="Nome" value={formData.firstName} onChange={handleChange} className="w-full bg-white rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm border border-gray-50" />
                  </div>
                  <div className="relative flex-1">
                    <input required type="text" name="lastName" placeholder="Sobrenome" value={formData.lastName} onChange={handleChange} className="w-full bg-white rounded-2xl py-4 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm border border-gray-50" />
                  </div>
                </div>

                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                  <input required type="email" name="email" placeholder="E-mail" value={formData.email} onChange={handleChange} className="w-full bg-white rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm border border-gray-50" />
                </div>

                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                  <input required type="tel" name="phone" placeholder="WhatsApp" value={formData.phone} onChange={handleChange} className="w-full bg-white rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm border border-gray-50" />
                </div>
              </>
            )}

            <div className="relative">
              <Smile size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
              <input required type="text" name="username" placeholder="Nome de usuário" value={formData.username} onChange={handleChange} className="w-full bg-white rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm border border-gray-50" />
            </div>

            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
              <input required type="password" name="password" placeholder="Senha" value={formData.password} onChange={handleChange} className="w-full bg-white rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm border border-gray-50" />
            </div>

            {!isLogin && (
              <label className="flex items-start gap-3 mt-4 p-2 cursor-pointer">
                <input type="checkbox" name="whatsappOptIn" checked={formData.whatsappOptIn} onChange={handleChange} className="mt-1 accent-primary w-4 h-4" />
                <span className="text-xs text-text-light leading-relaxed">Aceito receber lembretes dos meus agendamentos via WhatsApp.</span>
              </label>
            )}

            {errorMsg && <p className="text-red-500 text-sm text-center font-medium mt-2">{errorMsg}</p>}

            <button type="submit" disabled={loading} className="w-full bg-primary text-white py-4 mt-6 rounded-full font-medium hover:bg-primary-dark transition shadow-lg shadow-primary/30 disabled:opacity-70 flex justify-center items-center">
              {loading ? "Aguarde..." : (isLogin ? "Entrar" : "Criar Conta")}
            </button>
          </form>
        </motion.div>
      </div>
    </main>
  );
}
