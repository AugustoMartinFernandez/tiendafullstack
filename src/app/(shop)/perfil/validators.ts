export interface ProfileFormData {
  displayName: string;
  phone: string;
  dni: string;
  age: string;
}

export function validateProfile(data: ProfileFormData): { success: boolean; error?: string } {
  if (data.displayName.trim().length < 3) {
    return { success: false, error: "El nombre debe tener al menos 3 letras." };
  }

  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
  if (data.phone && !phoneRegex.test(data.phone.replace(/\s/g, ''))) {
    return { success: false, error: "El formato del teléfono no es válido." };
  }

  if (data.dni && !/^\d{7,11}$/.test(data.dni)) {
    return { success: false, error: "El DNI debe contener solo números (7-11 dígitos)." };
  }

  if (data.age) {
    const ageNum = Number(data.age);
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
      return { success: false, error: "Ingresá una edad válida." };
    }
  }

  return { success: true };
}