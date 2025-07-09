"use client";

import React from "react";
import { motion } from "framer-motion";

interface EcoLandingPageProps {
  heading?: {
    line1: string;
    line2: string;
  };
  description?: string;
  ctaButton?: {
    text: string;
    href: string;
  };
}

const HeroSection = ({
  heading = {
    line1: "Fleurs Dental Care.",
    line2: "Sonrisas Perfectas.",
  },
  description = "Transformamos vidas a través de sonrisas radiantes. Odontología de alta gama con tecnología de vanguardia, tratamientos especializados y una experiencia que redefine el cuidado dental en México.",
  ctaButton = {
    text: "Agenda tu consulta de evaluación gratuita",
    href: "/agenda",
  },
}: EcoLandingPageProps) => {
  return (
    <div className="min-h-screen w-full bg-white relative overflow-hidden">
      {/* Amber Glow Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(125% 125% at 50% 90%, #ffffff 40%, #f59e0b 100%)
          `,
          backgroundSize: "100% 100%",
        }}
      />

      {/* Additional overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 to-transparent z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent z-10" />

      {/* Main Content */}
      <div className="relative z-20 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Heading */}
          <motion.div
            className="mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.h1
              className="text-7xl md:text-8xl lg:text-9xl font-light text-gray-800 leading-tight tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {heading.line1}
            </motion.h1>
            <motion.h1
              className="text-7xl md:text-8xl lg:text-9xl font-light bg-gradient-to-r from-amber-600 via-orange-500 to-amber-700 bg-clip-text text-transparent leading-tight tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              {heading.line2}
            </motion.h1>
          </motion.div>

          {/* CTA Button */}
          <motion.div
            className="mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <motion.a
              href={ctaButton.href}
              className="inline-flex items-center gap-3 bg-gray-800 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-700 transition-all duration-300 shadow-xl hover:shadow-2xl group"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-6 h-6 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">🦷</span>
              </div>
              {ctaButton.text}
              <motion.span
                className="text-xl"
                animate={{ x: [0, 4, 0] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                →
              </motion.span>
            </motion.a>
          </motion.div>

          {/* Description */}
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
          >
            <p className="text-gray-700 text-lg leading-relaxed font-light">
              {description}
            </p>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
          >
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">
                Más de 5,000 sonrisas transformadas
              </span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-sm">15+ años de experiencia</span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-gray-400 rounded-full"></div>
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Tecnología certificada FDA</span>
            </div>
          </motion.div>

          {/* Contact info */}
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.4 }}
          >
            <p className="text-gray-500 text-sm mb-2">
              ¿Prefieres hablar directamente con nosotros?
            </p>
            <a
              href="tel:+523331234567"
              className="text-gray-700 hover:text-amber-600 transition-colors text-lg font-medium"
            >
              📞 +52 (33) 3123-4567
            </a>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.6 }}
        >
          <motion.div
            className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              className="w-1 h-2 bg-gray-500 rounded-full mt-2"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default HeroSection;
