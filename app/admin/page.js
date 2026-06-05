"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { useStore } from "../providers";

const EMPTY_PRODUCT = {
  name: "",
  description: "",
  price: "",
  image_url: "",
  category: "",
  stock: "",
};

const ORDER_STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"];

export default function AdminPage() {
  const { user, loading: authLoading } = useStore();
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState("products");

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecking(false);
      return;
    }
    async function checkRole() {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      setRole(data?.role || "customer");
      setChecking(false);
    }
    checkRole();
  }, [user, authLoading]);

  if (authLoading || checking) {
    return (
      <div className="container-x py-20 text-center text-gray-400 animate-pulse">
        Checking access…
      </div>
    );
  }

  if (!user || role !== "admin") {
    return (
      <div className="container-x py-16">
        <div className="card max-w-md mx-auto p-10 text-center">
          <p className="text-5xl mb-3">🚫</p>
          <h1 className="font-display text-xl font-bold text-ink mb-2">Admins only</h1>
          <p className="text-gray-500 mb-6">
            {user
              ? "Your account doesn't have admin access."
              : "Please log in with an admin account."}
          </p>
          <Link href="/" className="btn-primary">Back to shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-8 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-ink mb-1">Admin dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Manage products and orders.</p>

      <div className="flex gap-2 mb-6 border-b border-gray-100">
        {["products", "orders"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 -mb-px transition ${
              tab === t
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "products" ? <ProductsAdmin /> : <OrdersAdmin />}
    </div>
  );
}

/* ------------------------- PRODUCTS ------------------------- */
function ProductsAdmin() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // product id or 'new'
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("id", { ascending: true });
    setProducts(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startNew() {
    setForm(EMPTY_PRODUCT);
    setEditing("new");
    setError(null);
  }
  function startEdit(p) {
    setForm({
      name: p.name || "",
      description: p.description || "",
      price: p.price ?? "",
      image_url: p.image_url || "",
      category: p.category || "",
      stock: p.stock ?? "",
    });
    setEditing(p.id);
    setError(null);
  }
  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || form.price === "") {
      setError("Name and price are required.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price),
      image_url: form.image_url.trim() || null,
      category: form.category.trim() || null,
      stock: form.stock === "" ? 0 : Number(form.stock),
    };

    let res;
    if (editing === "new") {
      res = await supabase.from("products").insert(payload);
    } else {
      res = await supabase.from("products").update(payload).eq("id", editing);
    }
    setSaving(false);
    if (res.error) {
      setError(res.error.message);
      return;
    }
    setEditing(null);
    await load();
  }

  async function remove(id) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert("Could not delete: " + error.message);
      return;
    }
    await load();
  }

  if (loading) {
    return <p className="text-gray-400 animate-pulse">Loading products…</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{products.length} products</p>
        <button onClick={startNew} className="btn-primary text-sm py-2">+ Add product</button>
      </div>

      {/* Edit / new form */}
      {editing !== null && (
        <form onSubmit={save} className="card p-5 mb-5 space-y-4 animate-fade-up">
          <h3 className="font-display font-bold text-ink">
            {editing === "new" ? "New product" : `Edit product #${editing}`}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Name" value={form.name} onChange={(v) => setField("name", v)} required />
            <Field label="Category" value={form.category} onChange={(v) => setField("category", v)} />
            <Field label="Price (₹)" type="number" value={form.price} onChange={(v) => setField("price", v)} required />
            <Field label="Stock" type="number" value={form.stock} onChange={(v) => setField("stock", v)} />
          </div>
          <Field label="Image URL" value={form.image_url} onChange={(v) => setField("image_url", v)} />
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Description</label>
            <textarea
              className="input min-h-[80px] resize-y"
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
            />
          </div>
          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Product table */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-400 border-b border-gray-100">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 last:border-0">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image_url} alt="" className="w-9 h-9 rounded object-cover bg-gray-50" />
                    <span className="font-medium text-ink line-clamp-1 max-w-[180px]">{p.name}</span>
                  </div>
                </td>
                <td className="p-3 text-gray-500">{p.category}</td>
                <td className="p-3">₹{Number(p.price).toFixed(0)}</td>
                <td className="p-3">
                  <span className={p.stock <= 0 ? "text-red-500 font-semibold" : "text-gray-600"}>
                    {p.stock}
                  </span>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button onClick={() => startEdit(p)} className="text-brand-600 hover:underline mr-3">
                    Edit
                  </button>
                  <button onClick={() => remove(p.id)} className="text-red-500 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------- ORDERS ------------------------- */
function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id, status) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) {
      alert("Could not update: " + error.message);
      return;
    }
    setOrders((os) => os.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  if (loading) return <p className="text-gray-400 animate-pulse">Loading orders…</p>;
  if (orders.length === 0) return <p className="text-gray-500">No orders yet.</p>;

  return (
    <div className="space-y-3">
      {orders.map((o) => {
        const items = Array.isArray(o.items) ? o.items : [];
        return (
          <div key={o.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display font-bold text-ink">Order #{o.id}</p>
                <p className="text-xs text-gray-400">
                  {new Date(o.created_at).toLocaleString("en-IN")} •{" "}
                  {o.customer_name || "—"} • {o.phone || "—"} • {o.payment_method || "—"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display font-bold text-ink">
                  ₹{Number(o.total).toFixed(0)}
                </span>
                <select
                  value={(o.status || "pending").toLowerCase()}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="input py-1.5 text-sm w-auto"
                  aria-label={`Status for order ${o.id}`}
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {items.map((it) => `${it.name} ×${it.quantity}`).join(", ")}
            </p>
            {o.address && <p className="text-xs text-gray-400 mt-1">🚚 {o.address}</p>}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------- helpers ------------------------- */
function Field({ label, value, onChange, type = "text", required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-600 mb-1.5">
        {label}
        {required && <span className="text-red-400"> *</span>}
      </label>
      <input
        type={type}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}
