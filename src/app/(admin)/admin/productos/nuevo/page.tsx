"use client";

import { getCategories, getTags, revalidateStore, createProduct } from "@/lib/actions";
import { storage } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Plus, Trash2, Save, ArrowLeft, Link as LinkIcon, UploadCloud, X, FileText, Tag, Box, Check, Crop as CropIcon, Printer } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Toast, ToastType } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Cropper, { Area } from "react-easy-crop";
import { PRODUCT_CATEGORIES } from "@/lib/constants";

export const dynamic = 'force-dynamic';


// Sugerencias de subcategorías (Misma lógica que en edición)
const SUB_CATEGORY_SUGGESTIONS: Record<string, string[]> = {
  "Ropa": ["Remeras", "Pantalones", "Abrigos", "Vestidos", "Deportiva"],
  "Calzado": ["Zapatillas", "Botas", "Sandalias", "Formal"],
  "Tecnología": ["Celulares", "Accesorios", "Audio", "Computación"],
  "Comida": ["Quesillos", "Dulces", "Lácteos", "Regionales", "Bebidas"],
  "Herramientas": ["Manuales", "Eléctricas", "Jardinería"],
};

// --- UTILIDAD DE COMPRESIÓN Y MARCA DE AGUA ---
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
          const text = watermarkText;
          const fontSize = Math.max(20, width * 0.05); // 5% del ancho
          
          ctx.font = `900 ${fontSize}px sans-serif`;
          ctx.fillStyle = watermarkColor;
          ctx.textAlign = "right";
          ctx.textBaseline = "bottom";
          
          ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
          ctx.shadowBlur = 4;
          
          const padding = width * 0.03;
          ctx.fillText(text, width - padding, height - padding);
        }
        
        // 4. Exportar como JPEG optimizado (70%)
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

