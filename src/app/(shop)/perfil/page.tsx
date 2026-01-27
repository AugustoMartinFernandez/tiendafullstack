"use client";

import { useAuth } from "@/context/auth-context";
import { Package, LogOut, User as UserIcon, Loader2, Clock, CheckCircle, XCircle, Edit2, Save, X, FileText, ExternalLink, MapPin, Heart, HelpCircle, Camera, Trash2, Shield, Mail, Phone, Home, AlertTriangle, CreditCard, Calendar, Settings, LayoutDashboard } from "lucide-react";
import { auth, db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { deleteUser, GoogleAuthProvider, EmailAuthProvider } from "firebase/auth";
import { useRouter } from "next/navigation";
import { UserGuard } from "@/components/auth/user-guard";
import { useEffect, useState } from "react";
import { getUserOrders } from "@/lib/actions/orders";
import { Order } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { ReceiptUploader } from "@/components/shop/receipt-uploader";
import { Toast, ToastType } from "@/components/ui/toast";
import { ProfileSkeleton } from "@/components/shop/skeletons";
import { cn } from "@/lib/utils";
import { validateProfile } from "@/lib/validators";

export default function ProfilePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'account'>('profile');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: "", phone: "", address: "", dni: "", age: "" });
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: ToastType }>({ show: false, msg: "", type: "success" });
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    async function fetchOrders() {
      if (user) {
        const userOrders = await getUserOrders(user.uid);
        setOrders(userOrders);
      }
      setLoadingOrders(false);
    }
    
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Inicializar formulario al cargar perfil
  useEffect(() => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName || "",
        phone: profile.phone || "",
        address: profile.defaultAddress || "",
        dni: profile.dni || "",
        age: profile.age?.toString() || ""
      });
    }
  }, [profile]);

  // Validaciones de seguridad

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    const validation = validateProfile(editForm);
    if (!validation.success) {
      setToast({ show: true, msg: validation.error || "Error en el formulario", type: "error" });
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName: editForm.displayName,
        phone: editForm.phone,
        defaultAddress: editForm.address,
        dni: editForm.dni,
        age: editForm.age ? Number(editForm.age) : null
      });
      setToast({ show: true, msg: "Perfil actualizado correctamente.", type: "success" });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      setToast({ show: true, msg: "Error al actualizar perfil.", type: "error" });
    }
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validaciones de seguridad y UX
    if (!file.type.startsWith("image/")) {
       setToast({ show: true, msg: "Solo se permiten archivos de imagen.", type: "error" });
       return;
    }
    if (file.size > 5 * 1024 * 1024) {
       setToast({ show: true, msg: "La imagen no puede superar los 5MB.", type: "error" });
       return;
    }

    setUploadingPhoto(true);
    try {
      // 1. Subir a Firebase Storage (Sobrescribe la anterior para ahorrar espacio)
      const storageRef = ref(storage, `users/${user.uid}/profile-photo`);
      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      // 2. Actualizar Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { profilePhoto: downloadUrl });
      
      setToast({ show: true, msg: "Foto de perfil actualizada.", type: "success" });
      
      // Recargar para ver cambios (AuthContext se actualizará al recargar)
      window.location.reload();
    } catch (error) {
      console.error(error);
      setToast({ show: true, msg: "Error al subir la imagen.", type: "error" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!user || !profile?.profilePhoto) return;
    
    if (!confirm("¿Estás seguro de que querés eliminar tu foto de perfil?")) return;

    setUploadingPhoto(true);
    try {
      // 1. Intentar borrar de Storage (si es una foto subida por nosotros)
      // Si es de Google, esto fallará o no hará nada, lo cual está bien.
      if (profile.profilePhoto.includes("firebasestorage")) {
        const storageRef = ref(storage, `users/${user.uid}/profile-photo`);
        await deleteObject(storageRef).catch((err) => console.warn("No se pudo borrar de storage o no existía", err));
      }

      // 2. Actualizar Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { profilePhoto: null });

      setToast({ show: true, msg: "Foto eliminada.", type: "success" });
      window.location.reload();
    } catch (error) {
      console.error(error);
      setToast({ show: true, msg: "Error al eliminar la foto.", type: "error" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getInitial = () => {
    if (profile?.displayName) return profile.displayName.charAt(0).toUpperCase();
    if (profile?.email) return profile.email.charAt(0).toUpperCase();
    return "?";
  };

  const getProviderName = () => {
    if (!user) return "Desconocido";
    const providerId = user.providerData[0]?.providerId;
    if (providerId === GoogleAuthProvider.PROVIDER_ID) return "Google";
    if (providerId === EmailAuthProvider.PROVIDER_ID) return "Email y Contraseña";
    return providerId || "Email";
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      // 1. Borrar datos de Firestore
      await deleteDoc(doc(db, "users", user.uid));
      
      // 2. Borrar foto si existe (opcional, ya manejado por reglas o trigger, pero bueno hacerlo)
      if (profile?.profilePhoto && profile.profilePhoto.includes("firebasestorage")) {
         const storageRef = ref(storage, `users/${user.uid}/profile-photo`);
         await deleteObject(storageRef).catch(() => {});
      }

      // 3. Borrar usuario de Auth
      await deleteUser(user);
      
      router.replace("/");
      setToast({ show: true, msg: "Tu cuenta ha sido eliminada.", type: "success" });
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/requires-recent-login') {
        setToast({ show: true, msg: "Por seguridad, iniciá sesión nuevamente para eliminar tu cuenta.", type: "error" });
        setTimeout(() => auth.signOut(), 2000);
      } else {
        setToast({ show: true, msg: "Error al eliminar la cuenta. Contactá a soporte.", type: "error" });
      }
    }
  };

  // Mostrar Skeleton mientras carga la sesión para evitar saltos visuales
  if (loading) return <ProfileSkeleton />;
  if (!profile) return null; // El guard se encarga del loading y redirect

  return (
    <UserGuard>
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
      
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Tarjeta de Perfil */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row items-center gap-8">
          
          {/* Avatar con opción de cambio */}
          <div className="relative group shrink-0">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-indigo-50 bg-indigo-50">
              {profile.profilePhoto ? (
                <img 
                  src={profile.profilePhoto} 
                  alt={profile.displayName} 
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-indigo-100 text-indigo-600 font-black text-3xl">
                  {getInitial()}
                </div>
              )}
            </div>

            {/* Botón de Cámara (Edición) - Siempre visible en móvil (bottom-right) */}
            <label 
              htmlFor="avatar-upload" 
              className="absolute -bottom-1 -right-1 p-2 bg-indigo-600 text-white rounded-full cursor-pointer shadow-md hover:bg-indigo-700 transition-all active:scale-95 z-10 border-2 border-white"
            >
              <Camera className="h-4 w-4" />
            </label>

            {/* Botón de Eliminar (Papelera) - Solo si hay foto */}
            {profile.profilePhoto && (
              <button 
                onClick={handleDeletePhoto}
                className="absolute -top-1 -right-1 p-2 bg-red-100 text-red-600 rounded-full shadow-sm hover:bg-red-200 transition-all active:scale-95 z-10 border-2 border-white"
                title="Eliminar foto"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            <input id="avatar-upload" type="file" className="hidden" onChange={handlePhotoChange} accept="image/*" disabled={uploadingPhoto} />
            
            {uploadingPhoto && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full z-10">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              </div>
            )}
          </div>
          
          <div className="flex-1 text-center md:text-left space-y-2">
            {!isEditing && (
              <>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2 justify-center md:justify-start flex-wrap">
                  {profile.displayName}
                  <button onClick={() => { setIsEditing(true); document.getElementById('personal-data')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded-md hover:bg-gray-100">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </h1>
                <p className="text-gray-500 font-medium flex items-center gap-2 justify-center md:justify-start">
                  <Mail className="h-3 w-3" /> {profile.email}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-2">
                  {profile.role === "admin" ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                      <Shield className="h-3 w-3 mr-1" /> Administrador
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" /> Cliente Verificado
                    </span>
                  )}
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                    Acceso vía {getProviderName()}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {profile.role === "admin" && (
              <button
                onClick={() => router.push("/admin")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all shadow-sm"
              >
                <LayoutDashboard className="h-4 w-4" /> Panel Admin
              </button>
            )}
            <button 
              onClick={() => auth.signOut().then(() => router.push("/tienda"))}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all"
            >
              <LogOut className="h-4 w-4" /> Cerrar Sesión
            </button>
          </div>
        </div>

        {/* TABS DE NAVEGACIÓN */}
        <div className="flex p-1 bg-gray-100/80 rounded-2xl overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActiveTab('profile')}
            className={cn("flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeTab === 'profile' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            <UserIcon className="h-4 w-4" /> Mi Perfil
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={cn("flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeTab === 'orders' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            <Package className="h-4 w-4" /> Mis Pedidos
          </button>
          <button 
            onClick={() => setActiveTab('account')}
            className={cn("flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap", activeTab === 'account' ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}
          >
            <Settings className="h-4 w-4" /> Cuenta
          </button>
        </div>

        {/* CONTENIDO DE TABS */}
        <div className="space-y-8">
          
          {/* TAB 1: PERFIL (Datos + Direcciones) */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* SECCIÓN: DATOS PERSONALES */}
            <div id="personal-data" className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <UserIcon className="h-5 w-5 text-indigo-600" /> Datos Personales
                </h2>
                {!isEditing && (
                  <button onClick={() => setIsEditing(true)} className="text-sm font-bold text-indigo-600 hover:text-indigo-700">
                    Editar
                  </button>
                )}
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Completo</label>
                    <input 
                      disabled={!isEditing}
                      value={editForm.displayName}
                      onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                    <input 
                      disabled={!isEditing}
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      placeholder="+54 9 11 ..."
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">DNI / Identificación</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                      <input 
                        disabled={!isEditing}
                        value={editForm.dni}
                        onChange={(e) => setEditForm({...editForm, dni: e.target.value})}
                        placeholder="12345678"
                        className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Edad</label>
                    <input 
                      disabled={!isEditing}
                      type="number"
                      value={editForm.age}
                      onChange={(e) => setEditForm({...editForm, age: e.target.value})}
                      placeholder="Ej: 25"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email (No editable)</label>
                    <div className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl font-medium text-gray-500 flex items-center gap-2">
                      <Mail className="h-4 w-4" /> {profile.email}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleUpdateProfile} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                      <Save className="h-4 w-4" /> Guardar Cambios
                    </button>
                    <button onClick={() => setIsEditing(false)} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN: DIRECCIONES */}
            <div id="addresses-section" className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-600" /> Mis Direcciones
                </h2>
              </div>
              <div className="p-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Dirección de Envío (Principal)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Home className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                    <input 
                      disabled={!isEditing}
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      placeholder="Calle, Número, Ciudad, Provincia"
                      className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                    />
                  </div>
                  {!isEditing && (
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                      Cambiar
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Esta dirección se usará automáticamente en el checkout.
                </p>
              </div>
            </div>
            </div>
          )}

          {/* TAB 3: CUENTA (Seguridad + Ayuda) */}
          {activeTab === 'account' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* SECCIÓN: AYUDA */}
            <div id="help-section" className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-orange-500" /> Ayuda
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-600">¿Tenés algún problema con tu pedido o cuenta?</p>
                <a href="mailto:soporte@mitienda.com" className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 text-orange-700 font-bold hover:bg-orange-100 transition-colors">
                  <Mail className="h-5 w-5" /> Contactar Soporte
                </a>
                <a href="#" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-gray-700 font-bold hover:bg-gray-100 transition-colors">
                  <FileText className="h-5 w-5" /> Preguntas Frecuentes
                </a>
              </div>
            </div>

            {/* SECCIÓN: ZONA DE PELIGRO */}
            <div className="bg-red-50 rounded-3xl border border-red-100 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-black text-red-900 flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5" /> Zona de Peligro
                </h2>
                <p className="text-sm text-red-700 mb-4">
                  Si eliminás tu cuenta, perderás todo tu historial de pedidos y favoritos. Esta acción no se puede deshacer.
                </p>
                
                {!deleteConfirm ? (
                  <button 
                    onClick={() => setDeleteConfirm(true)}
                    className="w-full py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
                  >
                    Eliminar mi cuenta
                  </button>
                ) : (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-bold text-red-800 text-center">¿Estás seguro?</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleDeleteAccount}
                        className="flex-1 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Sí, eliminar
                      </button>
                      <button 
                        onClick={() => setDeleteConfirm(false)}
                        className="flex-1 py-2 bg-white text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>
          )}

        {/* TAB 2: PEDIDOS */}
        {activeTab === 'orders' && (
        <div id="orders-section" className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Package className="h-5 w-5 text-indigo-600" /> Mis Pedidos
            </h2>
          </div>
          
          <div className="p-6">
            {loadingOrders ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Package className="h-8 w-8 text-gray-300" />
                </div>
                <h3 className="text-gray-900 font-bold">Aún no tenés pedidos</h3>
                <p className="text-gray-500 text-sm mt-1 mb-6">Tus compras aparecerán acá para que puedas seguirlas.</p>
                <button 
                  onClick={() => router.push("/tienda")}
                  className="text-indigo-600 font-bold hover:underline"
                >
                  Ir a la tienda &rarr;
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-100 rounded-2xl p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pedido #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.status === 'pending' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold"><Clock className="h-3 w-3" /> Pendiente</span>}
                        {order.status === 'approved' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold"><CheckCircle className="h-3 w-3" /> Aprobado</span>}
                        {order.status === 'cancelled' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold"><XCircle className="h-3 w-3" /> Cancelado</span>}
                        <span className="text-lg font-black text-gray-900">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <p className="text-sm text-gray-600">
                        {order.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}
                      </p>
                      
                      {/* Botón de Subir Comprobante si está pendiente */}
                      {order.status === 'pending' && !order.receiptUrl && user && (
                        <ReceiptUploader 
                          orderId={order.id} 
                          userId={user.uid} 
                          onSuccess={() => window.location.reload()} // Recargar para ver cambios
                        />
                      )}
                      
                      {order.receiptUrl && (
                        <a 
                          href={order.receiptUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <FileText className="h-3 w-3" /> Ver Comprobante <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
        </div>
      </div>
    </div>
    </UserGuard>
  );
}
