const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const fs = require("fs");

// Load local environment variables manually
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const parts = trimmed.split("=");
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      process.env[key] = val;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: Missing Supabase credentials in environment.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function cleanDatabase() {
  console.log("\n==========================================");
  console.log("       DATABASE CLEANUP & SANITIZATION     ");
  console.log("==========================================\n");

  try {
    // 1. Fetch all users from Supabase Auth
    console.log("Fetching users from auth directory...");
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (listError) {
      throw listError;
    }

    const users = usersData.users || [];
    console.log(`Found ${users.length} total users in Auth.`);

    // 2. Separate users
    const adminUser = users.find((u) => u.email === "syed.ae018@gmail.com");
    const usersToDelete = users.filter((u) => u.email !== "syed.ae018@gmail.com");

    console.log(`Admin user (syed.ae018@gmail.com) status: ${adminUser ? "Present" : "Missing!"}`);
    console.log(`Identified ${usersToDelete.length} test/merchant users to delete.`);

    // 3. Delete non-admin users via auth admin API (this will cascade delete profiles, stores, etc.)
    for (const user of usersToDelete) {
      process.stdout.write(`Deleting user ${user.email} (${user.id})... `);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.log("✗ FAILED");
        console.error(`Error: ${deleteError.message}`);
      } else {
        console.log("✓ SUCCESS");
      }
    }

    // 4. Force clean all dependent tables to be absolutely sure no orphaned entries remain
    console.log("\nExecuting sanitization queries on tables...");

    const tablesToClean = [
      "payments",
      "subscriptions",
      "order_items",
      "orders",
      "products",
      "categories",
      "storefront_events",
      "activity_logs",
      "store_settings",
      "stores",
    ];

    for (const table of tablesToClean) {
      process.stdout.write(`Cleaning table public.${table}... `);
      const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000"); // deletes all rows
      if (error) {
        // Some tables might have different PK names or be empty, try alternative delete check
        const { error: error2 } = await supabase.from(table).delete().filter("created_at", "neq", "1970-01-01T00:00:00Z");
        if (error2) {
          console.log(`✗ FAILED (${error2.message})`);
        } else {
          console.log("✓ SUCCESS");
        }
      } else {
        console.log("✓ SUCCESS");
      }
    }

    // 5. Verify profiles table contains only the admin email
    console.log("\nVerifying final profile directories...");
    const { data: finalProfiles, error: profError } = await supabase
      .from("profiles")
      .select("*");

    if (profError) {
      console.error(`Error checking profiles: ${profError.message}`);
    } else {
      console.log(`Final profiles count: ${finalProfiles.length}`);
      finalProfiles.forEach((p) => {
        console.log(`- Profile: ${p.email} (Name: ${p.full_name || "N/A"})`);
      });
    }

    console.log("\n==========================================");
    console.log("✓ SUCCESS: Database cleanup completed successfully!");
    console.log("==========================================\n");
    process.exit(0);
  } catch (err) {
    console.error("\n✗ ERROR: Database sanitization failed!");
    console.error(err.message || err);
    console.log("==========================================\n");
    process.exit(1);
  }
}

cleanDatabase();
