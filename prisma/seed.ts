import { PrismaClient, LocationType } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Locations
  const locations = await Promise.all([
    db.location.upsert({ where: { name: "Dry Storage" }, update: {}, create: { name: "Dry Storage", type: LocationType.DRY_STORAGE, sortOrder: 1 } }),
    db.location.upsert({ where: { name: "Walk-In Cooler" }, update: {}, create: { name: "Walk-In Cooler", type: LocationType.WALK_IN_COOLER, sortOrder: 2 } }),
    db.location.upsert({ where: { name: "Freezer" }, update: {}, create: { name: "Freezer", type: LocationType.FREEZER, sortOrder: 3 } }),
    db.location.upsert({ where: { name: "Chemical Storage" }, update: {}, create: { name: "Chemical Storage", type: LocationType.CHEMICAL_STORAGE, sortOrder: 4 } }),
  ]);

  const [dryStorage, cooler, freezer, chemical] = locations;
  console.log("✅ Locations created");

  // Vendors
  const [sysco, usFoods, gfs, pfg] = await Promise.all([
    db.vendor.upsert({ where: { name: "Sysco" }, update: {}, create: { name: "Sysco", contactName: "Mike Johnson", email: "orders@sysco.com", phone: "800-555-0100" } }),
    db.vendor.upsert({ where: { name: "US Foods" }, update: {}, create: { name: "US Foods", contactName: "Sarah Williams", email: "orders@usfoods.com", phone: "800-555-0200" } }),
    db.vendor.upsert({ where: { name: "Gordon Food Service" }, update: {}, create: { name: "Gordon Food Service", contactName: "Tom Davis", email: "orders@gfs.com", phone: "800-555-0300" } }),
    db.vendor.upsert({ where: { name: "Performance Food Group" }, update: {}, create: { name: "Performance Food Group", contactName: "Lisa Brown", email: "orders@pfg.com", phone: "800-555-0400" } }),
  ]);
  console.log("✅ Vendors created");

  // Inventory items — realistic food service data
  const items = [
    // Proteins
    { name: "Chicken Breast, Boneless", sku: "CHK-001", category: "Proteins", unit: "lb", parLevel: 100, reorderPoint: 30, quantity: 85, costPerUnit: 3.49, locationId: freezer.id, vendorId: sysco.id },
    { name: "Ground Beef 80/20", sku: "BEF-001", category: "Proteins", unit: "lb", parLevel: 80, reorderPoint: 25, quantity: 20, costPerUnit: 4.29, locationId: freezer.id, vendorId: usFoods.id },
    { name: "Pork Loin, Boneless", sku: "PRK-001", category: "Proteins", unit: "lb", parLevel: 60, reorderPoint: 15, quantity: 55, costPerUnit: 3.99, locationId: freezer.id, vendorId: sysco.id },
    { name: "Tilapia Fillets", sku: "FSH-001", category: "Proteins", unit: "lb", parLevel: 40, reorderPoint: 10, quantity: 8, costPerUnit: 5.49, locationId: freezer.id, vendorId: gfs.id },
    { name: "Shrimp, Large 26/30", sku: "SHR-001", category: "Proteins", unit: "lb", parLevel: 25, reorderPoint: 8, quantity: 22, costPerUnit: 9.99, locationId: freezer.id, vendorId: usFoods.id },
    { name: "Turkey Breast, Sliced", sku: "TRK-001", category: "Proteins", unit: "lb", parLevel: 30, reorderPoint: 10, quantity: 28, costPerUnit: 6.99, locationId: cooler.id, vendorId: sysco.id },
    // Dairy
    { name: "Whole Milk, Gallon", sku: "DRY-001", category: "Dairy", unit: "gallon", parLevel: 20, reorderPoint: 6, quantity: 15, costPerUnit: 4.29, locationId: cooler.id, vendorId: gfs.id },
    { name: "Shredded Mozzarella", sku: "DRY-002", category: "Dairy", unit: "lb", parLevel: 30, reorderPoint: 10, quantity: 25, costPerUnit: 3.99, locationId: cooler.id, vendorId: sysco.id },
    { name: "Unsalted Butter", sku: "DRY-003", category: "Dairy", unit: "lb", parLevel: 20, reorderPoint: 5, quantity: 5, costPerUnit: 5.49, locationId: cooler.id, vendorId: gfs.id },
    { name: "Heavy Cream, Quart", sku: "DRY-004", category: "Dairy", unit: "quart", parLevel: 12, reorderPoint: 4, quantity: 10, costPerUnit: 3.79, locationId: cooler.id, vendorId: usFoods.id },
    { name: "Cheddar Cheese, Sliced", sku: "DRY-005", category: "Dairy", unit: "lb", parLevel: 15, reorderPoint: 5, quantity: 12, costPerUnit: 4.99, locationId: cooler.id, vendorId: sysco.id },
    // Produce
    { name: "Romaine Lettuce, Case", sku: "PRD-001", category: "Produce", unit: "case", parLevel: 4, reorderPoint: 1, quantity: 3, costPerUnit: 18.99, locationId: cooler.id, vendorId: sysco.id },
    { name: "Tomatoes, Roma", sku: "PRD-002", category: "Produce", unit: "lb", parLevel: 25, reorderPoint: 8, quantity: 20, costPerUnit: 1.49, locationId: cooler.id, vendorId: gfs.id },
    { name: "Yellow Onions", sku: "PRD-003", category: "Produce", unit: "lb", parLevel: 40, reorderPoint: 12, quantity: 35, costPerUnit: 0.89, locationId: dryStorage.id, vendorId: sysco.id },
    { name: "Russet Potatoes", sku: "PRD-004", category: "Produce", unit: "lb", parLevel: 80, reorderPoint: 20, quantity: 75, costPerUnit: 0.69, locationId: dryStorage.id, vendorId: gfs.id },
    { name: "Broccoli Florets", sku: "PRD-005", category: "Produce", unit: "lb", parLevel: 20, reorderPoint: 6, quantity: 2, costPerUnit: 2.29, locationId: cooler.id, vendorId: sysco.id },
    { name: "Bell Peppers, Mixed", sku: "PRD-006", category: "Produce", unit: "lb", parLevel: 15, reorderPoint: 4, quantity: 12, costPerUnit: 2.49, locationId: cooler.id, vendorId: gfs.id },
    // Dry Goods
    { name: "Long Grain Rice, 25lb", sku: "DRY-101", category: "Dry Goods", unit: "bag", parLevel: 8, reorderPoint: 2, quantity: 6, costPerUnit: 24.99, locationId: dryStorage.id, vendorId: usFoods.id },
    { name: "Penne Pasta, 20lb", sku: "DRY-102", category: "Dry Goods", unit: "case", parLevel: 6, reorderPoint: 2, quantity: 5, costPerUnit: 19.99, locationId: dryStorage.id, vendorId: sysco.id },
    { name: "All-Purpose Flour, 50lb", sku: "DRY-103", category: "Dry Goods", unit: "bag", parLevel: 4, reorderPoint: 1, quantity: 3, costPerUnit: 18.49, locationId: dryStorage.id, vendorId: gfs.id },
    { name: "Bread Crumbs, Plain", sku: "DRY-104", category: "Dry Goods", unit: "lb", parLevel: 20, reorderPoint: 5, quantity: 18, costPerUnit: 1.29, locationId: dryStorage.id, vendorId: usFoods.id },
    { name: "Canned Tomatoes, Diced 6/10", sku: "DRY-105", category: "Dry Goods", unit: "case", parLevel: 4, reorderPoint: 1, quantity: 0, costPerUnit: 28.99, locationId: dryStorage.id, vendorId: sysco.id },
    { name: "Chicken Broth, 12qt", sku: "DRY-106", category: "Dry Goods", unit: "case", parLevel: 3, reorderPoint: 1, quantity: 2, costPerUnit: 32.99, locationId: dryStorage.id, vendorId: gfs.id },
    // Oils & Condiments
    { name: "Vegetable Oil, 35lb", sku: "OIL-001", category: "Oils & Condiments", unit: "jug", parLevel: 4, reorderPoint: 1, quantity: 3, costPerUnit: 29.99, locationId: dryStorage.id, vendorId: sysco.id },
    { name: "Olive Oil, Extra Virgin 1gal", sku: "OIL-002", category: "Oils & Condiments", unit: "jug", parLevel: 3, reorderPoint: 1, quantity: 2, costPerUnit: 24.99, locationId: dryStorage.id, vendorId: usFoods.id },
    { name: "Kosher Salt, 3lb", sku: "SPN-001", category: "Oils & Condiments", unit: "box", parLevel: 6, reorderPoint: 2, quantity: 5, costPerUnit: 3.99, locationId: dryStorage.id, vendorId: gfs.id },
    { name: "Black Pepper, Ground 1lb", sku: "SPN-002", category: "Oils & Condiments", unit: "can", parLevel: 4, reorderPoint: 1, quantity: 3, costPerUnit: 6.49, locationId: dryStorage.id, vendorId: sysco.id },
    // Beverages
    { name: "Orange Juice, 1gal", sku: "BEV-001", category: "Beverages", unit: "jug", parLevel: 8, reorderPoint: 2, quantity: 6, costPerUnit: 5.49, locationId: cooler.id, vendorId: gfs.id },
    { name: "Apple Juice, 1gal", sku: "BEV-002", category: "Beverages", unit: "jug", parLevel: 6, reorderPoint: 2, quantity: 4, costPerUnit: 4.99, locationId: cooler.id, vendorId: gfs.id },
    { name: "Coffee, Ground 5lb", sku: "BEV-003", category: "Beverages", unit: "bag", parLevel: 4, reorderPoint: 1, quantity: 3, costPerUnit: 22.99, locationId: dryStorage.id, vendorId: pfg.id },
    // Cleaning Supplies
    { name: "Dish Soap, Commercial 1gal", sku: "CLN-001", category: "Cleaning Supplies", unit: "jug", parLevel: 6, reorderPoint: 2, quantity: 4, costPerUnit: 12.99, locationId: chemical.id, vendorId: pfg.id },
    { name: "Sanitizer Concentrate, 1gal", sku: "CLN-002", category: "Cleaning Supplies", unit: "jug", parLevel: 4, reorderPoint: 1, quantity: 1, costPerUnit: 19.99, locationId: chemical.id, vendorId: pfg.id },
    { name: "Degreaser Spray, 32oz", sku: "CLN-003", category: "Cleaning Supplies", unit: "bottle", parLevel: 12, reorderPoint: 4, quantity: 8, costPerUnit: 4.99, locationId: chemical.id, vendorId: pfg.id },
    // Paper Goods
    { name: "Disposable Gloves, Medium 100ct", sku: "PPR-001", category: "Paper Goods", unit: "box", parLevel: 10, reorderPoint: 3, quantity: 7, costPerUnit: 8.99, locationId: dryStorage.id, vendorId: pfg.id },
    { name: "Food Wrap, 18in 2000ft", sku: "PPR-002", category: "Paper Goods", unit: "roll", parLevel: 4, reorderPoint: 1, quantity: 3, costPerUnit: 19.99, locationId: dryStorage.id, vendorId: pfg.id },
    { name: "Aluminum Foil, 18in 500ft", sku: "PPR-003", category: "Paper Goods", unit: "roll", parLevel: 4, reorderPoint: 1, quantity: 4, costPerUnit: 16.99, locationId: dryStorage.id, vendorId: pfg.id },
  ];

  let itemCount = 0;
  for (const item of items) {
    await db.inventoryItem.upsert({
      where: { sku: item.sku },
      update: {},
      create: item,
    });
    itemCount++;
  }
  console.log(`✅ ${itemCount} inventory items created`);

  console.log("\n🎉 Seed complete!");
  console.log("\nNext steps:");
  console.log("  1. Run: npx prisma migrate dev --name init");
  console.log("  2. The first user to log in will get VIEWER role — update to SUPER_ADMIN via Prisma Studio");
  console.log("  3. Run: npx prisma studio to manage data");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
