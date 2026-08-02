// Support service — the one real backend piece behind the Help & Support
// screen. Everything else there (guides, FAQs, troubleshooting articles)
// is static content, not application data — doesn't need a service. No
// "System Status" backing here either: the reference mockup's live
// per-service status indicators would need real infrastructure monitoring
// this project doesn't have; faking "All Systems Operational" against
// nothing real would be dishonest, so that panel isn't implemented.

import { prisma } from "../config/db.js";

export async function createTicket({ userId, hospitalId, subject, message }) {
  return prisma.supportTicket.create({
    data: { userId, hospitalId, subject, message },
  });
}
