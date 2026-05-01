import { prisma } from "@/lib/prisma";

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  link?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        link: params.link || null,
      },
    });
  } catch (err) {
    console.error("Failed to create notification (non-blocking):", err);
  }
}

export async function notifyAllAdmins(params: {
  title: string;
  message: string;
  link?: string;
}) {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });
    if (admins.length === 0) return;
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        title: params.title,
        message: params.message,
        link: params.link || null,
      })),
    });
  } catch (err) {
    console.error("Failed to notify admins (non-blocking):", err);
  }
}
