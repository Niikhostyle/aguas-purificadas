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
      className="fixed bottom-5 right-5 z-40 inline-flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/20 transition hover:scale-105 hover:bg-[#1ebe5b] print:hidden"
    >
      <MessageCircle className="size-7" />
    </a>
  );
}
