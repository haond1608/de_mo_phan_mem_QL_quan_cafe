import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: "Order must have at least one item" },
      { status: 400 },
    );
  }

  if (totalPrice === undefined || totalPrice <= 0) {
    return NextResponse.json({ error: "Invalid total price" }, { status: 400 });
  }

  const orderCode = `BILL-${Date.now()}`;
  const db = await getDb();

  if (!ObjectId.isValid(session.id)) {
    return NextResponse.json(
      { error: "Invalid session. Please log in again." },
      { status: 401 },
    );
  }

  try {
    const now = new Date();
    const orderInsert = await db.collection("Order").insertOne({
      code: orderCode,
      status: "PENDING",
      totalPrice,
      userId: new ObjectId(session.id as string),
      createdAt: now,
      updatedAt: now,
    });

    const orderId = orderInsert.insertedId;

    const orderItems = items.map((item: any) => ({
      orderId: orderId,
      productId: new ObjectId(item.productId),
      sizeId: new ObjectId(item.sizeId),
      quantity: item.quantity,
      price: item.price,
      note: item.note || null,
    }));

    const orderItemsInsert = await db
      .collection("OrderItem")
      .insertMany(orderItems);

    // Note: Toppings logic would go here if implemented in the frontend.
    // For now, we follow the simplified structure.

    await db.collection("AuditLog").insertOne({
      userId: new ObjectId(session.id as string),
      action: "CREATE_ORDER",
      target: `Order:${orderId}`,
      dataAfter: JSON.stringify({
        id: orderId.toString(),
        code: orderCode,
        totalPrice,
      }),
      timestamp: now,
    });

    return NextResponse.json({
      id: orderId.toString(),
      code: orderCode,
      status: "PENDING",
      totalPrice,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