// Componente auxiliar para la galería con Drag & Drop
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
      className="group relative aspect-square rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-move"
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
        onError={() => setIsLoading(false)}
      />
      <button type="button" onClick={() => onRemove(index)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10">
        <X className="h-3 w-3" />
      </button>
      {index === 0 && (
        <div className="absolute bottom-0 inset-x-0 bg-indigo-600/90 backdrop-blur-sm text-[9px] font-black text-white text-center py-1 uppercase tracking-widest">
          Portada
        </div>
      )}
    </div>
  );
}

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  
  // ESTADOS DEL FORMULARIO
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [description, setDescription] = useState("");
  const [availableCategories, setAvailableCategories] = useState<string[]>([...PRODUCT_CATEGORIES]);
  const [category, setCategory] = useState<string>(""); // Inicializar vacío para esperar carga o default
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [subCategory, setSubCategory] = useState("");
  const [attributes, setAttributes] = useState<{ id: number; key: string; value: string }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [showDiscount, setShowDiscount] = useState(false);

  // Estado para el Crop y Marca de Agua
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [useWatermark, setUseWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState("Mi Tienda Pro");
  const [watermarkColor, setWatermarkColor] = useState("rgba(255, 255, 255, 0.6)");
  
  // Estado para notificaciones
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: ToastType }>({ show: false, msg: "", type: "success" });

  const showToast = (msg: string, type: ToastType) => {
    setToast({ show: true, msg, type });
  };

  // Cargar categorías al inicio
  useEffect(() => {
    getCategories().then((cats) => {
      setAvailableCategories(cats);
      // Si no hay categoría seleccionada, poner la primera por defecto
      setCategory((prev) => prev || cats[0]);
    });
  }, []);

  // Cargar tags disponibles para sugerencias
  useEffect(() => {
    getTags().then(setAvailableTags);
  }, []);

  // Persistencia de configuración de marca de agua
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
  }, [useWatermark, watermarkText, watermarkColor]);
  
  // Cálculo de descuento en tiempo real
  const discountPercentage = (() => {
    const p = parseFloat(price);
    const op = parseFloat(originalPrice);
    if (!p || !op || op <= p) return 0;
    return Math.round(((op - p) / op) * 100);
  })();

  // Helper para aplicar descuentos rápidos
  const applyDiscount = (percentage: number) => {
    let basePrice = parseFloat(originalPrice);
    
    // Si no hay precio de lista, usamos el precio de venta como base
    if (!basePrice || isNaN(basePrice)) {
      basePrice = parseFloat(price);
      if (!basePrice || isNaN(basePrice)) return; // No hay nada que descontar
      setOriginalPrice(basePrice.toString());
    }

    const discountFactor = 1 - (percentage / 100);
    const newPrice = Math.round(basePrice * discountFactor);
    setPrice(newPrice.toString());
  };

  // --- GESTIÓN DE ATRIBUTOS ---
  const addAttribute = () => setAttributes([...attributes, { id: Date.now(), key: "", value: "" }]);
  const removeAttribute = (id: number) => setAttributes(attributes.filter((a) => a.id !== id));
  const updateAttribute = (id: number, field: 'key' | 'value', newValue: string) => {
    setAttributes(prev => prev.map(attr => 
      attr.id === id ? { ...attr, [field]: newValue } : attr
    ));
  };

  // --- GESTIÓN DE TAGS ---
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput("");
    }
  };
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // --- GESTIÓN DE IMÁGENES ---

  // 1. Selección de archivo (Abre modal de crop)
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return showToast("El archivo debe ser una imagen.", "error");
    }

    // Validación de tamaño (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return showToast("El archivo es demasiado grande. Máximo 2MB.", "error");
    }

    // Leer archivo para el cropper
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      setCropImage(reader.result as string);
    });
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset input
  };

  // 2. Procesar recorte, marca de agua y subir
  const handleCropAndUpload = async () => {
    if (!cropImage || !croppedAreaPixels) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // A. Recortar
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
      // B. Comprimir y Marca de Agua
      const file = await compressImage(croppedBlob, useWatermark, watermarkText, watermarkColor);

      // C. Subir
      const storageRef = ref(storage, `products/${category}/${Date.now()}_pro.jpg`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on("state_changed", (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      });

      await uploadTask;
      const url = await getDownloadURL(storageRef);
      setImages((prev) => [...prev, url]);
      
      setCropImage(null); // Cerrar modal
      showToast("Imagen procesada y subida.", "success");
    } catch (error) {
      showToast("Error al procesar la imagen.", "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 3. Agregar URL externa
  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    // Validación básica de URL
    try {
      new URL(urlInput);
      setImages((prev) => [...prev, urlInput]);
      setUrlInput("");
    } catch {
      showToast("La URL ingresada no es válida", "error");
    }
  };

  // 4. Eliminar imagen de la galería local
  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
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

  // MANEJO DEL ENVÍO DEL FORMULARIO
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validación de Categoría Custom
    if (isCustomCategory) {
      const cleanCategory = category.trim();
      if (!cleanCategory) {
        return showToast("El nombre de la categoría no puede estar vacío.", "error");
      }
      if (availableCategories.some((c) => c.toLowerCase() === cleanCategory.toLowerCase())) {
        return showToast(`La categoría "${cleanCategory}" ya existe. Por favor seleccionala de la lista.`, "error");
      }
    }

    // Validación de atributos duplicados
    const attributeKeys = attributes
      .map((attr) => attr.key.trim().toLowerCase())
      .filter((key) => key !== "");
    
    if (new Set(attributeKeys).size !== attributeKeys.length) {
      return showToast("Hay atributos con nombres duplicados. Por favor, corregilos.", "error");
    }

    if (images.length === 0) {
      return showToast("Debés agregar al menos una imagen del producto.", "error");
    }

    const formData = new FormData(e.currentTarget);
    const priceVal = Number(formData.get("price"));
    const originalPriceVal = Number(formData.get("originalPrice"));

    if (originalPriceVal > 0 && originalPriceVal <= priceVal) {
      return showToast("El precio original debe ser mayor al precio de venta.", "error");
    }

    setLoading(true);

    // Inyectamos las imágenes al FormData
    images.forEach((url) => formData.append("images", url));
    tags.forEach((tag) => formData.append("tags", tag));

    try {
      // 1. Escritura vía Server Action (Admin SDK) - Única fuente de verdad
      const result = await createProduct(formData);

      if (result.success) {
        // 2. Revalidar caché
        await revalidateStore();
        showToast("Producto creado con éxito", "success");
        router.push("/admin/productos");
      } else {
        showToast("Error: " + result.message, "error");
      }
    } catch (error) {
      showToast("Error inesperado al guardar.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />

    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-4 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-gray-200/50 pb-24">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-gray-50 pb-6">
        <Link href="/admin/productos" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-indigo-600 transition-all">
          <ArrowLeft className="h-4 w-4" /> Cancelar
        </Link>
        <h1 className="text-xl font-black text-gray-900">Nuevo Producto</h1>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 items-start">
        {/* INFO BÁSICA */}
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest mb-3">
            <Tag className="h-3 w-3" /> Nombre Comercial
          </label>
          <input name="name" required className="w-full h-14 px-5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300" placeholder="Ej: Quesillo Premium" />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-3">SKU (Código Único)</label>
          <input name="sku" className="w-full h-14 px-5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 placeholder:text-gray-300" placeholder="Ej: PROD-001" />
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-3">Precio de Venta ($)</label>
            <input 
              type="number" 
              name="price" 
              required 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full h-14 px-5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" 
              placeholder="0" 
            />
          </div>
          
          {/* TOGGLE DE OFERTA */}
          <div className="flex items-center gap-3">
            <input 
              id="show-discount"
              type="checkbox"
              checked={showDiscount}
              onChange={(e) => setShowDiscount(e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
            />
            <label htmlFor="show-discount" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
              ¿Agregar oferta / precio de lista?
            </label>
          </div>

          {showDiscount && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <div className="flex justify-between mb-3">
                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest">Precio de Lista (Opcional)</label>
                {discountPercentage > 0 && (
                  <span className="text-xs font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-lg animate-in fade-in">-{discountPercentage}% OFF</span>
                )}
              </div>
              <input type="number" name="originalPrice" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} className="w-full h-14 px-5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" placeholder="0" />
              
              {/* BOTONES DE DESCUENTO RÁPIDO */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
                {[10, 15, 20, 25, 30, 40, 50].map((pct) => (
                  <button
                  key={pct}
                  type="button"
                  onClick={() => applyDiscount(pct)}
                  className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 hover:border-indigo-200 transition-all whitespace-nowrap active:scale-95"
                >
                  -{pct}%
                </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* DESCRIPCIÓN */}
        <div className="sm:col-span-2">
          <div className="flex justify-between mb-3">
            <label className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-widest">
              <FileText className="h-3 w-3" /> Descripción
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
            placeholder="Detalles del producto..." 
          />
        </div>

        {/* CATEGORÍAS */}
        <div className="space-y-8">
          <div>
            <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-3">Categoría</label>
            <div className="space-y-3">
              <select 
                name={!isCustomCategory ? "category" : undefined}
                value={isCustomCategory ? "other" : category}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "other") {
                    setIsCustomCategory(true);
                    setCategory("");
                  } else {
                    setIsCustomCategory(false);
                    setCategory(val);
                    setSubCategory("");
                  }
                }}
                className="w-full h-14 px-5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800 cursor-pointer"
              >
                {availableCategories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
                <option value="other" className="font-bold text-indigo-600">+ Otra (Escribir nueva...)</option>
              </select>

              {isCustomCategory && (
                <input 
                  type="text"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Escribí el nombre de la nueva categoría..."
                  className="w-full h-14 px-5 rounded-2xl border border-indigo-200 bg-indigo-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-indigo-900 placeholder:text-indigo-300 animate-in slide-in-from-top-2 fade-in"
                  autoFocus
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-3">Subcategoría</label>
            <input 
              type="text"
              list="subcategories-list"
              name="subCategory"
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              placeholder="Ej: Remeras"
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
              <Box className="h-3 w-3" /> Stock Inicial
            </label>
            <input type="number" name="stock" defaultValue="10" className="w-full h-14 px-5 rounded-2xl border border-gray-100 bg-gray-50/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-800" />
          </div>
        </div>

        {/* TAGS */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-3">Etiquetas (Tags)</label>
          <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/30 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all">
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-sm font-bold">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-indigo-900"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <input 
              type="text" 
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Escribí una etiqueta y presioná Enter..." 
              className="w-full bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400"
              list="tags-suggestions"
            />
            <datalist id="tags-suggestions">
              {availableTags.map(t => <option key={t} value={t} />)}
            </datalist>
          </div>
        </div>

        {/* --- GESTIÓN DE IMÁGENES HÍBRIDA --- */}
        <div className="sm:col-span-2 space-y-5">
          <label className="block text-xs font-black uppercase text-gray-400 tracking-widest">Galería de Imágenes ({images.length})</label>
          
          {/* Input URL + Botón */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input 
                type="text" 
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="Pegar URL de imagen externa..." 
                className="w-full h-12 pl-10 pr-4 rounded-xl border border-gray-200 text-sm outline-none focus:border-indigo-500"
              />
            </div>
            <button type="button" onClick={handleAddUrl} className="px-4 h-12 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors">
              Añadir URL
            </button>
          </div>

          {/* Grilla de Miniaturas */}
          <div className="grid grid-cols-3 gap-4 sm:grid-cols-5 lg:grid-cols-6">
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
            
            {/* Botón de Subida */}
            <label className={cn(
              "flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all group relative overflow-hidden",
              uploading ? "border-indigo-500 bg-indigo-50 cursor-wait" : "border-gray-200 bg-gray-50 hover:bg-white hover:border-indigo-500"
            )}>
              {uploading ? (
                <div className="w-full px-2 flex flex-col items-center">
                  <span className="text-[10px] font-black text-indigo-600 mb-1">{Math.round(uploadProgress)}%</span>
                  <div className="w-full h-1 bg-indigo-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              ) : (
                <>
                  <UploadCloud className="h-6 w-6 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                  <span className="mt-2 text-[9px] font-black text-gray-400 uppercase group-hover:text-indigo-500">Subir</span>
                  <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*" disabled={uploading} />
                </>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* ATRIBUTOS */}
      <div className="border-t border-gray-50 pt-10">
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-black uppercase text-gray-900 tracking-widest">Variantes (Atributos)</h3>
            <button type="button" onClick={addAttribute} className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700">
              <Plus className="h-4 w-4" /> Agregar Atributo
            </button>
        </div>
        <div className="space-y-4">
            {attributes.map((attr) => (
              <div key={attr.id} className="flex gap-3 items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <input 
                  type="text" 
                  placeholder="Ej: Color" 
                  className="w-1/3 h-10 px-3 rounded-lg border-gray-200 text-sm font-bold outline-none focus:border-indigo-500"
                  value={attr.key}
                  onChange={(e) => updateAttribute(attr.id, 'key', e.target.value)}
                />
                <input 
                  type="text" 
                  placeholder="Ej: Rojo" 
                  className="flex-1 h-10 px-3 rounded-lg border-gray-200 text-sm font-medium outline-none focus:border-indigo-500" 
                  value={attr.value}
                  onChange={(e) => updateAttribute(attr.id, 'value', e.target.value)}
                />
                {/* Input Oculto para FormData: Solo se renderiza si hay una clave definida */}
                {attr.key.trim() !== "" && (
                  <input type="hidden" name={`attr_${attr.key.trim()}`} value={attr.value} />
                )}
                <button type="button" onClick={() => removeAttribute(attr.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
        </div>
      </div>

      <div className="pt-8">
          <button type="submit" disabled={loading} className="w-full h-16 flex justify-center items-center gap-2 rounded-3xl bg-indigo-600 text-white font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95">
            {loading ? <UploadCloud className="animate-bounce h-6 w-6" /> : <Save className="h-6 w-6" />}
            {loading ? "Guardando..." : "Crear Producto"}
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
                onChange={(e) => setZoom(Number(e.target.value))} 
                className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>

            {/* CHECKBOX MARCA DE AGUA */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <input id="wm" type="checkbox" checked={useWatermark} onChange={(e) => setUseWatermark(e.target.checked)} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600" />
              <label htmlFor="wm" className="text-sm font-bold text-gray-700 select-none">Aplicar marca de agua &quot;{watermarkText}&quot;</label>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setCropImage(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
              <button type="button" onClick={handleCropAndUpload} className="flex-1 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"><Check className="h-4 w-4" /> Recortar y Subir</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
