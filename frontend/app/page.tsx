// TODO: fill from guide
"use client";
import { useEffect, useState } from "react";

type Summary = {
  total_activities: number;
  rag: Record<string, number>;
  budget: { planned: number; forecast: number; actual: number };
};
type Activity = { id: number; title: string; owner: string | null; status: string; rag: string; end_date: string | null };
type Budget = { id: number; activity_id: number; year: number; planned: number; forecast: number; actual: number };

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

function Kpi({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="kpi">
      <div className="kpi-icon">{icon}</div>
      <div>
        <small>{label}</small>
        <b>{value}</b>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<Summary | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/activities").then((r) => r.json()),
      fetch("/api/budgets").then((r) => r.json()),
    ]).then(([d, a, b]) => {
      setData(d);
      setActivities(a);
      setBudgets(b);
    });
  }, []);

  if (!data) {
    return (
      <div>
        <div className="page-head"><h1>Dashboard</h1></div>
        <div className="grid-kpi">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" />)}
        </div>
      </div>
    );
  }

  // ---- RAG donut ----
  const g = data.rag.Green ?? 0;
  const a = data.rag.Amber ?? 0;
  const r = data.rag.Red ?? 0;
  const total = g + a + r;
  const gp = total ? (g / total) * 100 : 0;
  const ap = total ? gp + (a / total) * 100 : 0;
  const donutBg = total
    ? `conic-gradient(var(--green) 0 ${gp}%, var(--amber) ${gp}% ${ap}%, var(--red) ${ap}% 100%)`
    : "var(--border)";

  // ---- Budget bars ----
  const { planned, forecast, actual } = data.budget;
  const max = Math.max(planned, forecast, actual, 1);
  const used = planned ? Math.round((actual / planned) * 100) : 0;

  // ---- Top budgets aur recent activities ----
  const title = (id: number) => activities.find((x) => x.id === id)?.title ?? `Activity #${id}`;
  const topBudgets = [...budgets].sort((x, y) => y.planned - x.planned).slice(0, 5);
  const recent = [...activities].reverse().slice(0, 5);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Medical Affairs portfolio ki ek nazar mein jhalak</p>
        </div>
      </div>

      <div className="grid-kpi">
        <Kpi icon="🧪" label="Total Activities" value={String(data.total_activities)} />
        <Kpi icon="💼" label="Planned Budget" value={money(planned)} />
        <Kpi icon="📈" label="Forecast" value={money(forecast)} />
        <Kpi icon="💸" label="Actual Spend" value={money(actual)} />
      </div>

      <div className="two-col" style={{ marginBottom: 24 }}>
        <section className="panel">
          <h2>Portfolio Health (RAG)</h2>
          <div className="donut-wrap">
            <div className="donut" style={{ background: donutBg }}>
              <div className="donut-hole">
                <b>{total}</b>
                <small>activities</small>
              </div>
            </div>
            <ul className="legend">
              <li><span className="dot" style={{ background: "var(--green)" }} /> Green: <b>{g}</b></li>
              <li><span className="dot" style={{ background: "var(--amber)" }} /> Amber: <b>{a}</b></li>
              <li><span className="dot" style={{ background: "var(--red)" }} /> Red: <b>{r}</b></li>
            </ul>
          </div>
        </section>

        <section className="panel">
          <h2>Budget Overview ({used}% planned use hua)</h2>
          {[
            { label: "Planned", v: planned, cls: "fill-primary" },
            { label: "Forecast", v: forecast, cls: "fill-amber" },
            { label: "Actual", v: actual, cls: "fill-green" },
          ].map((row) => (
            <div className="bar-row" key={row.label}>
              <div className="bar-label"><span>{row.label}</span><b>{money(row.v)}</b></div>
              <div className="bar-track">
                <div className={`bar-fill ${row.cls}`} style={{ width: `${(row.v / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </section>
      </div>

      <div className="two-col">
        <section className="panel">
          <h2>Top Budgets</h2>
          {topBudgets.length === 0 ? (
            <div className="empty"><span className="emoji">💼</span>Abhi koi budget nahi hai</div>
          ) : (
            topBudgets.map((b) => (
              <div className="bar-row" key={b.id}>
                <div className="bar-label"><span>{title(b.activity_id)}</span><b>{money(b.planned)}</b></div>
                <div className="bar-track">
                  <div className="bar-fill fill-primary" style={{ width: `${b.planned ? Math.min(100, (b.actual / b.planned) * 100) : 0}%` }} />
                </div>
              </div>
            ))
          )}
        </section>

        <section className="panel">
          <h2>Recent Activities</h2>
          {recent.length === 0 ? (
            <div className="empty"><span className="emoji">🧪</span>Abhi koi activity nahi hai</div>
          ) : (
            <ul className="list">
              {recent.map((x) => (
                <li key={x.id}>
                  <div>
                    <b>{x.title}</b>
                    <small>{x.owner ?? "No owner"} · {x.status}</small>
                  </div>
                  <span className={`badge rag-${x.rag}`}>{x.rag}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}