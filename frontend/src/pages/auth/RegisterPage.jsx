import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "./AuthLayout.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

// Only patients self-register (doctors/hospital admins are invited — see
// backend README). Hospital selection is a placeholder for now: there's no
// public "list hospitals" endpoint on the backend yet, so this defaults to
// a single hospital id from env. Once that endpoint exists, swap this for
// a real <select> populated from it — flagged in this project's README too.
const DEFAULT_HOSPITAL_ID = import.meta.env.VITE_DEFAULT_HOSPITAL_ID || "";

export function RegisterPage() {
  const { registerPatient } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    dateOfBirth: "",
    gender: "",
    hospitalId: DEFAULT_HOSPITAL_ID,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(key) {
    return (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      await registerPatient(form);
      navigate("/patient", { replace: true });
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (backendErrors) {
        // Zod validation errors from the backend — map field -> message so
        // each Input shows its own inline error, not one generic banner.
        const mapped = {};
        backendErrors.forEach(({ field, message }) => {
          mapped[field] = message;
        });
        setFieldErrors(mapped);
      } else {
        setFormError(err.response?.data?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your patient account"
      subtitle="Set up your account to start logging your data."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full name"
          value={form.fullName}
          onChange={updateField("fullName")}
          error={fieldErrors.fullName}
          placeholder="Jane Doe"
          required
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={updateField("email")}
          error={fieldErrors.email}
          placeholder="you@example.com"
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={updateField("password")}
          error={fieldErrors.password}
          placeholder="At least 8 characters"
          minLength={8}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date of birth"
            type="date"
            value={form.dateOfBirth}
            onChange={updateField("dateOfBirth")}
            error={fieldErrors.dateOfBirth}
          />
          <Input
            label="Gender"
            value={form.gender}
            onChange={updateField("gender")}
            error={fieldErrors.gender}
            placeholder="Optional"
          />
        </div>

        <Input
          label="Hospital ID"
          value={form.hospitalId}
          onChange={updateField("hospitalId")}
          error={fieldErrors.hospitalId}
          placeholder="Provided by your care team"
          required
        />

        {formError && (
          <p role="alert" className="rounded-lg bg-critical-light px-3 py-2 text-sm text-critical">
            {formError}
          </p>
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center font-body text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
