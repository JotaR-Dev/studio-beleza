"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Mail, Phone, MapPin, MessageCircle, Camera } from "lucide-react";
import Link from "next/link";
import UserDrawer from "@/components/UserDrawer";
import { useState } from "react";

export default function ContatoPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Substitua pelos links e dados reais do studio quando desejar
  const whatsappNumber = "5521970712551"; // Ex: DDI + DDD + Número
  const whatsappMessage = encodeURIComponent("Olá! Gostaria de tirar algumas dúvidas sobre os serviços do studio.");
  const instagramUrl = "https://instagram.com/yasmimapolinariobeauty";
  const emailAddress = "yayaalves577@gmail.com";
  const addressText = "Rua Doutor João Gomes, 5 - Bosque Fundo, Maricá - RJ (Shopping Roupa Mania, ao lado do Alphaville)";

  return (
    <main className="min-h-screen bg-background text-text-main flex flex-col justify-between relative overflow-hidden">
      
      {/* Cabeçalho Superior */}
      <header className="w-full max-w-7xl mx-auto p-6 flex justify-between items-center z-10">
        <Link href="/" className="inline-flex items-center text-sm text-text-light hover:text-primary transition bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
          <ArrowLeft size={16} className="mr-2" /> Voltar ao Início
        </Link>
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="text-xs font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 hover:bg-primary-light transition text-primary"
        >
          Minha Conta
        </button>
      </header>

      <UserDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Conteúdo Principal (2 Colunas) */}
      <div className="w-full max-w-6xl mx-auto px-6 py-4 grid grid-cols-1 lg:grid-cols-12 items-center gap-12 z-10">
        
        {/* Lado Esquerdo: Foto de corpo inteiro em PNG (Silhueta/Recorte) */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="lg:col-span-5 flex justify-center relative"
        >
          {/* Elemento de fundo suave para destacar a foto PNG */}
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl -z-10 w-72 h-72 m-auto" />
          
          <img
            src="/images/dona-silhueta.png"
            alt="Profissional do Studio"
            className="max-h-[500px] object-contain drop-shadow-xl"
          />
        </motion.div>

        {/* Lado Direito: Informações e Bio */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:col-span-7 space-y-6"
        >
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-semibold">Fale Conosco</span>
            <h1 className="text-4xl md:text-5xl font-light text-text-main mt-1 tracking-tight">
              Yasmim <span className="font-semibold text-primary">Appolinário</span>
            </h1>
          </div>

          <p className="text-text-light leading-relaxed text-sm md:text-base">
            Especialista em embelezamento de olhar e estética avançada. O nosso studio nasceu com o propósito de elevar a sua autoestima, proporcionando um atendimento humanizado, exclusivo e focado em realçar a sua beleza natural.
          </p>

          {/* Informações de Contato */}
          <div className="space-y-4 pt-2">
            
            {/* E-mail */}
            <div className="flex items-center gap-3 text-text-main bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                <Mail size={18} />
              </div>
              <div>
                <span className="block text-[11px] text-text-light font-medium">E-mail</span>
                <a href={`mailto:${emailAddress}`} className="text-sm font-medium hover:text-primary transition">{emailAddress}</a>
              </div>
            </div>

            {/* Telefone */}
            <div className="flex items-center gap-3 text-text-main bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                <Phone size={18} />
              </div>
              <div>
                <span className="block text-[11px] text-text-light font-medium">Telefone</span>
                <span className="text-sm font-medium">(21) 97071-2551</span>
              </div>
            </div>

            {/* Endereço */}
            <div className="flex items-center gap-3 text-text-main bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                <MapPin size={18} />
              </div>
              <div>
                <span className="block text-[11px] text-text-light font-medium">Endereço</span>
                <span className="text-sm font-medium">{addressText}</span>
              </div>
            </div>

          </div>

          {/* Botões Interativos (WhatsApp e Instagram) */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            
            {/* Botão WhatsApp */}
            <a 
              href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-[#25D366] hover:bg-[#20ba5a] text-white py-4 px-6 rounded-2xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-[#25D366]/20 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <MessageCircle size={20} />
              <span>Chamar no WhatsApp</span>
            </a>

            {/* Botão Instagram */}
            <a 
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white py-4 px-6 rounded-2xl font-medium flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Camera size={20} />
              <span>Seguir no Instagram</span>
            </a>

          </div>

        </motion.div>

      </div>

      <footer className="w-full text-center py-6 text-xs text-text-light z-10">
        © 2026 Studio de Beleza. Todos os direitos reservados.
      </footer>

    </main>
  );
}
