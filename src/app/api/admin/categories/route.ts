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
  const categories = await db
    .collection("Category")
    .aggregate([
      {
        $lookup: {
          from: "Product",
          localField: "_id",
          foreignField: "categoryIDs",
          as: "products",
        },
      },
      {
        $project: {
          id: { $toString: "$_id" },
          name: 1,
          createdAt: 1,
          updatedAt: 1,
          _count: { products: { $size: "$products" } },
        },
      },
      { $sort: { createdAt: -1 } },
    ])
    .toArray();

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const db = await getDb();
  try {
    const existing = await db.collection("Category").findOne({ name });
    if (existing) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 400 },
      );
    }

    const now = new Date();
    const result = await db.collection("Category").insertOne({
      name,
      createdAt: now,
      updatedAt: now,
      productIDs: [],
    });

    const category = {
      id: result.insertedId.toString(),
      name,
      createdAt: now,
      updatedAt: now,
    };

    // Log action
    await db.collection("AuditLog").insertOne({
      userId: new ObjectId(session.id as string),
      action: "CREATE_CATEGORY",
      target: `Category:${category.id}`,
      dataAfter: JSON.stringify(category),
      timestamp: now,
    });

    return NextResponse.json(category);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, name } = body;

  if (!id || !name || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const db = await getDb();
  try {
    const now = new Date();
    const result = await db
      .collection("Category")
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { name, updatedAt: now } },
        { returnDocument: "after" },
      );

    if (!result) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    await db.collection("AuditLog").insertOne({
      userId: new ObjectId(session.id as string),
      action: "UPDATE_CATEGORY",
      target: `Category:${id}`,
      dataAfter: JSON.stringify(result),
      timestamp: now,
    });

    return NextResponse.json({ ...result, id: result._id.toString() });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
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
    // Check if category has products
    const productCount = await db.collection("Product").countDocuments({
      categoryIDs: new ObjectId(id),
    });

    if (productCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with associated products" },
        { status: 400 },
      );
    }

    const result = await db.collection("Category").findOneAndDelete({
      _id: new ObjectId(id),
    });

    if (!result) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 },
      );
    }

    await db.collection("AuditLog").insertOne({
      userId: new ObjectId(session.id as string),
      action: "DELETE_CATEGORY",
      target: `Category:${id}`,
      dataBefore: JSON.stringify(result),
      timestamp: new Date(),
    });

    return NextResponse.json({ message: "Category deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
