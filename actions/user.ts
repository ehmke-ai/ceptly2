"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { patchUserProfile } from "@/lib/api/user";
import { getAccessToken } from "@/lib/auth/server";

const userNameSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(200),
});

export type AccountNameFormState = {
  errors?: {
    fullName?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function updateUserName(
  _state: AccountNameFormState,
  formData: FormData,
): Promise<AccountNameFormState> {
  const parsed = userNameSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const token = await getAccessToken();
  if (!token) {
    return { errors: { _form: ["You must be signed in to update your name."] } };
  }

  const result = await patchUserProfile(token, parsed.data.fullName);

  if (!result.success) {
    return {
      errors: {
        _form: [result.error ?? "Failed to update your name."],
      },
    };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings/account");

  return { success: true };
}
