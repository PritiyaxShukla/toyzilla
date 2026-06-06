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

  // Not signed in → show the admin login form right here (no redirect to /login).
  if (!user) {
    return <AdminLogin />;
  }

  // Signed in but not an admin account.
  if (role !== "admin") {
    return (
      <div className="container-x py-16">
        <div className="card max-w-md mx-auto p-10 text-center">
          <p className="text-5xl mb-3">🚫</p>
          <h1 className="font-display text-xl font-bold text-ink mb-2">Admins only</h1>
          <p className="text-gray-500 mb-6">
            This account ({user.email}) doesn&apos;t have admin access.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => supabase.auth.signOut()} className="btn-ghost">
              Sign out
            </button>
            <Link href="/" className="btn-primary">Back to shop</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-8 animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-ink mb-1">Admin dashboard</h1>
      <p className="text-gray-500 text-sm mb-6">Manage products and orders.</p>

      <div className="flex gap-2 mb-6 border-b border-gray-100">
        {["products", "orders", "users"].map((t) => (
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

      {tab === "products" && <ProductsAdmin />}
      {tab === "orders" && <OrdersAdmin />}
      {tab === "users" && <UsersAdmin currentUserId={user.id} />}
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

/* ------------------------- USERS ------------------------- */
function UsersAdmin({ currentUserId }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setUsers(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(u) {
    const label = u.full_name || u.email || u.id;
    if (
      !confirm(
        `Permanently delete ${label}?\n\nThis erases their account and ALL their data ` +
          `(profile, orders, cart, wishlist, reviews). This CANNOT be undone.`
      )
    )
      return;

    setBusyId(u.id);
    setError(null);
    const { error } = await supabase.rpc("admin_delete_user", {
      target_user: u.id,
    });
    setBusyId(null);
    if (error) {
      setError(error.message);
      return;
    }
    setUsers((list) => list.filter((x) => x.id !== u.id));
  }

  if (loading) return <p className="text-gray-400 animate-pulse">Loading users…</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{users.length} users</p>
        <button onClick={load} className="btn-ghost text-sm py-2">↻ Refresh</button>
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-400 border-b border-gray-100">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Joined</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const isAdmin = u.role === "admin";
              return (
                <tr key={u.id} className="border-b border-gray-50 last:border-0">
                  <td className="p-3 font-medium text-ink">{u.full_name || "—"}</td>
                  <td className="p-3 text-gray-500">{u.email || "—"}</td>
                  <td className="p-3">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isAdmin
                          ? "bg-brand-50 text-brand-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 text-gray-400">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleDateString("en-IN")
                      : "—"}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {isSelf ? (
                      <span className="text-xs text-gray-300">you</span>
                    ) : isAdmin ? (
                      <span className="text-xs text-gray-300">admin</span>
                    ) : (
                      <button
                        onClick={() => remove(u)}
                        disabled={busyId === u.id}
                        className="text-red-500 hover:underline disabled:opacity-50"
                      >
                        {busyId === u.id ? "Deleting…" : "Delete"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Deleting a user permanently removes their account and all associated data
        from the database. Admin accounts and your own account are protected.
      </p>
    </div>
  );
}

/* ------------------------- ADMIN LOGIN ------------------------- */
function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleGoogleLogin() {
    // Lands back on /admin so the role check runs immediately after OAuth.
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/admin` },
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // On success the auth state updates and AdminPage re-renders into the
    // role check automatically — no redirect needed.
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fade-up">
      <div className="text-center mb-6">
        <p className="text-4xl mb-2">🔐</p>
        <h1 className="font-display text-2xl font-bold text-ink">Admin login</h1>
        <p className="text-gray-500 text-sm mt-1">Sign in to manage Toyzilla</p>
      </div>

      <div className="card p-6 sm:p-8">
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 border border-gray-200 bg-white rounded-xl py-2.5 font-medium text-ink hover:border-brand-400 hover:bg-gray-50 transition"
        >
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 my-5">
          <hr className="flex-1 border-brand-50" />
          <span className="text-xs text-gray-400">or use email</span>
          <hr className="flex-1 border-brand-50" />
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Admin email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-gray-600">Password</label>
              <Link
                href="/forgot-password"
                className="text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input pr-11"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>

      <p className="text-sm text-gray-500 mt-6 text-center">
        <Link href="/" className="text-brand-600 font-semibold hover:text-brand-700">
          ← Back to shop
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.1-6.1C34.46 3.19 29.5 1 24 1 14.82 1 7.07 6.48 3.64 14.29l7.1 5.52C12.4 13.72 17.73 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.42-4.75H24v9h12.67c-.55 2.96-2.2 5.47-4.68 7.16l7.18 5.58C43.46 37.48 46.5 31.42 46.5 24.5z"/>
      <path fill="#FBBC05" d="M10.74 28.19A14.6 14.6 0 0 1 9.5 24c0-1.45.25-2.85.7-4.17l-7.1-5.52A23.93 23.93 0 0 0 .5 24c0 3.87.92 7.53 2.56 10.77l7.68-6.58z"/>
      <path fill="#34A853" d="M24 47c5.52 0 10.15-1.83 13.53-4.96l-7.18-5.58C28.57 38.1 26.4 38.5 24 38.5c-6.27 0-11.6-4.22-13.26-9.81l-7.68 6.58C6.48 43.1 14.57 47 24 47z"/>
    </svg>
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
