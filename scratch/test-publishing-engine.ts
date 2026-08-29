/**
 * Test Suite: Kraftaura Publishing & Storefront Synchronization Engine
 */

import { PublishingEngine, PublishStatus } from "../src/lib/services/publishing-engine";

async function runTests() {
  console.log("Starting Publishing Engine test suite...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`✓ PASS: ${name}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${name}`);
      failed++;
    }
  }

  const engine = new PublishingEngine();

  // Test 1: Mock publish flow simulation
  const mockStoreId = "test-store-123";
  let mockStoreSettings: any = {
    id: "settings-1",
    store_id: mockStoreId,
    metadata: {
      publishing: {
        published_revision: 5,
        publish_status: "PUBLISHED",
      }
    }
  };

  const mockSupabase: any = {
    from: (table: string) => {
      return {
        select: (cols: string) => ({
          eq: (field: string, val: any) => ({
            maybeSingle: async () => {
              if (table === "stores") {
                return {
                  data: {
                    id: mockStoreId,
                    name: "Test Store",
                    slug: "test-store",
                    is_published: true,
                    user_id: "user-123",
                  },
                  error: null,
                };
              }
              if (table === "store_settings") {
                return {
                  data: mockStoreSettings,
                  error: null,
                };
              }
              return { data: null, error: null };
            },
            single: async () => {
              if (table === "stores") {
                return {
                  data: {
                    id: mockStoreId,
                    name: "Test Store",
                    slug: "test-store",
                    is_published: true,
                    user_id: "user-123",
                  },
                  error: null,
                };
              }
              return { data: null, error: null };
            }
          }),
        }),
        update: (payload: any) => ({
          eq: async (field: string, val: any) => {
            if (table === "store_settings") {
              mockStoreSettings.metadata = payload.metadata;
            }
            return { error: null };
          }
        }),
        insert: (payload: any) => ({
          select: () => ({
            single: async () => ({ data: payload, error: null })
          })
        })
      };
    }
  };

  // Test 1: getPublishStatus returns existing status and revision
  const status1 = await engine.getPublishStatus(mockStoreId, mockSupabase);
  assert(status1.revision === 5, "getPublishStatus retrieves existing revision number (5)");
  assert(status1.status === "PUBLISHED", "getPublishStatus retrieves existing status ('PUBLISHED')");

  // Test 2: publishStore increments revision monotonically
  const publishRes = await engine.publishStore(mockStoreId, { supabaseClient: mockSupabase });
  assert(publishRes.success === true, "publishStore completes successfully");
  assert(publishRes.revision === 6, "publishStore increments revision from 5 to 6");
  assert(publishRes.status === "PUBLISHED", "publishStore status is 'PUBLISHED'");
  assert(mockStoreSettings.metadata.publishing.published_revision === 6, "store_settings updated with new revision");
  assert(mockStoreSettings.metadata.published_snapshot.revision === 6, "published_snapshot contains new revision");

  // Test 3: getPublishStatus returns newly stamped revision
  const status2 = await engine.getPublishStatus(mockStoreId, mockSupabase);
  assert(status2.revision === 6, "getPublishStatus reflects newly published revision (6)");

  // Test 4: triggerAutoPublish triggers successful publication
  const autoRes = await engine.triggerAutoPublish(mockStoreId, mockSupabase);
  assert(autoRes.success === true, "triggerAutoPublish succeeds");
  assert(autoRes.revision === 7, "triggerAutoPublish increments revision to 7");

  console.log(`\nTest Suite Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
