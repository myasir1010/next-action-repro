"use server";

import { revalidatePath } from "next/cache";
import { store } from "./store";

export async function setGoal(_previous, formData) {
  store.goal = String(formData.get("goal") ?? "").trim() || null;

  revalidatePath("/");

  return { goal: store.goal, at: Date.now() };
}
