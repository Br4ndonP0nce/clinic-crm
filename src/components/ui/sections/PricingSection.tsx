"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ProductFeature {
  number: string;
  title: string;
  description: string;
  buttons?: {
    primary?: {
      text: string;
      href: string;
    };
    secondary?: {
      text: string;
      href: string;
    };
  };
  status?: "available" | "coming-soon";
}

interface ThreeProductsSectionProps {
  mainHeading?: {
    line1: string;
    line2: string;
  };
  products?: ProductFeature[];
  backgroundColor?: string;
}

const defaultProducts: ProductFeature[] = [
  {
    number: "01",
    title: "Odontología Estética",
    description:
      "Diseño de sonrisa digital, carillas de porcelana, blanqueamiento profesional y tratamientos cosméticos que transforman completamente tu imagen. Utilizamos la más alta tecnología para resultados naturales y duraderos.",
    buttons: {
      primary: {
        text: "Agenda tu cita hoy mismo",
        href: "/agenda",
      },
    },
    status: "available",
  },
  {
    number: "02",
    title: "Implantología Avanzada",
    description:
      "Implantes dentales de titanio grado médico con cirugía guiada por computadora. Reemplazos unitarios, rehabilitaciones completas y técnicas de carga inmediata para resultados predecibles y exitosos.",
    buttons: {
      primary: {
        text: "Evaluar mi Caso",
        href: "/agenda",
      },
    },
    status: "available",
  },
  {
    number: "03",
    title: "Ortodoncia ",
    description:
      "Alineadores transparentes personalizados y brackets estéticos de última generación. Corregimos malposiciones dentales con tratamientos discretos, cómodos y efectivos para todas las edades.",
    buttons: {
      primary: {
        text: "Simulación Gratuita",
        href: "/agenda",
      },
    },
    status: "available",
  },
];

const PricingSection = ({
  mainHeading = {
    line1: "Especialidades médicas que",
    line2: "transforman sonrisas",
  },
  products = defaultProducts,
  backgroundColor = "bg-gray-50",
}: ThreeProductsSectionProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Track scroll progress for this section
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // Transform scroll progress to opacity values
  const headerOpacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.5],
    [0.4, 0.7, 1]
  );

  return (
    <div
      ref={sectionRef}
      className={`${backgroundColor} min-h-screen relative overflow-hidden py-20 px-6`}
    >
      {/* Background decorative elements */}
      <div className="absolute top-[15%] right-[5%] w-96 h-96 rounded-full bg-blue-200/15 blur-3xl" />
      <div className="absolute bottom-[20%] left-[8%] w-80 h-80 rounded-full bg-purple-200/10 blur-3xl" />

      {/* Subtle background pattern lines */}
      <div className="absolute left-[15%] top-[30%] bottom-[10%] w-px bg-gradient-to-b from-transparent via-gray-300/40 to-transparent" />

      {/* Main content container */}
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Main heading with scroll-triggered opacity */}
        <motion.div
          className="text-center mb-24"
          style={{ opacity: headerOpacity }}
        >
          <motion.h2
            className="text-6xl md:text-7xl lg:text-8xl font-light text-gray-900 leading-tight tracking-tight"
            initial={{ y: 50 }}
            whileInView={{ y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: true }}
          >
            {mainHeading.line1}
            <br />
            {mainHeading.line2}
          </motion.h2>
        </motion.div>

        {/* Products grid */}
        <div className="space-y-24 md:space-y-32">
          {products.map((product, index) => (
            <motion.div
              key={product.number}
              className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start"
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: index * 0.2,
                ease: "easeOut",
              }}
              viewport={{ once: true, margin: "-100px" }}
            >
              {/* Left side - Product number and title */}
              <div className="lg:sticky lg:top-32">
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <span className="text-sm font-medium text-gray-400 tracking-wider">
                    {product.number}
                  </span>
                </motion.div>

                <motion.h3
                  className="text-4xl md:text-5xl font-light text-gray-900 mb-6"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  {product.title}
                </motion.h3>
              </div>

              {/* Right side - Description and actions */}
              <div className="space-y-8">
                <motion.p
                  className="text-lg md:text-xl text-gray-600 leading-relaxed font-light"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  {product.description}
                </motion.p>

                {/* Action buttons or status */}
                <motion.div
                  className="flex flex-col sm:flex-row gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  {product.status === "available" && product.buttons ? (
                    <>
                      {product.buttons.primary && (
                        <motion.a
                          href={product.buttons.primary.href}
                          className="inline-flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all duration-200 group"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="w-5 h-5 bg-white rounded flex items-center justify-center">
                            <span className="text-gray-900 text-xs font-bold">
                              🦷
                            </span>
                          </div>
                          {product.buttons.primary.text}
                          <motion.span
                            className="text-lg"
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
                      )}

                      {product.buttons.secondary && (
                        <motion.a
                          href={product.buttons.secondary.href}
                          className="inline-flex items-center gap-3 bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all duration-200 group"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="w-5 h-5 bg-gray-900 rounded flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                              🦷
                            </span>
                          </div>
                          {product.buttons.secondary.text}
                          <motion.span
                            className="text-lg"
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
                      )}
                    </>
                  ) : (
                    <div className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium tracking-wider">
                      DISPONIBLE
                    </div>
                  )}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom spacing */}
        <div className="h-24"></div>
      </div>
    </div>
  );
};

export default PricingSection;
