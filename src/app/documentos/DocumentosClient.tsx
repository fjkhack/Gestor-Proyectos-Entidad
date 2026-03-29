"use client";

import Link from "next/link";
import { FileText, FolderOpen, ExternalLink, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { SearchInput, EmptyState } from "@/components/ui/FormControls";
import { exportToCSV } from "@/lib/export";

type DocumentRow = {
  id: string;
  name: string;
  url: string;
  uploadDate: string;
  projectId: string;
  projectTitle: string;
};

export function DocumentosClient({ documents }: { documents: DocumentRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = documents.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.projectTitle.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    exportToCSV("documentos", ["Nombre", "URL", "Fecha", "Proyecto"], filtered.map(d => [
      d.name,
      d.url,
      format(new Date(d.uploadDate), "dd/MM/yyyy"),
      d.projectTitle,
    ]));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="w-8 h-8 text-indigo-600" />
          Archivo de Documentos
        </h1>
        <p className="text-gray-500 mt-1">Acceso rápido a todos los enlaces y documentos justificativos de la base de datos.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o proyecto..." className="flex-1 w-full sm:w-auto" />
        <button onClick={handleExport} className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" /> CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title={documents.length === 0 ? "El archivo está vacío" : "Sin resultados"}
            description={documents.length === 0 ? "Registra los memorandos o facturas adjuntas entrando a los proyectos creados." : "Prueba con otros términos de búsqueda."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4">Fecha Inserción</th>
                  <th className="px-6 py-4">Proyecto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50 transition-colors text-sm">
                    <td className="px-6 py-4">
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-indigo-600 hover:text-indigo-900 flex items-center gap-2 max-w-sm truncate"
                      >
                        <FileText className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{doc.name}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0 text-gray-400" />
                      </a>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {format(new Date(doc.uploadDate), "dd MMM yyyy", { locale: es })}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/proyectos/${doc.projectId}`} className="text-gray-700 hover:text-indigo-600 font-medium flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-gray-400" />
                        {doc.projectTitle}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 text-right">{filtered.length} de {documents.length} documentos</p>
    </div>
  );
}
