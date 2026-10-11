// TODO: fill from guide
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/activities", label: "Activities", icon: "🧪" },
  { href: "/vendors", label: "Vendors", icon: "🏢" },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="logo">E</span>
        <div>
          <b>EGC</b>
          <small>Evidence Generation Center</small>
        </div>
      </div>
      <nav>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={`nav-link ${path === l.href ? "active" : ""}`}>
            <span>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
      <div className="sidebar-foot">Local prototype · v0.1</div>
    </aside>
  );
}