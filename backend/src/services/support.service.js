// Support service — the one real backend piece behind the Help & Support
// screen. Everything else there (guides, FAQs, troubleshooting articles)
// is static content, not application data — doesn't need a service. No
// "System Status" backing here either: the reference mockup's live
// per-service status indicators would need real infrastructure monitoring
// this project doesn't have; faking "All Systems Operational" against
// nothing real would be dishonest, so that panel isn't implemented.

import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export async function createTicket({ userId, hospitalId, subject, message }) {
  return prisma.supportTicket.create({
    data: { userId, hospitalId, subject, message },
  });
}

// -----------------------------------------------------------------------
// Admin-side ticket management. hospitalId null = SUPER_ADMIN sees every
// ticket platform-wide; hospitalId set = HOSPITAL_ADMIN sees only tickets
// from users in their own hospital. Deliberately no SLA timers, agent
// workload balancing, or satisfaction-score analytics (per the blueprint —
// not meaningful without real ticket volume yet).
// -----------------------------------------------------------------------

export async function listTickets({ hospitalId, status }) {
  return prisma.supportTicket.findMany({
    where: {
      ...(hospitalId ? { hospitalId } : {}),
      ...(status ? { status } : {}),
    },
    include: { user: { select: { email: true, role: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTicketStats(hospitalId) {
  const base = hospitalId ? { hospitalId } : {};
  const [total, open, inProgress, resolved] = await Promise.all([
    prisma.supportTicket.count({ where: base }),
    prisma.supportTicket.count({ where: { ...base, status: "OPEN" } }),
    prisma.supportTicket.count({ where: { ...base, status: "IN_PROGRESS" } }),
    prisma.supportTicket.count({ where: { ...base, status: "RESOLVED" } }),
  ]);
  return { total, open, inProgress, resolved };
}

export async function updateTicketStatus(ticketId, hospitalId, status) {
  const where = hospitalId ? { id: ticketId, hospitalId } : { id: ticketId };
  const ticket = await prisma.supportTicket.findFirst({ where });
  if (!ticket) throw new AppError("Ticket not found", 404);
  return prisma.supportTicket.update({ where: { id: ticketId }, data: { status } });
}
