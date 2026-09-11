import { useEffect, useState } from "react";
import { Plus, Building2, Pencil } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { fetchHospitals, createHospital, updateHospital, uploadHospitalLogo } from "../../api/admin.api.js";
import { getImageUrl } from "../../utils/format.js";

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
            <HospitalCard key={h.id} hospital={h} user={user} onEdit={(h) => { setEditing(h); setShowModal(true); }} />
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

function HospitalCard({ hospital: h, user, onEdit }) {
  const [logoError, setLogoError] = useState(false);

  return (
    <Card>
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary overflow-hidden border border-border">
          {h.logoUrl && !logoError ? (
            <img
              src={getImageUrl(h.logoUrl)}
              alt={h.name}
              onError={() => setLogoError(true)}
              className="h-full w-full object-contain bg-white"
            />
          ) : (
            <Building2 size={18} />
          )}
        </div>
        {user?.role === "SUPER_ADMIN" && (
          <button onClick={() => onEdit(h)} className="text-muted hover:text-primary">
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
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(existing?.logoUrl ? getImageUrl(existing.logoUrl) : "");
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreviewError(false);
      setLogoPreview(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    try {
      let hospital;
      if (existing) {
        hospital = await updateHospital(existing.id, form);
      } else {
        hospital = await createHospital(form);
      }

      if (logoFile) {
        await uploadHospitalLogo(hospital.id, logoFile);
      }
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
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="bg-surfaceInset w-full rounded-lg border border-border px-3.5 py-2.5 font-body text-sm">
            <option>Hospital</option>
            <option>Diabetes Center</option>
            <option>Specialty Clinic</option>
          </select>
        </div>
        <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Input label="Contact Email" type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
        <Input label="Contact Phone" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
        
        <div>
          <label className="mb-1.5 block font-body text-sm font-medium text-ink">Hospital Logo</label>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-bg overflow-hidden">
              {logoPreview && !logoPreviewError ? (
                <img
                  src={logoPreview}
                  alt="Preview"
                  onError={() => setLogoPreviewError(true)}
                  className="h-full w-full object-contain"
                />
              ) : (
                <Building2 className="text-muted" size={20} />
              )}
            </div>
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
              onChange={handleLogoChange}
              className="font-body text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-primary-light file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary file:hover:bg-primary-light/80"
            />
          </div>
        </div>

        {error && <p className="font-body text-sm text-critical">{error}</p>}
        <Button type="submit" isLoading={isSaving} className="mt-2 w-full">{existing ? "Save Changes" : "Add Hospital"}</Button>
      </form>
    </Modal>
  );
}
