// src/components/shop/receipt-uploader.tsx
"use client";

import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { submitReceipt } from "@/lib/actions/orders";
import { Loader2, Upload, Check, AlertCircle, FileText, Send } from "lucide-react";
import { Toast, ToastType } from "@/components/ui/toast";
import { formatPrice } from "@/lib/format";
import { StoragePaths } from "@/lib/storage-paths";

interface Props {
  orderId: string;
  userId: string;
  onSuccess?: () => void;
}

export function ReceiptUploader({ orderId, userId, onSuccess }: Props) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [amount, setAmount] = useState("");
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: ToastType }>({ show: false, msg: "", type: "success" });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo y tamaño (Max 5MB, Imagen o PDF)
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setToast({ show: true, msg: "Solo se permiten imágenes o PDF.", type: "error" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setToast({ show: true, msg: "El archivo no puede superar los 5MB.", type: "error" });
      return;
    }
    
    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !amount) return;
    
    setUploading(true);
    try {
      // 1. Subir a Firebase Storage
      const timestamp = Date.now();
      const storageRef = ref(storage, StoragePaths.receipts(userId, orderId, `${timestamp}_${selectedFile.name}`));
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      await uploadTask;
      const downloadUrl = await getDownloadURL(storageRef);

      // 2. Actualizar Firestore vía Server Action (Seguro)
      const fileType = selectedFile.type.startsWith("image/") ? 'image' : 'pdf';
      const result = await submitReceipt(orderId, downloadUrl, Number(amount), fileType);

      if (result.success) {
        setToast({ show: true, msg: "Comprobante enviado con éxito.", type: "success" });
        if (onSuccess) onSuccess();
      } else {
        setToast({ show: true, msg: result.message, type: "error" });
      }
    } catch (error) {
      console.error(error);
      setToast({ show: true, msg: "Error al subir el archivo.", type: "error" });
    } finally {
      setUploading(false);
      setSelectedFile(null);
      setAmount("");
    }
  };

  return (
    <div className="relative space-y-3">
      <Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      
      {!selectedFile ? (
        <>
          <input
            type="file"
            id={`upload-${orderId}`}
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
            accept="image/*,application/pdf"
          />
          <label
            htmlFor={`upload-${orderId}`}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold cursor-pointer transition-all bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-100"
          >
            <Upload className="h-4 w-4" />
            Seleccionar Comprobante
          </label>
        </>
      ) : (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
            <FileText className="h-4 w-4 text-indigo-500" />
            <span className="truncate flex-1">{selectedFile.name}</span>
            <button onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-700 font-bold px-2">X</button>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Monto Pagado</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-gray-800"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={uploading || !amount}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {uploading ? "Enviando..." : "Confirmar Envío"}
          </button>
        </div>
      )}
    </div>
  );
}
