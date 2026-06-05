"use client";

import { useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    // Demo store: we acknowledge the message locally. Wire this to an email
    // service or a `contact_messages` table when you go live.
    setSent(true);
  }

  return (
    <div className="container-x py-10 animate-fade-in max-w-4xl">
      <span className="chip">Contact</span>
      <h1 className="font-display text-3xl font-bold text-ink mt-3">Get in touch</h1>
      <p className="text-gray-500 mt-2">
        We usually reply within one business day.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-8 items-start">
        {/* Contact details */}
        <div className="card p-6 space-y-4 text-sm">
          <div>
            <p className="text-gray-400">Email</p>
            <a href="mailto:help@toyzilla.example" className="text-brand-600 font-medium">
              help@toyzilla.example
            </a>
          </div>
          <div>
            <p className="text-gray-400">Phone</p>
            <p className="text-ink font-medium">+91 1800 123 456</p>
          </div>
          <div>
            <p className="text-gray-400">Hours</p>
            <p className="text-ink font-medium">Mon–Sat, 9am–7pm IST</p>
          </div>
        </div>

        {/* Form */}
        <div className="md:col-span-2">
          {sent ? (
            <div className="card p-10 text-center animate-fade-up">
              <p className="text-5xl mb-3">✅</p>
              <h2 className="font-display text-xl font-bold text-ink">Message sent!</h2>
              <p className="text-gray-500 mt-2">
                Thanks for reaching out, {form.name || "friend"}. We&apos;ll get back to
                you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="card p-6 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Name</label>
                  <input
                    className="input"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1.5">Message</label>
                <textarea
                  className="input min-h-[120px] resize-y"
                  value={form.message}
                  onChange={(e) => setField("message", e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary w-full">Send message</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
