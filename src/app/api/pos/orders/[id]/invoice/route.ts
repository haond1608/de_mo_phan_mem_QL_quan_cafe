import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  const db = await getDb();
  try {
    const order = await db.collection("Order").aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: "OrderItem",
          localField: "_id",
          foreignField: "orderId",
          as: "items"
        }
      },
      {
        $lookup: {
          from: "User",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" }
    ]).next();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // BR10: Check if paid
    if (order.status !== "PAID") {
      return NextResponse.json({ error: "Cannot print invoice for unpaid order" }, { status: 400 });
    }

    // Fetch product details for items
    for (const item of order.items) {
      item.product = await db.collection("Product").findOne({ _id: item.productId });
      item.size = await db.collection("Size").findOne({ _id: item.sizeId });
    }

    return NextResponse.json({
      id: order._id.toString(),
      code: order.code,
      totalPrice: order.totalPrice,
      paymentMethod: order.paymentMethod,
      createdAt: order.createdAt,
      staff: order.user.name,
      items: order.items.map((item: any) => ({
        name: item.product.name,
        size: item.size.name,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        note: item.note
      }))
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
