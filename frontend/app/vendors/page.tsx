// TODO: fill from guide
"use client";
import { useEffect, useState } from "react";

type Vendor = { id: number; name: string; country: string | null; status: string };
type Activity = { id: number; vendor_id: number | null };

const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");

  const load = async () => {
    const [v, a] = await Promise.all([
      fetch("/api/vendors").then((r) => r.json()),
      fetch("/api/activities").then((r) => r.json()),
    ]);
    setVendors(v);
    setActivities(a);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, country: country || null }),
    });
    setName("");
    setCountry("");
    setShowForm(false);
    load();
  }

  async function remove(id: number) {
    if (!confirm("Is vendor ko delete karna hai?")) return;
    await fetch(`/api/vendors/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Vendors</h1>
          <p className="muted">Bahar ki companies jo kaam mein help karti hain</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close" : "+ Add Vendor"}
        </button>
      </div>

      {showForm && (
        <form className="panel" onSubmit={add}>
          <h2>Naya Vendor</h2>
          <div className="form-grid">
            <div className="field">
              <label>Vendor name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Research" required />
            </div>
            <div className="field">
              <label>Country</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="India" />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">Save</button>
            <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="vendor-grid">{[1, 2, 3].map((i) => <div key={i} className="skeleton" />)}</div>
      ) : vendors.length === 0 ? (
        <div className="panel empty"><span className="emoji">🏢</span>Abhi koi vendor nahi hai. Upar se add karo.</div>
      ) : (
        <div className="vendor-grid">
          {vendors.map((v) => {
            const count = activities.filter((a) => a.vendor_id === v.id).length;
            return (
              <div className="panel vendor-card" key={v.id}>
                <div className="vendor-top">
                  <div className="avatar">{initials(v.name)}</div>
                  <div>
                    <b>{v.name}</b>
                    <div className="muted" style={{ fontSize: 13 }}>{v.country ?? "Country not set"}</div>
                  </div>
                </div>
                <div className="vendor-meta">
                  <span className={`pill s-${v.status}`}>{v.status}</span>
                  <span>{count} linked {count === 1 ? "activity" : "activities"}</span>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => remove(v.id)}>Delete</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}