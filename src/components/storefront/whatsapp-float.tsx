import { MessageCircle } from "lucide-react";

export function WhatsappFloat({ href }: { href: string | null }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos por WhatsApp"
      title="Escríbenos por WhatsApp"
      className="sf-pop group fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-5 z-40 inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_12px_28px_-8px_rgba(37,211,102,0.65),0_4px_10px_rgba(0,0,0,0.12)] transition duration-300 [animation-delay:600ms] hover:-translate-y-0.5 hover:scale-105 hover:bg-[#1ebe5b] active:scale-95 print:hidden"
    >
      <span aria-hidden className="sf-ping absolute inset-0 rounded-full bg-[#25D366]" />
      <MessageCircle className="relative size-7 transition-transform duration-300 group-hover:-rotate-12" />
    </a>
  );
}
