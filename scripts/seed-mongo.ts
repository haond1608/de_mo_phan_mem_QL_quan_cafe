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
      { upsert: true },
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
      { upsert: true },
    );

    // Categories
    const categories = [
      { name: "Cà phê", description: "Các loại cà phê" },
      { name: "Trà", description: "Các loại trà" },
      { name: "Đá xay", description: "Đá xay và đồ uống lạnh" },
      { name: "Sinh tố", description: "Sinh tố trái cây" },
      { name: "Nước ép", description: "Nước ép tươi" },
    ];

    const categoryIds: Record<string, any> = {};
    for (const cat of categories) {
      const result = await db.collection("Category").findOneAndUpdate(
        { name: cat.name },
        {
          $set: { description: cat.description, updatedAt: new Date() },
          $setOnInsert: { createdAt: new Date(), productIDs: [] },
        },
        { upsert: true, returnDocument: "after" },
      );
      categoryIds[cat.name] = result!._id;
    }

    // Products
    await db.collection("Product").deleteMany({});
    await db.collection("Size").deleteMany({});

    const products = [
      // Cà phê
      {
        name: "Cà phê đen",
        basePrice: 25000,
        category: "Cà phê",
        image: "/ca-phe-den.jpg",
        sizes: [
          { name: "S", price: 25000 },
          { name: "M", price: 30000 },
          { name: "L", price: 35000 },
        ],
      },
      {
        name: "Cà phê sữa đá",
        basePrice: 29000,
        category: "Cà phê",
        image: "/ca-phe-sua-da.jpg",
        sizes: [
          { name: "S", price: 29000 },
          { name: "M", price: 34000 },
          { name: "L", price: 39000 },
        ],
      },
      {
        name: "Latte",
        basePrice: 45000,
        category: "Cà phê",
        image: "/latte.jpg",
        sizes: [
          { name: "S", price: 45000 },
          { name: "M", price: 50000 },
          { name: "L", price: 55000 },
        ],
      },
      {
        name: "Cappuccino",
        basePrice: 45000,
        category: "Cà phê",
        image: "/cappuccino.jpg",
        sizes: [
          { name: "S", price: 45000 },
          { name: "M", price: 50000 },
          { name: "L", price: 55000 },
        ],
      },
      {
        name: "Mocha",
        basePrice: 50000,
        category: "Cà phê",
        image: "/mocha.jpg",
        sizes: [
          { name: "S", price: 50000 },
          { name: "M", price: 55000 },
          { name: "L", price: 60000 },
        ],
      },
      {
        name: "Espresso",
        basePrice: 30000,
        category: "Cà phê",
        image: "/espresso.jpg",
        sizes: [
          { name: "S", price: 30000 },
          { name: "M", price: 35000 },
        ],
      },
      // Trà
      {
        name: "Trà đào",
        basePrice: 35000,
        category: "Trà",
        image: "/tra-dao.jpg",
        sizes: [
          { name: "M", price: 35000 },
          { name: "L", price: 40000 },
        ],
      },
      {
        name: "Trà vải",
        basePrice: 35000,
        category: "Trà",
        image: "/tra-vai.jpg",
        sizes: [
          { name: "M", price: 35000 },
          { name: "L", price: 40000 },
        ],
      },
      {
        name: "Trà xanh",
        basePrice: 30000,
        category: "Trà",
        image: "/tra-xanh.jpg",
        sizes: [
          { name: "M", price: 30000 },
          { name: "L", price: 35000 },
        ],
      },
      {
        name: "Trà gừng",
        basePrice: 32000,
        category: "Trà",
        image: "/tra-gung.jpg",
        sizes: [
          { name: "M", price: 32000 },
          { name: "L", price: 37000 },
        ],
      },
      {
        name: "Trà chanh",
        basePrice: 28000,
        category: "Trà",
        image: "/tra-chanh.jpg",
        sizes: [
          { name: "M", price: 28000 },
          { name: "L", price: 33000 },
        ],
      },
      // Đá xay
      {
        name: "Đá xay cà phê",
        basePrice: 40000,
        category: "Đá xay",
        image: "/da-xay-ca-phe.jpg",
        sizes: [
          { name: "M", price: 40000 },
          { name: "L", price: 45000 },
        ],
      },
      {
        name: "Đá xay chocolate",
        basePrice: 45000,
        category: "Đá xay",
        image: "/da-xay-chocolate.jpg",
        sizes: [
          { name: "M", price: 45000 },
          { name: "L", price: 50000 },
        ],
      },
      {
        name: "Đá xay matcha",
        basePrice: 45000,
        category: "Đá xay",
        image: "/da-xay-matcha.jpg",
        sizes: [
          { name: "M", price: 45000 },
          { name: "L", price: 50000 },
        ],
      },
      {
        name: "Đá xay dâu",
        basePrice: 45000,
        category: "Đá xay",
        image: "/da-xay-dau.jpg",
        sizes: [
          { name: "M", price: 45000 },
          { name: "L", price: 50000 },
        ],
      },
      // Sinh tố
      {
        name: "Sinh tố bơ",
        basePrice: 40000,
        category: "Sinh tố",
        image: "/sinh-to-bo.jpg",
        sizes: [
          { name: "M", price: 40000 },
          { name: "L", price: 45000 },
        ],
      },
      {
        name: "Sinh tố dâu",
        basePrice: 40000,
        category: "Sinh tố",
        image: "/sinh-to-dau.jpg",
        sizes: [
          { name: "M", price: 40000 },
          { name: "L", price: 45000 },
        ],
      },
      {
        name: "Sinh tố chuối",
        basePrice: 35000,
        category: "Sinh tố",
        image: "/sinh-to-chuoi.jpg",
        sizes: [
          { name: "M", price: 35000 },
          { name: "L", price: 40000 },
        ],
      },
      {
        name: "Sinh tố xoài",
        basePrice: 40000,
        category: "Sinh tố",
        image: "/sinh-to-xoai.jpg",
        sizes: [
          { name: "M", price: 40000 },
          { name: "L", price: 45000 },
        ],
      },
      // Nước ép
      {
        name: "Nước ép cam",
        basePrice: 35000,
        category: "Nước ép",
        image: "/nuoc-ep-cam.jpg",
        sizes: [
          { name: "M", price: 35000 },
          { name: "L", price: 40000 },
        ],
      },
      {
        name: "Nước ép táo",
        basePrice: 35000,
        category: "Nước ép",
        image: "/nuoc-ep-tao.jpg",
        sizes: [
          { name: "M", price: 35000 },
          { name: "L", price: 40000 },
        ],
      },
      {
        name: "Nước ép dưa hấu",
        basePrice: 30000,
        category: "Nước ép",
        image: "/nuoc-ep-dua-hau.jpg",
        sizes: [
          { name: "M", price: 30000 },
          { name: "L", price: 35000 },
        ],
      },
      {
        name: "Nước ép cà rốt",
        basePrice: 30000,
        category: "Nước ép",
        image: "/nuoc-ep-ca-rot.jpg",
        sizes: [
          { name: "M", price: 30000 },
          { name: "L", price: 35000 },
        ],
      },
    ];

    for (const product of products) {
      const productInsert = await db.collection("Product").insertOne({
        name: product.name,
        basePrice: product.basePrice,
        categoryIDs: [categoryIds[product.category]],
        status: "AVAILABLE",
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.collection("Size").insertMany(
        product.sizes.map((size: any) => ({
          name: size.name,
          price: size.price,
          productId: productInsert.insertedId,
        })),
      );
    }

    console.log("Seed completed successfully");
  } finally {
    await client.close();
  }
}

main().catch(console.error);
