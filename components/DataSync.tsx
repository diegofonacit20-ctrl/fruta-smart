
import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudUpload, 
  Download, 
  RefreshCw, 
  Copy, 
  Check, 
  FileJson, 
  Mail, 
  Chrome,
  ShieldCheck,
  AlertCircle,
  Clock
} from 'lucide-react';
import { signInToGoogle, uploadToDrive, downloadFromDrive, initGoogleAuth, sendBackupByEmail } from '../services/googleDriveService';

interface DataSyncProps {
  onImport: (data: any) => void;
  onExport: () => any;
}

const DataSync: React.FC<DataSyncProps> = ({ onImport, onExport }) => {
  const [syncCode, setSyncCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(localStorage.getItem('fs_last_sync'));

  useEffect(() => {
    initGoogleAuth();
  }, []);

  const handleExportFile = () => {
    const data = onExport();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FrutaSmart_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleCopyCode = () => {
    const data = onExport();
    const code = btoa(JSON.stringify(data));
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportCode = () => {
    try {
      const data = JSON.parse(atob(syncCode));
      onImport(data);
      alert("¡Datos sincronizados correctamente!");
      setSyncCode('');
    } catch (e) {
      alert("Código de sincronización inválido.");
    }
  };

  const handleGoogleSync = async () => {
    setIsSyncing(true);
    signInToGoogle();
    
    // Esperamos un momento a que el usuario se autentique y luego intentamos subir
    setTimeout(async () => {
      const data = onExport();
      const result = await uploadToDrive(data);
      if (result) {
        const now = new Date().toLocaleString();
        setLastSync(now);
        localStorage.setItem('fs_last_sync', now);
        alert("¡Datos guardados en tu Google Drive exitosamente!");
      } else {
        alert("No se pudo sincronizar. Asegúrate de haber iniciado sesión correctamente.");
      }
      setIsSyncing(false);
    }, 5000); // Damos tiempo al popup de Google
  };

  const handleGoogleRestore = async () => {
    setIsSyncing(true);
    signInToGoogle();
    
    setTimeout(async () => {
      const data = await downloadFromDrive();
      if (data) {
        onImport(data);
        alert("¡Datos recuperados desde tu Google Drive!");
      } else {
        alert("No se encontró ningún respaldo en tu cuenta de Google.");
      }
      setIsSyncing(false);
    }, 5000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Sección Google Sync */}
      <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-gray-100 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <Chrome size={200} />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center">
          <div className="flex-1 space-y-6">
            <div className="flex items-center gap-4 text-emerald-600">
              <div className="bg-emerald-100 p-4 rounded-3xl">
                <ShieldCheck size={32} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Sincronización con Google</h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Tus datos seguros en tu cuenta personal</p>
              </div>
            </div>
            
            <p className="text-gray-500 font-medium leading-relaxed max-w-lg">
              Al conectar tu cuenta de Gmail, guardaremos una copia privada de tu negocio en tu Google Drive. Podrás recuperar tu inventario y ventas en cualquier otro dispositivo al instante.
            </p>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={handleGoogleSync}
                disabled={isSyncing}
                className="bg-gray-900 text-white px-8 py-5 rounded-2xl font-black flex items-center gap-3 shadow-2xl active:scale-95 transition-all hover:bg-black disabled:opacity-50"
              >
                {isSyncing ? <RefreshCw className="animate-spin" /> : <CloudUpload size={24} />}
                Guardar en la Nube
              </button>
              <button 
                onClick={handleGoogleRestore}
                disabled={isSyncing}
                className="bg-white border-4 border-emerald-500 text-emerald-600 px-8 py-5 rounded-2xl font-black flex items-center gap-3 shadow-xl active:scale-95 transition-all hover:bg-emerald-50 disabled:opacity-50"
              >
                <Download size={24} />
                Restaurar de la Nube
              </button>
            </div>

            {lastSync && (
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                <Clock size={14} />
                Última sincronización: {lastSync}
              </div>
            )}
          </div>

          <div className="w-full md:w-72 bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 text-center">
            <Mail size={40} className="mx-auto text-blue-500 mb-4" />
            <h4 className="font-black text-gray-800 mb-2">Respaldo por Correo</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase mb-6 leading-relaxed">
              Recibe un informe con todos tus datos directamente en tu bandeja de entrada.
            </p>
            <button 
              onClick={() => sendBackupByEmail(onExport())}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-xs uppercase shadow-lg shadow-blue-100 active:scale-95 transition-all"
            >
              Enviar a mi Gmail
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Exportar Manual */}
        <div className="p-10 bg-gray-50 rounded-[3rem] border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <FileJson className="text-gray-400" size={24} />
              <h3 className="text-xl font-black text-gray-800">Copia Manual (Archivo)</h3>
            </div>
            <p className="text-sm text-gray-500 font-medium leading-relaxed mb-8">
              Si prefieres no usar Google, puedes descargar un archivo de respaldo o copiar el código de seguridad para guardarlo en un bloc de notas.
            </p>
          </div>
          <div className="space-y-3">
            <button onClick={handleExportFile} className="w-full bg-white border-2 border-gray-200 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:border-gray-300 transition-all shadow-sm">
              <Download size={20} className="text-gray-400"/> Descargar Archivo .JSON
            </button>
            <button onClick={handleCopyCode} className="w-full bg-white border-2 border-gray-200 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all">
              {copied ? <Check size={20} className="text-emerald-500"/> : <Copy size={20} className="text-gray-400"/>}
              {copied ? "¡Código Copiado!" : "Copiar Código de Sincronización"}
            </button>
          </div>
        </div>

        {/* Importar Manual */}
        <div className="p-10 bg-white rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <RefreshCw className="text-emerald-500" size={24} />
            <h3 className="text-xl font-black text-gray-800">Importar Datos</h3>
          </div>
          <p className="text-sm text-gray-500 font-medium mb-6">Pega aquí el código de sincronización para restaurar tu negocio al instante.</p>
          <textarea 
            value={syncCode}
            onChange={(e) => setSyncCode(e.target.value)}
            placeholder="Pega el código aquí..."
            className="flex-1 w-full bg-gray-50 border border-gray-100 rounded-2xl p-6 font-mono text-[10px] resize-none mb-6 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          <button 
            disabled={!syncCode}
            onClick={handleImportCode}
            className="w-full bg-emerald-600 disabled:opacity-50 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 transition-all active:scale-95"
          >
            <RefreshCw size={20}/> Procesar Importación
          </button>
        </div>
      </div>

      <div className="bg-blue-50 p-8 rounded-[2rem] flex items-center gap-6 border border-blue-100">
        <AlertCircle className="text-blue-500 shrink-0" size={32} />
        <p className="text-xs text-blue-800 font-medium leading-relaxed">
          <b>Privacidad garantizada:</b> FrutaSmart no tiene acceso a tus correos ni archivos personales. La sincronización solo utiliza una carpeta especial de configuración creada específicamente para esta aplicación.
        </p>
      </div>
    </div>
  );
};

export default DataSync;
