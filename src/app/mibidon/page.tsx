import { MiBidonLanding } from "@/components/mibidon/landing-page";
import { getLandingContent } from "@/lib/landing/content";

// Rendered per request from tag-cached CMS data, so a build without DB access never
// bakes the fallback copy into a static page. Saves call updateTag + revalidatePath.
export const dynamic = "force-dynamic";

export default async function MiBidonPage() {
  const content = await getLandingContent();
  return <MiBidonLanding content={content} />;
}
