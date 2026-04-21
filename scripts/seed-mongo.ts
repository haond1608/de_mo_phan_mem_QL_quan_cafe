import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import "dotenv/config";

const uri = process.env.DATABASE_URL!;
const client = new MongoClient(uri);

async function main() {
  try {
    await client.connect();
    const db = client.db();

    const passwordHash = await bcrypt.hash("admin123", 10);
    const staffHash = await bcrypt.hash("staff123", 10);

    // Users
    await db.collection("User").updateOne(
      { username: "admin" },
      {
        $set: {
          name: "Manager",
          passwordHash: passwordHash,
          role: "MANAGER",
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    await db.collection("User").updateOne(
      { username: "staff" },
      {
        $set: {
          name: "Staff User",
          passwordHash: staffHash,
          role: "STAFF",
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    // Categories
    const coffeeResult = await db.collection("Category").findOneAndUpdate(
      { name: "Cà phê" },
      {
        $set: { updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date(), productIDs: [] },
      },
      { upsert: true, returnDocument: "after" }
    );

    const teaResult = await db.collection("Category").findOneAndUpdate(
      { name: "Trà" },
      {
        $set: { updatedAt: new Date() },
        $setOnInsert: { createdAt: new Date(), productIDs: [] },
      },
      { upsert: true, returnDocument: "after" }
    );

    const coffeeId = coffeeResult!._id;
    const teaId = teaResult!._id;

    // Products
    await db.collection("Product").deleteMany({});
    await db.collection("Size").deleteMany({});

    const latteInsert = await db.collection("Product").insertOne({
      name: "Latte",
      basePrice: 45000,
      categoryIDs: [coffeeId],
      status: "AVAILABLE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.collection("Size").insertMany([
      { name: "S", price: 45000, productId: latteInsert.insertedId },
      { name: "M", price: 50000, productId: latteInsert.insertedId },
      { name: "L", price: 55000, productId: latteInsert.insertedId },
    ]);

    const teaInsert = await db.collection("Product").insertOne({
      name: "Trà Đào",
      basePrice: 35000,
      categoryIDs: [teaId],
      status: "AVAILABLE",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.collection("Size").insertMany([
      { name: "M", price: 35000, productId: teaInsert.insertedId },
      { name: "L", price: 40000, productId: teaInsert.insertedId },
    ]);

    console.log("Seed completed successfully");
  } finally {
    await client.close();
  }
}

main().catch(console.error);
