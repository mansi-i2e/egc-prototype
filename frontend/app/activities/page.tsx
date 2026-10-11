// TODO: fill from guide
"use client";
import { useEffect, useMemo, useState } from "react";

type Vendor = { id: number; name: string };
type Activity = {
  id: number; title: string; owner: string | null; status: string; rag: string;
  start_date: string | null; end_date: string | null; vendor_id: number | null;
};
type Budget = { id: number; activity_id: number; planned: number };

const empty = { title: "", owner: "", status: "Planned", rag: "Green", start_date: "", end_date: "", vendor_id: "" };

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const fmt = (d: string | null) =>
  d ? new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export default function Activities() {
  const [items, setItems] = useState<Activity[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [budgetFor, setBudgetFor] = useState<Activity | null>(null);
  const [bf, setBf] = useState({ planned: "", forecast: "", actual: "" });

  const load = async () => {
    const [a, v, b] = await Promise.all([
      fetch("/api/activities").then((r) => r.json()),
      fetch("/api/vendors").then((r) => r.json()),
      fetch("/api/budgets").then((r) => r.json()),
    ]);
    setItems(a);
    setVendors(v);
    setBudgets(b);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  const vendorName = (id: number | null) => vendors.find((v) => v.id === id)?.name ?? "—";
  const budgetOf = (id: number) => budgets.filter((b) => b.activity_id === id).reduce((s, b) => s + b.planned, 0);

  const filtered = useMemo(
    () =>
      items.filter(
        (a) =>
          (statusFilter === "All" || a.status === statusFilter) &&
          (a.title + " " + (a.owner ?? "")).toLowerCase().includes(q.toLowerCase())
      ),
    [items, q, statusFilter]
  );

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        owner: form.owner || null,
        status: form.status,
        rag: form.rag,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        vendor_id: form.vendor_id ? Number(form.vendor_id) : null,
      }),
    });
    setForm(empty);
    setShowForm(false);
    load();
  }

  async function saveBudget(e: React.FormEvent) {
    e.preventDefault();
    if (!budgetFor) return;
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        activity_id: budgetFor.id,
        year: new Date().getFullYear(),
        planned: Number(bf.planned || 0),
        forecast: Number(bf.forecast || bf.planned || 0),
        actual: Number(bf.actual || 0),
      }),
    });
    setBudgetFor(null);
    setBf({ planned: "", forecast: "", actual: "" });
    load();
  }

  async function remove(id: number) {
    if (!confirm("Is activity ko delete karna hai?")) return;
    await fetch(`/api/activities/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Non-Study Activities</h1>
          <p className="muted">Data, publications, partnerships aur baaki evidence generation kaam</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close" : "+ New Activity"}
        </button>
      </div>

      {showForm && (
        <form className="panel" onSubmit={add}>
          <h2>Nayi Activity</h2>
          <div className="form-grid">
            <div className="field">
              <label>Title</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Real-world data study" required />
            </div>
            <div className="field">
              <label>Owner</label>
              <input value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Mansi" />
            </div>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option>Planned</option><option>In Progress</option><option>Completed</option>
              </select>
            </div>
            <div className="field">
              <label>RAG</label>
              <select value={form.rag} onChange={(e) => set("rag", e.target.value)}>
                <option>Green</option><option>Amber</option><option>Red</option>
              </select>
            </div>
            <div className="field">
              <label>Start date</label>
              <input type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
            </div>
            <div className="field">
              <label>End date</label>
              <input type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
            </div>
            <div className="field">
              <label>Vendor</label>
              <select value={form.vendor_id} onChange={(e) => set("vendor_id", e.target.value)}>
                <option value="">No vendor</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">Save</button>
            <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="toolbar">
        <input placeholder="🔍 Title ya owner se search karo" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All</option><option>Planned</option><option>In Progress</option><option>Completed</option>
        </select>
      </div>

      <div className="panel table-wrap">
        {loading ? (
          <div style={{ padding: 20 }}><div className="skeleton" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty"><span className="emoji">🧪</span>Koi activity nahi mili</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Activity</th><th>Status</th><th>RAG</th><th>Timeline</th><th>Vendor</th><th>Budget</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td className="cell-title"><b>{a.title}</b><small>{a.owner ?? "No owner"}</small></td>
                  <td><span className={`pill s-${a.status.replace(" ", "-")}`}>{a.status}</span></td>
                  <td><span className={`badge rag-${a.rag}`}>{a.rag}</span></td>
                  <td>{fmt(a.start_date)} → {fmt(a.end_date)}</td>
                  <td>{vendorName(a.vendor_id)}</td>
                  <td>{budgetOf(a.id) ? money(budgetOf(a.id)) : "—"}</td>
                  <td>
                    <div className="actions">
                      <button className="btn btn-ghost btn-sm" onClick={() => setBudgetFor(a)}>+ Budget</button>
                      <button className="btn btn-danger btn-sm" onClick={() => remove(a.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {budgetFor && (
        <div className="modal-backdrop" onClick={() => setBudgetFor(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={saveBudget}>
            <h2>Budget add karo</h2>
            <p className="muted">{budgetFor.title}</p>
            <div className="field">
              <label>Planned (USD)</label>
              <input type="number" min="0" step="any" value={bf.planned} onChange={(e) => setBf({ ...bf, planned: e.target.value })} required />
            </div>
            <div className="field">
              <label>Forecast (USD)</label>
              <input type="number" min="0" step="any" value={bf.forecast} onChange={(e) => setBf({ ...bf, forecast: e.target.value })} placeholder="Khali chhodo to planned jitna" />
            </div>
            <div className="field">
              <label>Actual (USD)</label>
              <input type="number" min="0" step="any" value={bf.actual} onChange={(e) => setBf({ ...bf, actual: e.target.value })} />
            </div>
            <div className="form-actions">
              <button className="btn btn-primary" type="submit">Save</button>
              <button className="btn btn-ghost" type="button" onClick={() => setBudgetFor(null)}>Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}