import { Router } from "express";
import { createCipheriv, randomBytes, createHash } from "crypto";
import { getSupabaseClient } from "../lib/supabase";

const router = Router();

function generateToken(collectorId: number): string {
  const payload = JSON.stringify({ id: collectorId, ts: Date.now() });
  const key = (process.env["SESSION_SECRET"] || "susu_secret_key_2024").slice(0, 32).padEnd(32, "0");
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(key), iv);
  let encrypted = cipher.update(payload, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function hashString(s: string): string {
  return createHash("sha256").update(s + "susu_salt_2024").digest("hex");
}

router.post("/auth/google", async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    res.status(400).json({ error: "accessToken is required" });
    return;
  }

  const supabase = getSupabaseClient();

  // Verify the Supabase access token and get user info
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !userData.user) {
    res.status(401).json({ error: "Invalid or expired Google session" });
    return;
  }

  const user = userData.user;
  const email = user.email;
  const name = user.user_metadata?.["full_name"] || user.user_metadata?.["name"] || email?.split("@")[0] || "Field Agent";
  const avatarUrl = user.user_metadata?.["avatar_url"] || user.user_metadata?.["picture"] || null;

  if (!email) {
    res.status(400).json({ error: "No email associated with Google account" });
    return;
  }

  // Find or create a collector record for this Google user
  const { data: existing, error: findErr } = await supabase
    .from("collectors")
    .select("*")
    .eq("email", email)
    .limit(1);

  if (findErr) {
    res.status(500).json({ error: "Database error" });
    return;
  }

  let collector;

  if (existing && existing.length > 0) {
    // Update avatar if changed
    const current = existing[0];
    if (avatarUrl && current.avatar_url !== avatarUrl) {
      await supabase
        .from("collectors")
        .update({ avatar_url: avatarUrl })
        .eq("id", current.id);
    }
    collector = { ...current, avatar_url: avatarUrl || current.avatar_url };
  } else {
    // Create a new collector record for this Google user
    const { data: inserted, error: insertErr } = await supabase
      .from("collectors")
      .insert({
        name,
        email,
        password_hash: hashString(user.id), // not usable for password login
        phone: null,
        zone: "Unassigned",
        avatar_url: avatarUrl,
        total_customers: 0,
      })
      .select()
      .single();

    if (insertErr || !inserted) {
      res.status(500).json({ error: insertErr?.message || "Failed to create collector" });
      return;
    }
    collector = inserted;
  }

  const token = generateToken(collector.id);

  res.json({
    token,
    collector: {
      id: collector.id,
      name: collector.name,
      email: collector.email,
      phone: collector.phone,
      zone: collector.zone,
      avatarUrl: collector.avatar_url,
      totalCustomers: collector.total_customers,
      createdAt: collector.created_at,
    },
  });
});

export default router;
