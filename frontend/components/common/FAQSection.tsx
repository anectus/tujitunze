import FAQAccordion, { FAQItem } from "./FAQAccordion";

interface FAQSectionProps {
  title: string;
  description?: string;
  items: FAQItem[];
}

export default function FAQSection({ title, description, items }: FAQSectionProps) {

  return (

    <section className="bg-gradient-to-br from-emerald-50 to-white py-20 px-6">

      <div className="max-w-3xl mx-auto">

        <div className="text-center max-w-2xl mx-auto">

          <h2 className="text-[28px] md:text-[40px] font-bold text-emerald-800">
            {title}
          </h2>

          {description && (
            <p className="mt-4 text-base font-medium text-gray-600 leading-[1.7]">
              {description}
            </p>
          )}

        </div>

        <div className="mt-12">
          <FAQAccordion items={items} />
        </div>

      </div>

    </section>

  );
}
