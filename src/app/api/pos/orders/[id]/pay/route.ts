import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { paymentMethod } = body;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  const db = await getDb();
  try {
    const now = new Date();
    const result = await db.collection("Order").findOneAndUpdate(
      { _id: new ObjectId(id as string) },
      {
        $set: {
          status: "PAID",
          paymentMethod,
          updatedAt: now,
        },
      },
      { returnDocument: "after" },
    );

    if (!result) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    await db.collection("AuditLog").insertOne({
      userId: new ObjectId(session.id as string),
      action: "PAY_ORDER",
      target: `Order:${id}`,
      dataAfter: JSON.stringify(result),
      timestamp: now,
    });

    return NextResponse.json({ ...result, id: result._id.toString() });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 },
    );
  }
}
