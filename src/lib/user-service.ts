import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { UserProfile } from "@/lib/types";
import { User } from "firebase/auth";

export async function syncUserWithFirestore(user: User): Promise<UserProfile | null> {
  if (!user) return null;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    // Usuario existente: Retornamos sus datos
    return userSnap.data() as UserProfile;
  } else {
    // Usuario nuevo: Lo creamos
    const newUser: UserProfile = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "Usuario",
      phone: user.phoneNumber || "",
      role: "customer",
      createdAt: new Date().toISOString(),
      profilePhoto: user.photoURL || "",
      defaultAddress: "",
    };

    try {
      await setDoc(userRef, newUser);
      return newUser;
    } catch (error) {
      console.error("Error creando usuario en Firestore:", error);
      return null;
    }
  }
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, data);
}