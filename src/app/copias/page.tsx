"use client";

import { useState, useRef } from "react";
import { useToast } from "@/components/ui/Toast";
import { Download, Upload, AlertTriangle, Database } from "lucide-react";

export default function CopiasPage() {
  const { showToast } = useToast();
  const [adminToken, setAdminToken] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getApiErrorMessage = async (response: Response, fallback: string) => {
    try {
      const body = await response.json();
      return body.message || body.error || fallback;
    } catch {
      return fallback;
    }
  };

  const handleExport = async () => {
    const trimmedToken = adminToken.trim();
    if (!trimmedToken) {
      showToast("Introduce el token admin local para exportar.", "error");
      return;
    }

    try {
      const resp = await fetch("/api/backup/export", {
        method: "GET",
        headers: {
          "x-admin-token": trimmedToken,
        },
      });

      if (!resp.ok) {
        const msg = await getApiErrorMessage(resp, "No se pudo exportar la copia.");
        throw new Error(msg);
      }

      const blob = await resp.blob();
      const contentDisposition = resp.headers.get("Content-Disposition") || "";
      const fileNameMatch = contentDisposition.match(/filename="([^"]+)"/i);
      const fileName = fileNameMatch?.[1] || "backup_gestor.db";

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);

      showToast("Copia exportada correctamente.", "success");
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "No se pudo exportar la copia.", "error");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".db")) {
      showToast("El archivo debe tener la extensión .db", "error");
      setSelectedFile(null);
      setConfirmChecked(false);
      setConfirmText("");
      return;
    }

    setSelectedFile(file);
    setConfirmChecked(false);
    setConfirmText("");
    setIsDone(false);
  };

  const handleImport = async () => {
    const trimmedToken = adminToken.trim();

    if (!trimmedToken) {
      showToast("Introduce el token admin local para importar.", "error");
      return;
    }
    if (!selectedFile) {
      showToast("Selecciona primero un archivo .db.", "error");
      return;
    }
    if (!confirmChecked || confirmText !== "REEMPLAZAR") {
      showToast("Confirma la sustitución marcando la casilla y escribiendo REEMPLAZAR.", "error");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("dbBackup", selectedFile);

    try {
      const resp = await fetch("/api/backup/import", {
        method: "POST",
        headers: {
          "x-admin-token": trimmedToken,
        },
        body: formData,
      });

      if (!resp.ok) {
        const msg = await getApiErrorMessage(resp, "No se pudo importar la copia.");
        throw new Error(msg);
      }

      showToast("Copia importada. IMPORTANTE: Sigue las instrucciones.", "success");
      setIsDone(true);
      setSelectedFile(null);
      setConfirmChecked(false);
      setConfirmText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "Hubo un error al intentar subir la copia.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Database className="text-indigo-600" />
          Copias de Seguridad
        </h1>
        <p className="text-gray-500 mt-2">
          Gestiona los archivos de respaldo para no perder tu trabajo o para
          migrar la información a otro ordenador.
        </p>
      </div>

      <div className="mb-6 bg-white border rounded-xl p-5 shadow-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Token admin local</label>
        <input
          type="password"
          value={adminToken}
          onChange={(e) => setAdminToken(e.target.value)}
          placeholder="LOCAL_ADMIN_TOKEN"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-2">
          Requerido para exportar/importar copias. En local debe coincidir con <code>LOCAL_ADMIN_TOKEN</code>.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Exportar */}
        <div className="bg-white border rounded-xl p-6 shadow-sm hover:border-indigo-200 transition-colors">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <Download className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Exportar Datos</h2>
          <p className="text-sm text-gray-600 mb-6">
            Descarga un archivo con toda la información actual de tus proyectos, 
            gastos y documentos para guardarlo a salvo en tu ordenador o en un pendrive.
          </p>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Descargar Copia (.db)
          </button>
        </div>

        {/* Importar */}
        <div className="bg-white border rounded-xl p-6 shadow-sm hover:border-rose-200 transition-colors">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-4">
            <Upload className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Importar Datos</h2>
          <p className="text-sm text-gray-600 mb-6">
            Restaura una copia de seguridad anterior usando un archivo .db.
            <br />
            <br />
            <span className="font-semibold text-rose-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> 
              Atención: Los datos actuales se borrarán.
            </span>
          </p>

          <div className="space-y-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Seleccionar Archivo .db
            </button>

            <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              {selectedFile ? `Archivo seleccionado: ${selectedFile.name}` : "Ningún archivo seleccionado"}
            </div>

            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                className="mt-0.5"
                disabled={isUploading || isDone}
              />
              Confirmo que entiendo que este proceso reemplaza por completo la base de datos actual.
            </label>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Escribe REEMPLAZAR para confirmar</label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={isUploading || isDone}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <button
              onClick={handleImport}
              disabled={isUploading || isDone || !selectedFile || !confirmChecked || confirmText !== "REEMPLAZAR"}
              className="w-full flex items-center justify-center gap-2 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? "Importando..." : "Importar y Reemplazar"}
            </button>
          </div>
          
          <input
            type="file"
            accept=".db"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />

          {isDone && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-800 block text-sm">¡Importación Exitosa!</strong>
                <span className="text-amber-700 text-sm mt-1 block">
                  Cierra completamente esta ventana y también la <b>ventana negra</b> del servidor. Luego arranca el acceso directo de nuevo para que los datos nuevos entren en vigor.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
