"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ScrollRevealSectionProps {
  mainHeading?: {
    line1: string;
    line2: string;
    line3: string;
  };
  sectionTag?: string;
  cardContent?: {
    title: string;
    description: string;
  };
  backgroundColor?: string;
}

const FeaturesSection = ({
  mainHeading = {
    line1: "Tecnología de vanguardia que revoluciona",
    line2: "Tu experiencia dental y la de",
    line3: "Nuestros pacientes",
  },

  backgroundColor = "bg-gray-50",
}: ScrollRevealSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Track scroll progress for this section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Transform scroll progress to opacity values
  const mainTextOpacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7],
    [0.3, 0.6, 1]
  );
  const cardOpacity = useTransform(
    scrollYProgress,
    [0.2, 0.5, 0.8],
    [0.4, 0.7, 1]
  );
  const cardY = useTransform(scrollYProgress, [0.2, 0.8], [100, 0]);

  return (
    <div
      ref={sectionRef}
      className={`${backgroundColor} min-h-screen relative overflow-hidden py-20 px-6`}
    >
      {/* Background decorative elements */}
      <div className="absolute top-[20%] left-[5%] w-96 h-96 rounded-full bg-blue-200/20 blur-3xl" />
      <div className="absolute bottom-[10%] right-[10%] w-80 h-80 rounded-full bg-purple-200/15 blur-3xl" />

      {/* Main content container */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Main heading with scroll-triggered opacity */}
        <motion.div
          className="text-center mb-20"
          style={{ opacity: mainTextOpacity }}
        >
          <motion.h2
            className="text-5xl md:text-6xl lg:text-7xl font-light text-gray-900 leading-tight tracking-tight"
            initial={{ y: 50 }}
            whileInView={{ y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {mainHeading.line1}
            <br />
            {mainHeading.line2}
            <br />
            {mainHeading.line3}
          </motion.h2>
        </motion.div>

        {/* Content grid */}

        {/* Additional scroll-triggered elements */}
        <motion.div
          className="mt-32 grid md:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2, staggerChildren: 0.2 }}
          viewport={{ once: true }}
        >
          {[
            {
              title: "Diagnóstico Digital Avanzado",
              desc: "Escáner 3D, radiografías digitales y análisis computarizado para diagnósticos precisos en minutos",
            },
            {
              title: "Tratamientos Mínimamente Invasivos",
              desc: "Láser dental, sedación consciente y técnicas de última generación para máximo confort",
            },
            {
              title: "Experiencia de Lujo",
              desc: "Desde consultas VIP hasta tratamientos personalizados con los más altos estándares de calidad",
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              className="text-center p-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">🦷</span>
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                {item.title}
              </h4>
              <p className="text-gray-600 text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default FeaturesSection;
