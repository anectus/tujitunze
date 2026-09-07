"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

// Icons map 1:1 by position onto this page's 4 real questions (wallet
// vs. contributions, banks supported, hospital verification, member
// management) — not a generic decoration, so this doesn't relabel
// itself automatically if the question list's order or length changes.
const QUESTION_ICONS = ["💡", "🏦", "🏥", "👥"];

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export default function FAQAccordion({ items }: FAQAccordionProps) {

  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (

    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ staggerChildren: 0.1 }}
      className="space-y-4"
    >

      {items.map((item, index) => {

        const isOpen = openIndex === index;

        return (

          <motion.div
            key={item.question}
            variants={ITEM_VARIANTS}
            className={`
              rounded-2xl
              border
              shadow-md
              transition-colors
              duration-200
              ${isOpen ? "border-emerald-200 bg-emerald-50" : "border-gray-100 bg-white hover:border-emerald-200 hover:bg-emerald-50"}
            `}
          >

            <button
              type="button"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="
                w-full
                flex
                items-center
                justify-between
                gap-4
                text-left
                px-6
                py-5
                rounded-2xl
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-emerald-400
                focus-visible:ring-offset-2
              "
            >

              <span className="flex items-center gap-3 text-lg font-semibold text-gray-900">
                <span aria-hidden="true">{QUESTION_ICONS[index % QUESTION_ICONS.length]}</span>
                {item.question}
              </span>

              <span
                className={`
                  shrink-0
                  text-2xl
                  text-emerald-700
                  transition-transform
                  duration-300
                  ${isOpen ? "rotate-45" : ""}
                `}
              >
                +
              </span>

            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-5 text-base leading-[1.7] text-gray-600">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>

        );

      })}

    </motion.div>

  );
}
