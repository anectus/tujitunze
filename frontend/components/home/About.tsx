"use client";

import { useLanguage } from "@/lib/context/LanguageContext";
import { publicAboutTranslations } from "@/constants/translations/public-about";

export default function About() {
  const { language } = useLanguage();
  const t = publicAboutTranslations[language];

  return (
    <section className="bg-white pt-36 pb-20 px-12">
      <div className="max-w-7xl mx-auto px-6">

        {/* Hero */}
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900">
            {t.heroTitle}
          </h1>

          <p className="mt-6 text-lg leading-8 text-gray-600">
            {t.heroDescription}
          </p>
        </div>

        {/* What is Tujitunze */}
        <div className="mt-20 bg-white rounded-2xl shadow-lg p-10">
          <h2 className="text-3xl font-bold text-blue-700">
            {t.whatIsTitle}
          </h2>

          <p className="mt-6 text-gray-600 leading-8">
            {t.whatIsBody}
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mt-12">

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-blue-700">
              {t.missionTitle}
            </h2>

            <p className="mt-5 text-gray-600 leading-8">
              {t.missionBody}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-blue-700">
              {t.visionTitle}
            </h2>

            <p className="mt-5 text-gray-600 leading-8">
              {t.visionBody}
            </p>
          </div>

        </div>

        {/* Objectives */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-10">
          <h2 className="text-3xl font-bold text-blue-700">
            {t.objectivesTitle}
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mt-8">

            <ul className="space-y-4 text-gray-700">
              <li>✔ {t.objective1}</li>
              <li>✔ {t.objective2}</li>
              <li>✔ {t.objective3}</li>
              <li>✔ {t.objective4}</li>
            </ul>

            <ul className="space-y-4 text-gray-700">
              <li>✔ {t.objective5}</li>
              <li>✔ {t.objective6}</li>
              <li>✔ {t.objective7}</li>
              <li>✔ {t.objective8}</li>
            </ul>

          </div>
        </div>

        {/* Core Values */}
        <div className="mt-16">

          <h2 className="text-3xl font-bold text-center text-blue-700">
            {t.coreValuesTitle}
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">

            {/* Security */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <h3 className="mt-4 text-xl font-bold">
                {t.securityTitle}
              </h3>

              <p className="mt-3 text-gray-600">
                {t.securityBody}
              </p>
            </div>

            {/* Trust */}
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <h3 className="mt-4 text-xl font-bold">
                {t.trustTitle}
              </h3>

              <p className="mt-3 text-gray-600">
                {t.trustBody}
              </p>
            </div>
          </div>
        </div>

        {/* Closing */}
        <div className="mt-20 bg-blue-700 rounded-3xl p-12 text-center text-white">

          <h2 className="text-4xl font-bold">
            {t.closingTitle}
          </h2>

          <p className="mt-6 text-lg leading-8 max-w-3xl mx-auto">
            {t.closingBody}
          </p>

        </div>

      </div>
    </section>
  );
}
