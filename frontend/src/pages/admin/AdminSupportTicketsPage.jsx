// Support Tickets (admin view). Backed by the same SupportTicket data
// already collected from the doctor/patient Help & Support "Submit a
// Ticket" forms — this is just the management layer on top. Deliberately
// no SLA timers, agent workload, or satisfaction-score analytics (not
// meaningful without real ticket volume yet, per the blueprint).

import { useEffect, useState } from "react";
import { Card } from "../../components/ui/Card.jsx";
import { fetchTickets, fetchTicketStats, updateTicketStatus } from "../../api/admin.api.js";
import { formatRelativeTime } from "../../utils/format.js";

const STATUS_TABS = [
  { key: undefined, label: "All" },
  { key: "OPEN", label: "Open" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "RESOLVED", label: "Resolved" },
];

const STATUS_STYLES = {
  OPEN: "bg-critical-light text-critical",
  IN_PROGRESS: "bg-warning-light text-warning",
  RESOLVED: "bg-success-light text-success",
};

const ROLE_LABELS = { PATIENT: "Patient", DOCTOR: "Doctor", HOSPITAL_ADMIN: "Hospital Admin", SUPER_ADMIN: "Super Admin" };

export function AdminSupportTicketsPage() {
  const [status, setStatus] = useState(undefined);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  function load() {
    setIsLoading(true);
    Promise.all([fetchTickets({ status }), fetchTicketStats()])
      .then(([ticketsData, statsData]) => {
        setTickets(ticketsData);
        setStats(statsData);
      })
      .finally(() => setIsLoading(false));
  }

  useEffect(load, [status]);

  async function handleStatusChange(ticketId, newStatus) {
    await updateTicketStatus(ticketId, newStatus);
    load();
  }

  return (
    <div className="flex flex-col gap-5">
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total Tickets" value={stats.total} />
          <StatCard label="Open" value={stats.open} tone="critical" />
          <StatCard label="In Progress" value={stats.inProgress} tone="warning" />
          <StatCard label="Resolved" value={stats.resolved} tone="success" />
        </div>
      )}

      <div className="flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatus(tab.key)}
            className={`rounded-lg border px-3.5 py-2 font-body text-sm font-medium transition-colors ${
              status === tab.key ? "border-primary bg-primary-light text-primary" : "border-border bg-surface text-muted hover:bg-bg"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="p-0">
        {isLoading ? (
          <p className="px-5 py-10 text-center font-body text-sm text-muted">Loading tickets…</p>
        ) : tickets.length === 0 ? (
          <p className="px-5 py-10 text-center font-body text-sm text-muted">No tickets match this filter.</p>
        ) : (
          <ul>
            {tickets.map((ticket) => (
              <li key={ticket.id} className="border-b border-border px-5 py-4 last:border-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-body text-sm font-semibold text-ink">{ticket.subject}</p>
                      <span className="rounded-full bg-bg px-2 py-0.5 font-body text-[10px] font-semibold text-muted">
                        {ROLE_LABELS[ticket.user.role]}
                      </span>
                    </div>
                    <p className="mt-1 font-body text-sm text-muted">{ticket.message}</p>
                    <p className="mt-2 font-body text-xs text-muted">
                      {ticket.user.email} · {formatRelativeTime(ticket.createdAt)}
                    </p>
                  </div>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                    className={`shrink-0 rounded-full border-0 px-2.5 py-1 font-body text-xs font-semibold ${STATUS_STYLES[ticket.status]}`}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const toneClass = { critical: "text-critical", warning: "text-warning", success: "text-success" }[tone] || "text-ink";
  return (
    <Card className="p-4">
      <p className="font-body text-xs font-medium text-muted">{label}</p>
      <p className={`numeral mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </Card>
  );
}
