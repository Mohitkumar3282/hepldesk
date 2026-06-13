import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createTicket } from '../services/ticketService.js';
import { CATEGORIES, PRIORITIES } from '../utils/constants.js';
import { useToast } from '../components/ToastProvider.jsx';

/**
 * Client-side validation that mirrors the backend rules exactly.
 * Returning the same shape as the API lets us merge server errors right in.
 */
function validate({ title, description, category, priority }) {
  const errors = {};
  if (!title.trim()) errors.title = 'Title is required';
  else if (title.trim().length < 5) errors.title = 'Title must be at least 5 characters';
  else if (title.trim().length > 100) errors.title = 'Title cannot exceed 100 characters';

  if (!description.trim()) errors.description = 'Description is required';
  else if (description.trim().length < 20)
    errors.description = 'Description must be at least 20 characters';

  if (!category) errors.category = 'Category is required';
  if (!priority) errors.priority = 'Priority is required';
  return errors;
}

export default function CreateTicketPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Bug',
    priority: 'Medium',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  function update(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: undefined }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitError(null);
    const v = validate(form);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setSubmitting(true);
    try {
      const created = await createTicket({
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
      });
      const agent = created.assignedAgent?.name;
      toast.success(
        agent
          ? `Ticket created and assigned to ${agent}`
          : 'Ticket created and queued (no agents available)'
      );
      navigate('/');
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors) setErrors(data.errors);
      setSubmitError(data?.message || err.message || 'Failed to create ticket');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Create Ticket</h1>
        <Link to="/" className="text-sm text-slate-500 hover:text-slate-700">
          ← Back
        </Link>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4 p-6" noValidate>
        <Field
          label="Title"
          hint="5 to 100 characters"
          error={errors.title}
          required
        >
          <input
            className="input"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            maxLength={120}
            placeholder="Short summary of the issue"
          />
        </Field>

        <Field
          label="Description"
          hint="At least 20 characters"
          error={errors.description}
          required
        >
          <textarea
            className="input min-h-[140px] resize-y"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="Describe what happened, what you expected, and any steps to reproduce."
          />
          <div className="mt-1 text-right text-[11px] text-slate-400">
            {form.description.trim().length}/20
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Category" error={errors.category} required>
            <select
              className="input"
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority" error={errors.priority} required>
            <select
              className="input"
              value={form.priority}
              onChange={(e) => update('priority', e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {submitError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Link to="/" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create Ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, hint, error, required, children }) {
  return (
    <div>
      <label className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
        {hint && <span className="text-[11px] font-normal text-slate-400">{hint}</span>}
      </label>
      {children}
      {error && <div className="mt-1 text-xs text-red-600">{error}</div>}
    </div>
  );
}
