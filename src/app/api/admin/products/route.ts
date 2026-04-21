import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const products = await db.collection("Product").aggregate([
    {
      $lookup: {
        from: "Category",
        localField: "categoryIDs",
        foreignField: "_id",
        as: "categories"
      }
    },
    {
      $lookup: {
        from: "Size",
        localField: "_id",
        foreignField: "productId",
        as: "sizes"
      }
    },
    {
      $project: {
        id: { $toString: "$_id" },
        name: 1,
        description: 1,
        image: 1,
        basePrice: 1,
        status: 1,
        categoryIDs: 1,
        createdAt: 1,
        updatedAt: 1,
        categories: {
          $map: {
            input: "$categories",
            as: "cat",
            in: { id: { $toString: "$$cat._id" }, name: "$$cat.name" }
          }
        },
        sizes: {
          $map: {
            input: "$sizes",
            as: "size",
            in: { id: { $toString: "$$size._id" }, name: "$$size.name", price: "$$size.price" }
          }
        }
      }
    },
    { $sort: { createdAt: -1 } }
  ]).toArray();

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, basePrice, categoryId, sizes } = body;

  if (!name || basePrice === undefined || !categoryId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const parsedPrice = parseFloat(basePrice);
  if (parsedPrice <= 0) {
    return NextResponse.json({ error: "Price must be greater than 0" }, { status: 400 });
  }

  if (!ObjectId.isValid(categoryId)) {
    return NextResponse.json({ error: "Invalid category ID" }, { status: 400 });
  }

  const db = await getDb();
  try {
    const now = new Date();
    const productInsert = await db.collection("Product").insertOne({
      name,
      description,
      basePrice: parsedPrice,
      categoryIDs: [new ObjectId(categoryId as string)],
      status: "AVAILABLE",
      createdAt: now,
      updatedAt: now,
    });

    const productId = productInsert.insertedId;

    if (sizes && sizes.length > 0) {
      await db.collection("Size").insertMany(
        sizes.map((s: any) => ({
          name: s.name,
          price: parseFloat(s.price),
          productId: productId,
        }))
      );
    }

    // Update Category with new product ID
    await db.collection("Category").updateOne(
      { _id: new ObjectId(categoryId as string) },
      { $addToSet: { productIDs: productId } }
    );

    const product = {
      id: productId.toString(),
      name,
      description,
      basePrice: parsedPrice,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("AuditLog").insertOne({
      userId: new ObjectId(session.id as string),
      action: "CREATE_PRODUCT",
      target: `Product:${product.id}`,
      dataAfter: JSON.stringify(product),
      timestamp: now,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, description, basePrice, categoryIDs, status, sizes } = body;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const parsedPrice = parseFloat(basePrice);
  if (parsedPrice !== undefined && parsedPrice <= 0) {
    return NextResponse.json({ error: "Price must be greater than 0" }, { status: 400 });
  }

  const db = await getDb();
  try {
    const now = new Date();
    const updateData: any = { updatedAt: now };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (parsedPrice !== undefined) updateData.basePrice = parsedPrice;
    if (status) updateData.status = status;
    if (categoryIDs) updateData.categoryIDs = categoryIDs.map((cid: string) => new ObjectId(cid));

    const result = await db.collection("Product").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Update sizes if provided
    if (sizes) {
      await db.collection("Size").deleteMany({ productId: new ObjectId(id) });
      if (sizes.length > 0) {
        await db.collection("Size").insertMany(
          sizes.map((s: any) => ({
            name: s.name,
            price: parseFloat(s.price),
            productId: new ObjectId(id),
          }))
        );
      }
    }

    await db.collection("AuditLog").insertOne({
      userId: new ObjectId(session.id as string),
      action: "UPDATE_PRODUCT",
      target: `Product:${id}`,
      dataAfter: JSON.stringify(result),
      timestamp: now,
    });

    return NextResponse.json({ ...result, id: result._id.toString() });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const db = await getDb();
  try {
    // BR02: Check if product is in any unpaid order
    const unpaidOrderCount = await db.collection("Order").aggregate([
      { $match: { status: "PENDING" } },
      {
        $lookup: {
          from: "OrderItem",
          localField: "_id",
          foreignField: "orderId",
          as: "items"
        }
      },
      { $match: { "items.productId": new ObjectId(id) } },
      { $count: "count" }
    ]).toArray();

    if (unpaidOrderCount.length > 0 && unpaidOrderCount[0].count > 0) {
      return NextResponse.json(
        { error: "Cannot delete product that exists in an unpaid order. Try disabling it instead." },
        { status: 400 }
      );
    }

    const result = await db.collection("Product").findOneAndDelete({
      _id: new ObjectId(id)
    });

    if (!result) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Clean up associated sizes
    await db.collection("Size").deleteMany({ productId: new ObjectId(id) });

    await db.collection("AuditLog").insertOne({
      userId: new ObjectId(session.id as string),
      action: "DELETE_PRODUCT",
      target: `Product:${id}`,
      dataBefore: JSON.stringify(result),
      timestamp: new Date()
    });

    return NextResponse.json({ message: "Product deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
