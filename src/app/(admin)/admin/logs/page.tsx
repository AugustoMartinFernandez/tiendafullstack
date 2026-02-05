import { getAuditLogs } from "@/lib/actions/logs";
import { LogsFilter } from "@/components/admin/LogsFilter";
import { Shield, AlertTriangle, Info, XCircle, User, Terminal, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LogsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const type = typeof params.type === "string" ? params.type : undefined;
  const startDate = typeof params.startDate === "string" ? params.startDate : undefined;
  const cursor = typeof params.cursor === "string" ? params.cursor : undefined;
  const dir = typeof params.dir === "string" && (params.dir === 'next' || params.dir === 'prev') ? params.dir : 'next';

  const { logs, firstId, lastId } = await getAuditLogs({ type, startDate, cursorId: cursor, direction: dir });

  // Helper para generar URLs de paginación manteniendo filtros
  const getPageUrl = (newCursor: string, newDir: 'next' | 'prev') => {
    const p = new URLSearchParams();
    if (type) p.set("type", type);
    if (startDate) p.set("startDate", startDate);
    p.set("cursor", newCursor);
    p.set("dir", newDir);
    return `?${p.toString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Auditoría del Sistema</h1>
        <p className="text-gray-500 mt-1">Registro de seguridad y operaciones críticas de la plataforma.</p>
      </div>

      <LogsFilter />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Nivel</th>
                <th className="px-6 py-4">Acción</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Metadatos</th>
                <th className="px-6 py-4 text-right">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Terminal className="w-8 h-8 text-gray-300" />
                      <p>No se encontraron registros con estos filtros.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 align-top">
                      <Badge type={log.type} />
                    </td>
                    <td className="px-6 py-4 align-top">
                      <p className="font-bold text-gray-900 font-mono text-xs">{log.action}</p>
                      {log.targetId && (
                        <p className="text-[10px] text-gray-400 mt-1">ID: {log.targetId}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 p-1 bg-gray-100 rounded text-gray-500">
                          <User className="w-3 h-3" />
                        </div>
                        <div>
                          <p className="font-bold text-xs text-gray-700 uppercase">{log.actorRole}</p>
                          <p className="text-[10px] font-mono text-gray-400" title={log.actorUid}>
                            {log.actorUid === "system" ? "SISTEMA" : log.actorUid.slice(0, 8) + "..."}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {log.metadata && Object.keys(log.metadata).length > 0 ? (
                        <pre className="text-[10px] bg-gray-50 p-2 rounded border border-gray-100 max-w-[300px] overflow-x-auto text-gray-600 font-mono">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-gray-300 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-top text-right whitespace-nowrap">
                      <p className="text-gray-900 font-medium text-xs">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-gray-400 text-[10px]">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginación */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-2">
            {/* Botón Anterior: Solo si hay cursor (no estamos en la primera página) */}
            {firstId && cursor && (
              <Link 
                href={getPageUrl(firstId, 'prev')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-3 h-3" /> Anterior
              </Link>
            )}
          </div>
          <div className="flex gap-2">
            {/* Botón Siguiente: Solo si llenamos la página (hay más probable) */}
            {lastId && logs.length >= 50 && (
              <Link 
                href={getPageUrl(lastId, 'next')}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                Siguiente <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ type }: { type: string }) {
  const styles = {
    INFO: "bg-blue-50 text-blue-700 border-blue-100",
    WARN: "bg-yellow-50 text-yellow-700 border-yellow-100",
    ERROR: "bg-red-50 text-red-700 border-red-100",
    SECURITY: "bg-purple-50 text-purple-700 border-purple-100",
  };
  
  const icons = {
    INFO: <Info className="w-3 h-3" />,
    WARN: <AlertTriangle className="w-3 h-3" />,
    ERROR: <XCircle className="w-3 h-3" />,
    SECURITY: <Shield className="w-3 h-3" />,
  };

  const t = type as keyof typeof styles;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${styles[t] || styles.INFO}`}>
      {icons[t]}
      {type}
    </span>
  );
}
