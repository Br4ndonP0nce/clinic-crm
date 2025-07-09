"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

interface NavItem {
  label: string;
  href: string;
  isSpecial?: boolean;
}

interface NavbarProps {
  navItems?: NavItem[];
  logo?: {
    text: string;
    href: string;
  };
  socialLinks?: {
    discord?: string;
    twitter?: string;
  };
}

const defaultNavItems: NavItem[] = [
  { label: "Agenda", href: "/agenda", isSpecial: true },
];

const Navbar = ({
  navItems = defaultNavItems,
  logo = { text: "Fleurs", href: "/" },
  socialLinks = { discord: "#", twitter: "#" },
}: NavbarProps) => {
  return (
    <motion.nav
      className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4 "
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="flex items-center justify-center">
        {/* Main Navigation */}
        <motion.div
          className="flex items-center gap-8 bg-white/70 backdrop-blur-md rounded-full px-6 py-3 shadow-lg border border-white/20"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          {/* Logo */}
          <Link href={logo.href} className="flex items-center">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">F</span>
              </div>
              <span className="text-gray-900 font-medium text-lg">
                {logo.text}
              </span>
            </motion.div>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-6 ">
            {navItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                {item.isSpecial ? (
                  <Link
                    href={item.href}
                    className="bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <Link
                    href={item.href}
                    className="text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors duration-200 relative group"
                  >
                    {item.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gray-900 transition-all duration-200 group-hover:w-full" />
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Social Links */}
      </div>
    </motion.nav>
  );
};

export default Navbar;
