// Hospitals / Clinics screen. With one real hospital right now, this list
// will show exactly one row — that's fine. The value is that the screen
// (and its backend) is already ready for hospital #2 without any changes.

import { useEffect, useState } from "react";
import { Plus, Building2, Pencil } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchHospitals, createHospital, updateHospital } from "../../api/admin.api.js";

export function AdminHospitalsPage() {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  function load() {
    setIsLoading(true);
    fetchHospitals().then(setHospitals).finally(() => setIsLoading(false));
  }

  useEffect(load, []);

  return (
    <div className="flex flex-col gap-5">
      {user?.role === "SUPER_ADMIN" && (
        <div className="flex justify-end">
          <Button onClick={() => { setEditing(null); setShowModal(true); }}>
            <Plus size={14} /> Add Hospital
          </Button>
        </div>
      )}

      {isLoading ? (
        <p className="font-body text-sm text-muted">Loading…</p>
      ) : hospitals.length === 0 ? (
        <Card><p className="font-body text-sm text-muted">No hospitals yet.</p></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {hospitals.map((h) => (
            <Card key={h.id}>
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
                  <Building2 size={18} />
                </div>
                {user?.role === "SUPER_ADMIN" && (
                  <button onClick={() => { setEditing(h); setShowModal(true); }} className="text-muted hover:text-primary">
                    <Pencil size={14} />
                  </button>
                )}
              </div>
              <p className="font-display text-sm font-bold text-ink">{h.name}</p>
              <p className="font-body text-xs text-muted">{h.type}</p>
              {h.address && <p className="mt-2 font-body text-xs text-muted">{h.address}</p>}
              <div className="mt-4 flex gap-4 border-t border-border pt-3">
                <div>
                  <p className="numeral text-lg font-semibold text-ink">{h.patientCount}</p>
                  <p className="font-body text-xs text-muted">Patients</p>
                </div>
                <div>
                  <p className="numeral text-lg font-semibold text-ink">{h.doctorCount}</p>
                  <p className="font-body text-xs text-muted">Doctors</p>
                </div>
                <span className={`ml-auto self-start rounded-full px-2 py-0.5 font-body text-[10px] font-semibold ${h.isActive ? "bg-success-light text-success" : "bg-bg text-muted"}`}>
                  {h.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <HospitalFormModal
          existing={editing}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load(); }}
        />
      )}
    </div>
  );
}

function HospitalFormModal({ existing, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: existing?.name || "",
    type: existing?.type || "Hospital",
    address: existing?.address || "",
    contactEmail: existing?.contactEmail || "",
    contactPhone: existing?.contactPhone || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      if (existing) await updateHospital(existing.id, form);
      else await createHospital(form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't save hospital.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal title={existing ? "Edit Hospital" : "Add Hospital"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <div>
          <label className="mb-1.5 block font-body text-sm font-medium text-ink">Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full rounded-lg border border-border px-3.5 py-2.5 font-body text-sm">
            <option>Hospital</option>
            <option>Diabetes Center</option>
            <option>Specialty Clinic</option>
          </select>
        </div>
        <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Input label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        <Input label="Contact Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
        {error && <p className="font-body text-sm text-critical">{error}</p>}
        <Button type="submit" isLoading={isSaving} className="mt-2 w-full">{existing ? "Save Changes" : "Add Hospital"}</Button>
      </form>
    </Modal>
  );
}
