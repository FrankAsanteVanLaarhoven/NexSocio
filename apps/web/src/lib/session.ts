import type { AuthLoginResponse, KidsRegisterResponse } from "@nexus/types";
import { useAuthStore } from "@/lib/auth-store";

export function applyAuthLogin(result: AuthLoginResponse | KidsRegisterResponse) {
  const email = "email" in result ? result.email : `kid-${result.user_id}@nexus.kids`;
  useAuthStore.getState().setSession({
    accessToken: result.access_token,
    userId: result.user_id,
    email,
    displayName: result.display_name,
    mode: result.mode,
    ageVerified: "age_verified" in result ? result.age_verified : true,
    viewContext: "personal",
  });
}