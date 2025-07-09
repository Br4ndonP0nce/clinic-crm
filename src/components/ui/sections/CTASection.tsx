"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface CTASectionProps {
  heading?: {
    line1: string;
    line2: string;
    line3?: string;
  };
  subheading?: string;
  primaryCTA?: {
    text: string;
    href: string;
  };
  secondaryCTA?: {
    text: string;
    href: string;
  };
  features?: string[];
  backgroundColor?: string;
}

const CTASection = ({
  heading = {
    line1: "Tu sonrisa perfecta",
    line2: "te está esperando",
    line3: "en Fleurs Dental Care",
  },
  subheading = "Únete a miles de pacientes que ya han transformado sus vidas con nuestros tratamientos de odontología de alta gama.",
  primaryCTA = {
    text: "Agenda tu Consulta ",
    href: "/agenda",
  },

  features = [
    "Consulta de evaluación gratuita",
    "Tecnología de vanguardia certificada",
    "Financiamiento sin intereses disponible",
    "Garantía de satisfacción total",
  ],
  backgroundColor = "bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900",
}: CTASectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Track scroll progress for this section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Transform scroll progress to create dynamic effects
  const headerY = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const headerOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    [0, 1, 1, 0.8]
  );
  const ctaScale = useTransform(scrollYProgress, [0.3, 0.6], [0.8, 1]);

  return (
    <div
      ref={sectionRef}
      className={`${backgroundColor}  relative overflow-hidden py-20 px-6`}
    >
      {/* Dynamic background effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      <div className="absolute top-[10%] left-[10%] w-96 h-96 rounded-full bg-blue-500/20 blur-3xl animate-pulse" />
      <div
        className="absolute bottom-[20%] right-[15%] w-80 h-80 rounded-full bg-purple-500/15 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-[60%] left-[20%] w-64 h-64 rounded-full bg-cyan-400/10 blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Main content container */}
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Main heading with dynamic positioning */}
        <motion.div
          className="text-center mb-16"
          style={{
            y: headerY,
            opacity: headerOpacity,
          }}
        >
          <motion.h2
            className="text-6xl md:text-7xl lg:text-8xl font-light text-white leading-tight tracking-tight mb-8"
            initial={{ y: 100, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true }}
            >
              {heading.line1}
            </motion.span>
            <br />
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
            >
              {heading.line2}
            </motion.span>
            {heading.line3 && (
              <>
                <br />
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                  viewport={{ once: true }}
                >
                  {heading.line3}
                </motion.span>
              </>
            )}
          </motion.h2>

          {/* Subheading */}
          <motion.p
            className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            viewport={{ once: true }}
          >
            {subheading}
          </motion.p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex items-center space-x-3 text-white/90"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
              viewport={{ once: true }}
            >
              <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20"
          style={{ scale: ctaScale }}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.0 }}
          viewport={{ once: true }}
        >
          {/* Primary CTA */}
          <motion.a
            href={primaryCTA.href}
            className="group relative inline-flex items-center gap-4 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 text-white px-10 py-5 rounded-full text-lg font-semibold hover:shadow-2xl transition-all duration-300 overflow-hidden"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(139, 92, 246, 0.3)",
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative flex items-center gap-4">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm font-bold">🦷</span>
              </div>
              {primaryCTA.text}
              <motion.span
                className="text-2xl"
                animate={{ x: [0, 6, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                →
              </motion.span>
            </div>

            {/* Shine effect */}
            <div className="absolute inset-0 -top-2 -bottom-2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </motion.a>

          {/* Contact Info */}
          <motion.div
            className="text-center text-white/70"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
            viewport={{ once: true }}
          >
            <p className="text-sm mb-1">O llámanos directamente:</p>
            <a
              href="tel:+523331234567"
              className="text-lg font-semibold text-white hover:text-cyan-400 transition-colors"
            >
              +52 (33) 3123-4567
            </a>
          </motion.div>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          viewport={{ once: true }}
        >
          <p className="text-white/60 text-sm mb-4">
            Certificados por las mejores instituciones dentales internacionales
          </p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            <div className="text-xs text-white/50">ISO 9001</div>
            <div className="w-1 h-1 bg-white/30 rounded-full"></div>
            <div className="text-xs text-white/50">FDA Aprobado</div>
            <div className="w-1 h-1 bg-white/30 rounded-full"></div>
            <div className="text-xs text-white/50">ADA Certificado</div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CTASection;
