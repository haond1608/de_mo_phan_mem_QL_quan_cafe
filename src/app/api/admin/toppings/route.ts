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
  const toppings = await db.collection("Topping").find().sort({ createdAt: -1 }).toArray();
  
  return NextResponse.json(toppings.map(t => ({ ...t, id: t._id.toString() })));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, price } = body;

  if (!name || price === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const parsedPrice = parseFloat(price);
  if (parsedPrice < 0) {
    return NextResponse.json({ error: "Price must be at least 0" }, { status: 400 });
  }

  const db = await getDb();
  try {
    const now = new Date();
    const result = await db.collection("Topping").insertOne({
      name,
      price: parsedPrice,
      createdAt: now,
      updatedAt: now,
    });

    const topping = {
      id: result.insertedId.toString(),
      name,
      price: parsedPrice,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("AuditLog").insertOne({
      userId: new ObjectId(session.id as string),
      action: "CREATE_TOPPING",
      target: `Topping:${topping.id}`,
      dataAfter: JSON.stringify(topping),
      timestamp: now,
    });

    return NextResponse.json(topping);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, name, price } = body;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const db = await getDb();
  try {
    const now = new Date();
    const updateData: any = { updatedAt: now };
    if (name) updateData.name = name;
    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (parsedPrice < 0) return NextResponse.json({ error: "Price must be at least 0" }, { status: 400 });
      updateData.price = parsedPrice;
    }

    const result = await db.collection("Topping").findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: "after" }
    );

    if (!result) return NextResponse.json({ error: "Topping not found" }, { status: 404 });

    await db.collection("AuditLog").insertOne({
      userId: new ObjectId(session.id as string),
      action: "UPDATE_TOPPING",
      target: `Topping:${id}`,
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
    const result = await db.collection("Topping").findOneAndDelete({
      _id: new ObjectId(id)
    });

    if (!result) return NextResponse.json({ error: "Topping not found" }, { status: 404 });

    await db.collection("AuditLog").insertOne({
      userId: new ObjectId(session.id as string),
      action: "DELETE_TOPPING",
      target: `Topping:${id}`,
      dataBefore: JSON.stringify(result),
      timestamp: new Date(),
    });

    return NextResponse.json({ message: "Topping deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
