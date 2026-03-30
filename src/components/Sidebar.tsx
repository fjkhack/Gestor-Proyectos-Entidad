"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  Users,
  CreditCard,
  FileText,
  TrendingUp,
  Menu,
  X,
  Database,
  Tags,
  Package,
  ShoppingCart,
  ShoppingBag,
  Contact,
  Power,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
  group?: string;
};

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  // Proyectos
  { name: "Proyectos", href: "/proyectos", icon: FolderOpen, group: "Gestión de Proyectos" },
  { name: "Calendario", href: "/calendario", icon: Calendar },
  { name: "Participantes", href: "/participantes", icon: Users },
  { name: "Ingresos", href: "/ingresos", icon: TrendingUp },
  { name: "Gastos", href: "/gastos", icon: CreditCard },
  { name: "Documentos", href: "/documentos", icon: FileText },
  // Merchandising
  { name: "Contactos", href: "/contactos", icon: Contact, group: "Merchandising" },
  { name: "Categorías", href: "/categorias", icon: Tags },
  { name: "Productos", href: "/productos", icon: Package },
  { name: "Ventas", href: "/ventas", icon: ShoppingCart },
  { name: "Compras", href: "/compras", icon: ShoppingBag },
  // Sistema
  { name: "Copias", href: "/copias", icon: Database, group: "Sistema" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const handleShutdown = async () => {
    if (window.confirm("¿Estás seguro de que deseas salir y apagar el gestor?")) {
      try {
        const response = await fetch("/api/shutdown", {
          method: "POST",
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          const message = body.message || body.error || "No se pudo apagar el servidor.";
          throw new Error(message);
        }

        // The script also ends when Node dies, so all terminals will close.
        window.close();
        
        // Fallback en caso de que un navegador normal bloquee window.close()
        setTimeout(() => {
          alert("El servidor se ha apagado. Ya puedes cerrar esta ventana.");
        }, 1000);
      } catch (error) {
        console.error("Error al intentar apagar:", error);
        alert(error instanceof Error ? error.message : "No se pudo apagar el servidor.");
      }
    }
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2 bg-white rounded-lg shadow-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors print:hidden"
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar-container fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r bg-white shadow-sm transition-transform duration-300 print:hidden ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between p-6">
          <h1 className="text-xl font-bold text-indigo-700">Portal AEMA III</h1>
          <button
            onClick={() => setOpen(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 px-4 mt-2 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <div key={item.href}>
                {item.group && (
                  <div className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider mt-5 mb-1.5 px-3">
                    {item.group}
                  </div>
                )}
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={handleShutdown}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <Power className="w-4 h-4" />
            Apagar Sistema
          </button>
          <div className="mt-2 text-xs text-gray-400 text-center">
            Versión 2.0.0
          </div>
        </div>
      </div>
    </>
  );
}
