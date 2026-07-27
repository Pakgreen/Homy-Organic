import FAQAccordion from "@/components/FAQAccordion";

export const metadata = {
  title: "Frequently Asked Questions",
  description:
    "Find answers to frequently asked questions about our products and services.",
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-transparent pt-24 pb-16 flex justify-center">
      <div className="w-full">
        <FAQAccordion />
      </div>
    </div>
  );
}
