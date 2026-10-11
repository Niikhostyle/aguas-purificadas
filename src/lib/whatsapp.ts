/** Chile WhatsApp number digits only, e.g. 56912345678 */
export function whatsappNumber(): string {
  const raw = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "56900000000").replace(
    /\D/g,
    "",
  );
  return raw || "56900000000";
}

export function whatsappHref(text: string): string {
  return `https://wa.me/${whatsappNumber()}?text=${encodeURIComponent(text)}`;
}
