import { z } from "zod";
import * as supportService from "../services/support.service.js";

const ticketSchema = z.object({
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

// Available to any authenticated role — see routes/support.routes.js.
export async function createTicketController(req, res) {
  const data = ticketSchema.parse(req.body);
  const ticket = await supportService.createTicket({
    userId: req.auth.userId,
    hospitalId: req.hospitalId || null,
    ...data,
  });
  res.status(201).json({ success: true, data: ticket });
}

export async function listTicketsController(req, res) {
  const status = req.query.status;
  const tickets = await supportService.listTickets({ hospitalId: req.hospitalId, status });
  res.json({ success: true, data: tickets });
}

export async function getTicketStatsController(req, res) {
  const stats = await supportService.getTicketStats(req.hospitalId);
  res.json({ success: true, data: stats });
}

const updateStatusSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED"]),
});

export async function updateTicketStatusController(req, res) {
  const { ticketId } = req.params;
  const { status } = updateStatusSchema.parse(req.body);
  const ticket = await supportService.updateTicketStatus(ticketId, req.hospitalId, status);
  res.json({ success: true, data: ticket });
}
