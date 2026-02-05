export const StoragePaths = {
  products: (productId: string, fileName: string) => 
    `products/${productId}/${fileName}`,
  
  userAvatar: (userId: string, fileName: string) => 
    `users/${userId}/avatar_${fileName}`,
  
  receipts: (userId: string, orderId: string, fileName: string) => 
    `receipts/${userId}/${orderId}/${fileName}`,
};