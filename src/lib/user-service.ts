import { syncUser, updateUser } from "@/lib/actions/users";
import { UserProfile } from "@/lib/types";
import { User } from "firebase/auth";

export async function syncUserWithFirestore(
  user: User,
): Promise<UserProfile | null> {
  if (!user) return null;

  // Obtener claims para verificar rol real en Auth
  const token = await user.getIdTokenResult();
  const isAdmin = token.claims.role === "admin";

  const userData: UserProfile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "Usuario",
      phone: user.phoneNumber || "",
      role: isAdmin ? "admin" : "user",
      createdAt: new Date().toISOString(),
      profilePhoto: user.photoURL || "",
      defaultAddress: "",
  };

  // Delegamos la escritura segura al servidor
  return await syncUser(userData);
}

export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>,
) {
  return await updateUser(uid, data);
}
