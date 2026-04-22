import { prisma } from "@/lib/prisma";
import { AuditAction } from "@prisma/client";

export async function createAuditLog(params: {
  actorUserId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) {
  return prisma.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before ?? undefined,
      after: params.after ?? undefined,
    },
  });
}
