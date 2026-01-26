// src/components/shop/receipt-uploader.tsx
"use client";

import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import { submitReceipt } from "@/lib/actions";
import { Loader2, Upload, Check, AlertCircle } from "lucide-react";
import { Toast, ToastType } from "@/components/ui/toast";

interface Props {
  orderId: string;
  userId: string;
  onSuccess?: () => void;
}

export function ReceiptUploader({ orderId, userId, onSuccess }: Props) {
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: ToastType }>({ show: false, msg: "", type: "success" });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploading(true);
    try {
      // 1. Subir a Firebase Storage
      const timestamp = Date.now();
      const storageRef = ref(storage, `receipts/${orderId}/${userId}_${timestamp}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await uploadTask;
      const downloadUrl = await getDownloadURL(storageRef);

      // 2. Actualizar Firestore vía Server Action (Seguro)
      const result = await submitReceipt(orderId, downloadUrl);

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
      // Limpiar input
      e.target.value = "";
    }
  };

  return (
    <div className="relative">
      <Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      
      <input
        type="file"
        id={`upload-${orderId}`}
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
        accept="image/*,application/pdf"
      />
      <label
        htmlFor={`upload-${orderId}`}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all
          ${uploading 
            ? "bg-gray-100 text-gray-400 cursor-wait" 
            : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700"
          }
        `}
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? "Subiendo..." : "Subir Comprobante"}
      </label>
    </div>
  );
}
