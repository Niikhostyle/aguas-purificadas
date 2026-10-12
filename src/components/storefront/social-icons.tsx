import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function InstagramIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5.5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.6" cy="6.4" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v3.5H8V21h3.5v-7.5H14l.6-3.5h-3.1V7.8c0-.7.5-1.3 1.3-1.3H15z" />
    </svg>
  );
}

export function YoutubeIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="m10 9 5 3-5 3z" fill="currentColor" />
    </svg>
  );
}

export type SocialLinks = { instagram?: string | null; facebook?: string | null; youtube?: string | null };

export function socialChannels(links: SocialLinks) {
  return [
    { key: "instagram", label: "Instagram", cta: "Síguenos", url: links.instagram, Icon: InstagramIcon },
    { key: "facebook", label: "Facebook", cta: "Síguenos", url: links.facebook, Icon: FacebookIcon },
    { key: "youtube", label: "YouTube", cta: "Ver canal", url: links.youtube, Icon: YoutubeIcon },
  ].filter((c): c is typeof c & { url: string } => Boolean(c.url));
}
