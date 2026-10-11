// TODO: fill from guide
import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata = { title: "EGC Prototype" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar />
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}