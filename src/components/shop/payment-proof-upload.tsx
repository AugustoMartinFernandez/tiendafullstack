"use client";

import { useState, useTransition } from "react";
import { uploadPaymentProof } from "@/lib/actions/orders";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { StoragePaths } from "@/lib/storage-paths";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

interface Props {
  orderId: string;
  userId: string;
}

export function PaymentProofUpload({ orderId, userId }: Props) {
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validaciones básicas
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Formato no válido. Usa JPG, PNG o PDF.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo es muy pesado (Máx 5MB).");
      return;
    }

    try {
      setUploading(true);
      
      // 1. Subir a Firebase Storage (Cliente)
      const path = StoragePaths.receipts(userId, orderId, `${Date.now()}_${file.name}`);
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      // 2. Registrar en Firestore (Server Action)
      const fileType = file.type === "application/pdf" ? "pdf" : "image";
      
      startTransition(async () => {
        const res = await uploadPaymentProof(orderId, url, fileType);
        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
        setUploading(false);
      });

    } catch (error) {
      console.error(error);
      toast.error("Error al subir el comprobante.");
      setUploading(false);
    }
  };

  return (
    <div className="mt-3">
      <input
        type="file"
        id={`proof-${orderId}`}
        className="hidden"
        accept="image/jpeg,image/png,application/pdf"
        onChange={handleFileChange}
        disabled={uploading || isPending}
      />
      <label
        htmlFor={`proof-${orderId}`}
        className={`flex items-center justify-center gap-2 w-full py-2 px-4 border border-dashed rounded-md cursor-pointer transition-all ${
          uploading || isPending
            ? "bg-gray-50 border-gray-300 text-gray-400 cursor-not-allowed"
            : "border-indigo-300 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-500"
        }`}
      >
        {uploading || isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        <span className="text-xs font-semibold">
          {uploading || isPending ? "Subiendo..." : "Subir Comprobante (PDF/Foto)"}
        </span>
      </label>
    </div>
  );
}
