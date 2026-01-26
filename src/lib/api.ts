// src/lib/api.ts
export async function createProductAPI(formData: FormData) {
  const response = await fetch('/api/productos', {
    method: 'POST',
    body: formData,
  });
  return await response.json();
}

export async function updateProductAPI(formData: FormData) {
  const response = await fetch('/api/productos', {
    method: 'PUT',
    body: formData,
  });
  return await response.json();
}

export async function deleteProductAPI(id: string) {
  const response = await fetch(`/api/productos?id=${id}`, {
    method: 'DELETE',
  });
  return await response.json();
}
