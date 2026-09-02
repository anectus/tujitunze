"use client";

import Link from "next/link";

import { useLanguage } from "@/lib/context/LanguageContext";
import { heroTranslations } from "@/constants/translations/home";
import { useAuth } from "@/lib/hooks/useAuth";
import HeroIllustration from "@/components/home/HeroIllustration";

export default function Hero() {
  const { language } = useLanguage();
  const t = heroTranslations[language];
  const { isAuthenticated } = useAuth();

  return (
    <section className="pt-32 pb-20 bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-12 max-md:px-4">

      <div className="max-w-7xl mx-auto px-6 max-md:px-4">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-md:gap-8 items-center">


          {/* Left Side - Main Content */}
          <div className="max-md:text-center">

            <span className="inline-block bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-5">
              {t.badge}
            </span>


            <h1 className="text-5xl md:text-6xl max-md:text-4xl font-bold text-gray-900 leading-tight">

              {t.titleLine1}
              <span className="text-green-600">
                {t.titleHighlight}
              </span>

            </h1>


            <p className="mt-6 text-lg text-gray-600 leading-relaxed max-md:max-w-md max-md:mx-auto">

              {t.description}

            </p>


            {/* CTA — a single, bold "Get Started" button rather than a
                Sign Up / Login pair, so the hero has one clear focal
                action; Login stays reachable from the header. */}
            {!isAuthenticated && (
              <div className="mt-8 flex justify-center">
                <Link
                  href="/register"
                  className="
                  bg-black
                  text-white
                  font-semibold
                  inline-flex
                  items-center
                  gap-2
                  px-5
                  py-3
                  rounded-md
                  shadow-sm
                  hover:bg-gray-900
                  transition-colors
                  duration-300
                  ease-in-out
                  max-md:w-full max-md:justify-center"
                >
                  {t.getStarted}
                  <span className="text-green-500">→</span>
                </Link>
              </div>
            )}


          </div>



          {/* Right Side - Illustration */}
          <div className="relative max-md:order-first">
            <HeroIllustration />
          </div>


        </div>

      </div>

    </section>
  );
}
