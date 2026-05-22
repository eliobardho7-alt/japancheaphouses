'use client';

import { useState } from 'react';
import { Send, Check, Heart } from 'lucide-react';

export default function InterestForm({ listingId, listingTitle, listingUrl }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!form.name || !form.email || !form.message) {
      setError('Please fill in all fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          subject: `Inquiry about listing #${listingId}: ${listingTitle}`,
          message:
            `Listing: ${listingTitle}\n` +
            `Source: ${listingUrl || 'manual entry'}\n` +
            `Listing ID: ${listingId}\n\n` +
            `--- Customer message ---\n${form.message}`,
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setSent(true);
    } catch (e) {
      setError('Could not send. Please try again or email eliobardho7@gmail.com directly.');
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center py-6">
        <Check className="h-10 w-10 text-green-600 mx-auto mb-2" />
        <p className="font-serif text-lg text-brand mb-1">Thanks for reaching out!</p>
        <p className="text-sm text-brand-gray">
          We'll be in touch about this property within 24 hours.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3"
      >
        <Heart className="h-4 w-4" />
        I'm Interested in this House
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-serif text-lg text-brand mb-1">Contact us about this house</h3>
      <p className="text-xs text-brand-gray mb-3">
        We'll respond within 24 hours with property details, viewing options, and next steps.
      </p>

      <input
        type="text"
        placeholder="Your name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full px-3 py-2 text-sm border border-brand-border"
      />
      <input
        type="email"
        placeholder="Your email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full px-3 py-2 text-sm border border-brand-border"
      />
      <textarea
        placeholder="What would you like to know? (e.g. viewing date, renovation costs, area info…)"
        rows={4}
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className="w-full px-3 py-2 text-sm border border-brand-border resize-none"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={submitting}
          className="btn-primary flex-grow flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Sending…' : 'Send Inquiry'}
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={submitting}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
