// Help & Support screen. Most of this is static content — guides/FAQs/
// troubleshooting text don't need a backend, they're just information.
// The one real piece is ticket submission, wired to a working endpoint.
//
// Deliberately OMITTED from the reference mockup: the "System Status"
// panel (live per-service operational indicators) and specific per-article
// deep content. Faking "All Systems Operational" against infrastructure
// that isn't actually monitored would be dishonest — that panel needs
// real monitoring wired up before it can honestly exist.

import { useState } from "react";
import { BookOpen, MessageSquare, Mail, Send } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { submitSupportTicket } from "../../api/support.api.js";

const ARTICLES = [
  { title: "How to add and manage patients", tag: "Patients", body: "Patients currently self-register with a hospital ID provided by your clinic. Once registered, use the Patients screen to view and monitor them." },
  { title: "Understanding Glucose Monitor", tag: "Glucose Monitor", body: "The Glucose Monitor screen shows a patient's trend chart, key stats (average, time-in-range, GMI), and a merged timeline of their logged events." },
  { title: "Managing Alerts", tag: "Alerts", body: "Alerts are generated automatically from logged glucose readings and missed daily logs, using the thresholds set in your Settings." },
  { title: "Scheduling Appointments", tag: "Appointments", body: "Use the Appointments screen to create, confirm, and track patient appointments — both in-clinic and video call." },
  { title: "Configuring Alert Thresholds", tag: "Settings", body: "Your Settings screen lets you set custom glucose thresholds that apply specifically to your assigned patients." },
];

export function HelpSupportPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <QuickLinkCard icon={BookOpen} title="Help Articles" body="Browse guidance on using the platform." />
        <QuickLinkCard icon={MessageSquare} title="FAQs" body="Answers to common questions." />
        <QuickLinkCard icon={Mail} title="Contact Support" body="Reach out directly for help." />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="mb-4 font-display text-sm font-bold text-ink">Help Articles</p>
          <ul className="flex flex-col gap-4">
            {ARTICLES.map((article) => (
              <li key={article.title} className="border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="mb-1 flex items-center gap-2">
                  <p className="font-body text-sm font-semibold text-ink">{article.title}</p>
                  <span className="rounded-full bg-primary-light px-2 py-0.5 font-body text-[10px] font-semibold text-primary">
                    {article.tag}
                  </span>
                </div>
                <p className="font-body text-sm text-muted">{article.body}</p>
              </li>
            ))}
          </ul>
        </Card>

        <SupportTicketForm />
      </div>
    </div>
  );
}

function QuickLinkCard({ icon: Icon, title, body }) {
  return (
    <Card className="p-4">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary">
        <Icon size={16} />
      </div>
      <p className="font-body text-sm font-semibold text-ink">{title}</p>
      <p className="font-body text-xs text-muted">{body}</p>
    </Card>
  );
}

function SupportTicketForm() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await submitSupportTicket({ subject, message });
      setSubmitted(true);
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't submit ticket.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <p className="mb-1 font-display text-sm font-bold text-ink">Submit a Ticket</p>
      <p className="mb-4 font-body text-xs text-muted">Raise a ticket and our team will get back to you.</p>

      {submitted ? (
        <p className="rounded-lg bg-success-light px-3 py-2.5 font-body text-sm text-success">
          Ticket submitted — thanks, we'll follow up soon.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <Input label="Subject" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Briefly describe the issue" />
          <div>
            <label className="mb-1.5 block font-body text-sm font-medium text-ink">Message</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-border px-3.5 py-2.5 font-body text-sm text-ink placeholder:text-muted/60 focus:border-primary"
              placeholder="Tell us what's going on"
            />
          </div>
          {error && <p className="font-body text-sm text-critical">{error}</p>}
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            <Send size={14} /> Submit Ticket
          </Button>
        </form>
      )}
    </Card>
  );
}
