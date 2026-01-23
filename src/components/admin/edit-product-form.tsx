"use client";

import { updateProduct } from "@/lib/actions";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Product } from "@/lib/types";
import { Plus, Trash2, Save, ArrowLeft, UploadCloud, X, Box, Tag, FileText, Check, Crop as CropIcon, Printer } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toast, ToastType } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Cropper, { Area } from "react-easy-crop";

interface Props {
  product: Product;
}

// Componente auxiliar para manejar el estado de carga de cada imagen individualmente
function GalleryItem({ url, index, onRemove, onDragStart, onDragOver, onDrop }: { 
  url: string; 
  index: number; 
  onRemove: (i: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
}) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      className="group relative aspect-square rounded-3xl border border-gray-100 bg-gray-50 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-move"
    >
      <Image 
        src={url} 
        alt={`Imagen ${index + 1}`} 
        fill 
        className={cn(
          "object-cover transition-all duration-700 ease-in-out group-hover:scale-110",
          isLoading ? "scale-110 blur-xl grayscale" : "scale-100 blur-0 grayscale-0"
        )}
        sizes="(max-width: 768px) 50vw, 20vw"
        quality={60}
        onLoad={() => setIsLoading(false)}
        onError={() => setIsLoading(false)} // Si falla, quitamos el blur para ver el error
      />
      <button type="button" onClick={() => onRemove(index)} className="absolute top-2 right-2 p-1.5 bg-white/90 backdrop-blur-md text-red-500 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-lg hover:bg-red-500 hover:text-white z-10">
        <X className="h-4 w-4" />
      </button>
      {index === 0 && (
        <div className="absolute bottom-0 inset-x-0 bg-indigo-600/90 backdrop-blur-sm text-[9px] font-black text-white text-center py-2 uppercase tracking-widest">
          Portada
        </div>
      )}
    </div>
  );
}

// --- UTILIDAD DE COMPRESIÓN ---
const compressImage = (file: Blob, useWatermark: boolean, watermarkText: string, watermarkColor: string): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = document.createElement("img");
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        // 1. Redimensionar si es muy grande (Max 1200px de ancho)
        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        
        // 2. Dibujar en canvas
        ctx?.drawImage(img, 0, 0, width, height);
        
        // 3. Agregar Marca de Agua
        if (ctx && useWatermark) {
          const text = watermarkText; // Texto dinámico
          const fontSize = Math.max(20, width * 0.05); // Tamaño dinámico (5% del ancho)
          
          ctx.font = `900 ${fontSize}px sans-serif`;
          ctx.fillStyle = watermarkColor;
          ctx.textAlign = "right";
          ctx.textBaseline = "bottom";
          
          // Sombra para que se lea bien sobre fondos claros
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 4;
          
          const padding = width * 0.03; // Margen del 3%
          ctx.fillText(text, width - padding, height - padding);
        }
        
        // 4. Exportar como JPEG con calidad 0.7 (70%)
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Error al comprimir imagen"));
        }, "image/jpeg", 0.7);
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

// --- UTILIDADES DE RECORTE (CROP) ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new window.Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("No se pudo crear el contexto del canvas");

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas vacío"))), "image/jpeg", 1);
  });
}

// --- SUGERENCIAS DE SUBCATEGORÍAS ---
const SUB_CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  "Ropa": ["Remeras", "Pantalones", "Abrigos", "Vestidos", "Deportiva"],
  "Calzado": ["Zapatillas", "Botas", "Sandalias", "Formal"],
  "Tecnología": ["Celulares", "Accesorios", "Audio", "Computación"],
  "Comida": ["Quesillos", "Dulces", "Lácteos", "Regionales", "Bebidas"],
  "Herramientas": ["Manuales", "Eléctricas", "Jardinería"],
};

