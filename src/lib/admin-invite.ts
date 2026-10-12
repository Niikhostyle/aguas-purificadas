import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { platformUrl } from "@/lib/platform-url";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Issues a one-time password-setup link for an admin, revoking their previous unused links.
 * The raw token only lives in the returned URL.
 */
export async function createAdminInvite(adminUserId: string, tenantSlug: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
  await prisma.$transaction([
    prisma.adminInvite.deleteMany({ where: { adminUserId, usedAt: null } }),
    prisma.adminInvite.create({
      data: { adminUserId, tokenHash: hashToken(token), expiresAt },
    }),
  ]);
  return {
    url: platformUrl(`/admin/activar?token=${encodeURIComponent(token)}`, tenantSlug),
    expiresAt,
  };
}

/** Unused, unexpired invite for an active tenant, or null. */
export async function findValidInvite(token: string) {
  if (!token || token.length > 200) return null;
  const invite = await prisma.adminInvite.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { adminUser: { include: { tenant: true } } },
  });
  if (!invite || invite.usedAt || invite.expiresAt.getTime() < Date.now()) return null;
  if (!invite.adminUser.tenant.active) return null;
  return invite;
}

/** Marks the invite used; false if it was consumed concurrently. */
export async function consumeInvite(inviteId: string) {
  const res = await prisma.adminInvite.updateMany({
    where: { id: inviteId, usedAt: null },
    data: { usedAt: new Date() },
  });
  return res.count === 1;
}
