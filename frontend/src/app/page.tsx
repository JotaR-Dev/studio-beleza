"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Sparkles, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import UserDrawer from "@/components/UserDrawer";

export default function Home() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden bg-background">
      
      {/* Botão Fixo de Perfil no Topo Direito */}
      <button
        onClick={() => setIsDrawerOpen(true)}
        className="absolute top-6 right-6 p-3 bg-white rounded-full shadow-sm text-primary hover:bg-primary-light transition flex items-center gap-2 px-4 z-20 border border-gray-100 cursor-pointer"
      >
        <User size={18} />
        <span className="text-xs font-medium">Minha Conta</span>
      </button>

      {/* Drawer Lateral de Conta */}
      <UserDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Elementos decorativos de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-light/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />

      {/* Conteúdo Principal Animado */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 flex flex-col items-center text-center max-w-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
          className="bg-primary/10 p-4 rounded-full mb-6 text-primary"
        >
          <Sparkles size={32} strokeWidth={1.5} />
        </motion.div>

        <h1 className="text-4xl md:text-6xl font-light mb-4 tracking-tight text-text-main">
          Realce sua <span className="font-semibold text-primary">beleza natural</span>
        </h1>

        <p className="text-lg md:text-xl text-text-light mb-10 max-w-lg leading-relaxed">
          Especialistas em extensão de cílios e design de sobrancelhas.
          Um momento só seu, com o cuidado que você merece.
        </p>

        {/* Botão de Agendar que leva para a página correta */}
        <Link href="/agendar">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-primary text-white px-8 py-4 rounded-full font-medium flex items-center gap-3 shadow-lg shadow-primary/30 hover:bg-primary-dark transition-all duration-300"
          >
            <Calendar size={20} />
            <span>Agendar Meu Horário</span>
            <ChevronRight size={20} />
          </motion.button>
        </Link>
        <Link
          href="/contato"
          className="mt-3 rounded-full border border-primary/40 bg-white/70 px-6 py-3 text-sm font-medium text-primary shadow-sm transition hover:bg-primary/5"
        >
          Entre em contato
        </Link>
      </motion.div>

      <section
        aria-label="Formas de pagamento aceitas"
        className="absolute bottom-6 left-4 right-4 z-10 flex flex-col items-center gap-3"
      >
        <h2 className="text-xs font-medium uppercase tracking-wider text-text-light">
          Formas de pagamento
        </h2>
        <div className="flex flex-wrap justify-center gap-2 rounded-2xl border border-primary/10 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
          {["Mumbuca", "Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito"].map((paymentMethod) => (
            <span
              key={paymentMethod}
              className="rounded-full bg-primary/5 px-3 py-1.5 text-xs font-medium text-text-main"
            >
              {paymentMethod}
            </span>
          ))}
        </div>
      </section>
    </main>
  );
}