export function EditProductForm({ product }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState(product.description || "");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [category, setCategory] = useState(product.category);
  const [subCategory, setSubCategory] = useState(product.subCategory || "");
  
  // Estado para el Crop
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [useWatermark, setUseWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState("Doña Jovita");
  const [watermarkColor, setWatermarkColor] = useState("rgba(255, 255, 255, 0.6)");
  const [sku, setSku] = useState(product.sku || "");
  
  // --- PERSISTENCIA DE CONFIGURACIÓN (LocalStorage) ---
  useEffect(() => {
    const savedEnabled = localStorage.getItem("watermark_enabled");
    const savedText = localStorage.getItem("watermark_text");
    const savedColor = localStorage.getItem("watermark_color");
    if (savedEnabled !== null) setUseWatermark(savedEnabled === "true");
    if (savedText) setWatermarkText(savedText);
    if (savedColor) setWatermarkColor(savedColor);
  }, []);

  useEffect(() => {
    localStorage.setItem("watermark_enabled", String(useWatermark));
    localStorage.setItem("watermark_text", watermarkText);
    localStorage.setItem("watermark_color", watermarkColor);
  }, [useWatermark, watermarkText]);

  // Inicializamos el precio formateado (ej: "1.500")
  const [price, setPrice] = useState<string>(new Intl.NumberFormat("es-AR").format(product.price));
  
  // Estado para notificaciones
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: ToastType }>({ show: false, msg: "", type: "success" });
  
  // 1. SINCRONIZACIÓN DE IMÁGENES: Detecta si viene de la versión vieja o nueva
  const [images, setImages] = useState<string[]>(() => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images;
    }
    return product.imageUrl ? [product.imageUrl] : [];
  });

  // 2. SINCRONIZACIÓN DE ATRIBUTOS
  const [attributes, setAttributes] = useState(
    product.attributes 
      ? Object.entries(product.attributes).map(([key, value], index) => ({ 
          id: index, 
          name: key, 
          value: value 
        }))
      : []
  );

  const addAttribute = () => setAttributes([...attributes, { id: Date.now(), name: "", value: "" }]);
  const removeAttribute = (id: number) => setAttributes(attributes.filter((a) => a.id !== id));

  const showToast = (msg: string, type: ToastType) => {
    setToast({ show: true, msg, type });
  };

  // Formateador de precio en tiempo real
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Eliminamos todo lo que no sea número
    const rawValue = e.target.value.replace(/\D/g, "");
    
    // 2. Si está vacío, lo dejamos vacío
    if (rawValue === "") return setPrice("");

    // 3. Formateamos con puntos de mil (es-AR usa puntos para miles)
    const formatted = new Intl.NumberFormat("es-AR").format(Number(rawValue));
    setPrice(formatted);
  };

  // --- IMPRESIÓN DE ETIQUETAS ---
  const handlePrintLabel = () => {
    if (!sku) return showToast("Ingresá un SKU para imprimir.", "error");

    const printWindow = window.open("", "_blank", "width=500,height=600");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Etiqueta ${sku}</title>
            <style>
              body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .label { text-align: center; font-family: 'Arial', sans-serif; padding: 20px; }
              .product-name { font-size: 14px; font-weight: bold; margin-bottom: 5px; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0 auto 5px auto; }
            </style>
          </head>
          <body>
            <div class="label">
              <div class="product-name">${product.name}</div>
              <svg id="barcode"></svg>
            </div>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <script>
              try {
                JsBarcode("#barcode", "${sku}", {
                  format: "CODE128",
                  width: 2,
                  height: 60,
                  displayValue: true,
                  fontSize: 14,
                  margin: 10
                });
                window.onload = () => { window.print(); }
              } catch (e) { document.body.innerHTML = "Error: " + e.message; }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // --- LÓGICA DRAG AND DROP ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necesario para permitir el drop
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;

    const newImages = [...images];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedItem);

    setImages(newImages);
    setDraggedIndex(null);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("El archivo seleccionado no es una imagen válida.", "error");
      return;
    }

    // Validar tamaño (Máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast("El archivo es demasiado grande. Máximo 2MB.", "error");
      return;
    }

    // Leemos el archivo para mostrarlo en el Cropper
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setCropImage(reader.result as string);
    });
    reader.readAsDataURL(file);
    
    // Reseteamos el input para permitir seleccionar el mismo archivo si se cancela
    e.target.value = "";
  };

  const handleCropAndUpload = async () => {
    if (!cropImage || !croppedAreaPixels) return;

    setUploading(true);
    setLoading(true);
    setUploadProgress(0);
    
    try {
      // 1. Obtenemos el recorte
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
      
      // 2. Comprimimos el recorte
      const compressedBlob = await compressImage(croppedBlob, useWatermark, watermarkText, watermarkColor);

      showToast("Comprimiendo y aplicando marca de agua...", "success");
      // 3. Subimos a Firebase
      const storageRef = ref(storage, `products/${category}/${Date.now()}_cropped.jpg`);
      
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob);

      uploadTask.on("state_changed", (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      });

      await uploadTask;
      const url = await getDownloadURL(storageRef);
      setImages((prev) => [...prev, url]);
      
      // Cerramos el modal de crop
      setCropImage(null);
      showToast("Imagen procesada y subida correctamente.", "success");
    } catch (error) {
      showToast("Error crítico al subir imagen.", "error");
    } finally {
      setUploading(false);
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (images.length === 0) return showToast("El producto debe tener al menos una imagen.", "error");
    
    // Obtenemos el valor numérico limpio (sin puntos) para validación y envío
    const rawPrice = Number(price.replace(/\./g, ""));
    if (rawPrice < 0) return showToast("El precio no puede ser negativo.", "error");
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    // Inyectamos el ID y la Galería al FormData
    formData.set("id", product.id);
    formData.set("price", rawPrice.toString()); // Sobrescribimos con el número limpio
    formData.delete("images"); // Limpiamos por seguridad
    images.forEach(url => formData.append("images", url));

    try {
      const result = await updateProduct(formData);
      if (result.success) {
        router.push("/admin/productos");
        router.refresh();
      } else {
        showToast("Error del servidor: " + result.message, "error");
      }
    } catch (error) {
      showToast("Error de red o permisos.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-4 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 pb-24">
      {/* HEADER DEL FORMULARIO */}
      <div className="flex items-center justify-between border-b border-gray-50 pb-6">
        <Link href="/admin/productos" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-indigo-600 transition-all">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        <div className="flex items-center gap-2">
           <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Modo Edición Activo</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 items-start">
        {/* INFO BÁSICA */}
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest mb-3">
            <Tag className="h-3 w-3" /> Nombre Comercial
          </label>
          <input name="name" defaultValue={product.name} required className="w-full h-14 px-5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300" placeholder="Ej: Quesillo Premium Trancas" />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-3">SKU (Código Único)</label>
          <div className="flex gap-2">
            <input 
              name="sku" 
              value={sku} 
              onChange={(e) => setSku(e.target.value)} 
              className="w-full h-14 px-5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300" 
              placeholder="Ej: PROD-001" 
            />
            <button type="button" onClick={handlePrintLabel} className="h-14 w-14 flex items-center justify-center rounded-2xl bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 transition-colors" title="Imprimir Etiqueta">
              <Printer className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-3">Precio de Venta ($)</label>
            <input 
              type="text" 
              inputMode="numeric"
              name="price" 
              value={price} 
              onChange={handlePriceChange}
              required 
              className={cn(
                "w-full h-14 px-5 rounded-2xl border bg-gray-50/30 focus:bg-white focus:ring-4 outline-none transition-all font-bold text-gray-800",
                // Nota: La validación visual simple de negativo ya no aplica igual al ser texto formateado, pero el inputMode previene el signo menos fácilmente en móviles.
                "border-gray-100 focus:ring-indigo-500/10 focus:border-indigo-500"
              )} 
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-3">Precio de Lista (Tachado)</label>
            <input type="number" name="originalPrice" defaultValue={product.originalPrice || ""} className="w-full h-14 px-5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" />
          </div>
        </div>

        {/* DESCRIPCIÓN */}
        <div className="sm:col-span-2">
          <div className="flex justify-between mb-3">
            <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest">
              <FileText className="h-3 w-3" /> Descripción del Producto
            </label>
            <span className={cn("text-[10px] font-bold", description.length > 500 ? "text-red-500" : "text-indigo-400")}>
              {description.length}/500
            </span>
          </div>
          <textarea 
            name="description" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={4}
            className="w-full p-5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-gray-700 resize-none" 
            placeholder="Describí los detalles, materiales y beneficios..." 
          />
        </div>

        <div className="space-y-8">
          <div>
          </div>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-3">Categoría del Sistema</label>
            <select 
              name="category" 
              value={category} 
              onChange={(e) => {
                setCategory(e.target.value);
                setSubCategory(""); // Resetear subcategoría al cambiar categoría
              }}
              className="w-full h-14 px-5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 cursor-pointer"
            >
               {["Ropa", "Calzado", "Tecnología", "Herramientas", "Accesorios", "Comida", "Otros"].map(c => (
                 <option key={c} value={c}>{c}</option>
               ))}
            </select>
          </div>

          {/* SUBCATEGORÍA INTELIGENTE */}
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-3">Subcategoría</label>
            <input 
              list="subcategories-list"
              name="subCategory"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              placeholder="Ej: Quesillos"
              className="w-full h-14 px-5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800"
            />
            <datalist id="subcategories-list">
              {SUB_CATEGORY_SUGGESTIONS[category]?.map((sub) => (
                <option key={sub} value={sub} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest mb-3">
              <Box className="h-3 w-3" /> Unidades en Stock
            </label>
            <input type="number" name="stock" defaultValue={product.stock} className="w-full h-14 px-5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" />
          </div>
        </div>

        {/* --- GALERÍA PRO --- */}
        <div className="sm:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-black uppercase text-gray-400 tracking-widest">Galería Visual ({images.length}/5)</label>
            <span className="text-[10px] font-bold text-indigo-500">JPG, PNG o WEBP</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            {images.map((url, index) => (
              <GalleryItem 
                key={url} 
                url={url} 
                index={index} 
                onRemove={removeImage} 
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              />
            ))}
            
            {images.length < 5 && (
              <label className={cn(
                "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed transition-all group relative overflow-hidden",
                uploading ? "border-indigo-500 bg-indigo-50 cursor-wait" : "border-gray-200 bg-gray-50/50 hover:bg-white hover:border-indigo-500"
              )}>
                {uploading ? (
                  <div className="w-full px-4 flex flex-col items-center animate-in fade-in zoom-in">
                    <span className="text-xs font-black text-indigo-600 mb-2">{Math.round(uploadProgress)}%</span>
                    <div className="w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-3 rounded-full bg-white shadow-sm group-hover:scale-110 transition-transform">
                      <UploadCloud className="h-6 w-6 text-gray-400 group-hover:text-indigo-500" />
                    </div>
                    <span className="mt-3 text-[9px] font-black text-gray-400 uppercase group-hover:text-indigo-500">Añadir</span>
                    <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*" disabled={uploading} />
                  </>
                )}
              </label>
            )}
          </div>
        </div>
      </div>

      {/* VARIANTES CAMALEÓN */}
      <div className="border-t border-gray-50 pt-10">
        <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-sm font-black uppercase text-gray-900 tracking-widest">Variantes Dinámicas</h3>
              <p className="text-[11px] font-medium text-gray-400">Personalizá talles, colores o especificaciones únicas.</p>
            </div>
            <button type="button" onClick={addAttribute} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-xs font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
              <Plus className="h-4 w-4" /> Agregar
            </button>
        </div>
        
        <div className="grid grid-cols-1 gap-4">
            {attributes.map((attr) => (
              <div key={attr.id} className="flex gap-4 items-center p-5 bg-gray-50/50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-md">
                <div className="w-1/3">
                   <input 
                     type="text" 
                     defaultValue={attr.name} 
                     placeholder="Ej: Peso" 
                     className="w-full h-11 px-4 rounded-xl border-gray-200 bg-white text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                     onChange={(e) => {
                       const valInput = document.getElementById(`val-${attr.id}`) as HTMLInputElement;
                       if (valInput) valInput.name = `attr_${e.target.value}`;
                     }}
                   />
                </div>
                <div className="flex-1">
                   <input 
                     id={`val-${attr.id}`} 
                     type="text" 
                     defaultValue={attr.value} 
                     name={`attr_${attr.name}`} 
                     placeholder="Ej: 500gr" 
                     className="w-full h-11 px-4 rounded-xl border-gray-200 bg-white text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                   />
                </div>
                <button type="button" onClick={() => removeAttribute(attr.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
            {attributes.length === 0 && (
              <div className="text-center py-10 border-2 border-dashed border-gray-50 rounded-3xl">
                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest italic">Sin variantes configuradas</p>
              </div>
            )}
        </div>
      </div>

      {/* ACCIÓN PRINCIPAL */}
      <div className="pt-6">
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full h-16 flex justify-center items-center gap-3 rounded-3xl bg-gray-900 text-white font-black shadow-2xl shadow-gray-400 hover:bg-indigo-600 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? (
              <UploadCloud className="animate-bounce h-6 w-6 text-indigo-400" />
            ) : (
              <Save className="h-6 w-6" />
            )}
            {loading ? "Sincronizando..." : "Guardar y Publicar"}
          </button>
      </div>
    </form>

    {/* MODAL DE RECORTE (CROP) */}
    {cropImage && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl">
          <div className="relative h-100 w-full bg-gray-900">
            <Cropper
              image={cropImage}
              crop={crop}
              zoom={zoom}
              aspect={1} // Cuadrado 1:1
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
            />
          </div>
          
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-gray-500 uppercase">Zoom</span>
              <input 
                type="range" 
                value={zoom} 
                min={1} 
                max={3} 
                step={0.1} 
                aria-labelledby="Zoom" 
                onChange={(e) => setZoom(Number(e.target.value))} 
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* CHECKBOX MARCA DE AGUA */}
            <div className="space-y-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <input
                  id="watermark-toggle"
                  type="checkbox"
                  checked={useWatermark}
                  onChange={(e) => setUseWatermark(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                />
                <label htmlFor="watermark-toggle" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                  Aplicar marca de agua
                </label>
              </div>
              
              {useWatermark && (
                <div className="space-y-3">
                  <input 
                    type="text" 
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm font-medium focus:border-indigo-500 outline-none transition-all placeholder:text-gray-400"
                    placeholder="Texto de la marca (Ej: Doña Jovita)"
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 uppercase">Color:</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setWatermarkColor("rgba(255, 255, 255, 0.6)")} className={cn("h-6 w-6 rounded-full bg-white border border-gray-200 shadow-sm", watermarkColor === "rgba(255, 255, 255, 0.6)" && "ring-2 ring-indigo-500 ring-offset-1")} title="Blanco" />
                      <button type="button" onClick={() => setWatermarkColor("rgba(0, 0, 0, 0.6)")} className={cn("h-6 w-6 rounded-full bg-black border border-gray-200 shadow-sm", watermarkColor === "rgba(0, 0, 0, 0.6)" && "ring-2 ring-indigo-500 ring-offset-1")} title="Negro" />
                      <div className="relative h-6 w-6 rounded-full overflow-hidden border border-gray-200 shadow-sm">
                        <input 
                          type="color" 
                          className="absolute -top-2 -left-2 h-10 w-10 cursor-pointer p-0 border-0"
                          onChange={(e) => setWatermarkColor(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setCropImage(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
              <button type="button" onClick={handleCropAndUpload} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                <Check className="h-4 w-4" /> Recortar y Subir
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}