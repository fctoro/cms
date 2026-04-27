
import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";

import { ThemeProvider } from "@/context/ThemeContext";
import Image from "next/image";
import Link from "next/link";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <ThemeProvider>
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col  dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full bg-brand-950 dark:bg-gray-950 relative lg:flex items-center justify-center hidden overflow-hidden">
            {/* Attractive Background Elements */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse duration-10000"></div>
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
            
            {/* Grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none"></div>

            <div className="relative z-10 flex flex-col items-center max-w-sm text-center p-10">
              <Link href="/" className="block mb-6 transition-transform hover:scale-105">
                <div className="flex flex-col items-center gap-5">
                    <Image
                      width={80}
                      height={80}
                      src="/images/logo/fc-toro.png"
                      alt="FC Toro"
                      className="object-contain drop-shadow-xl"
                    />
                  <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">FC Toro</h1>
                    <p className="text-xs font-bold text-brand-400 uppercase tracking-[0.2em] mt-2">CMS Editorial</p>
                  </div>
                </div>
              </Link>
              <div className="w-12 h-1 bg-brand-500/50 rounded-full mx-auto mb-6"></div>
              <p className="text-gray-400 text-sm leading-relaxed px-4">
                Espace de gestion officiel du site internet.
              </p>
            </div>
          </div>
          <div className="fixed bottom-6 right-6 z-50 hidden sm:block">
            <ThemeTogglerTwo />
          </div>
        </div>
      </ThemeProvider>
    </div>
  );
}
