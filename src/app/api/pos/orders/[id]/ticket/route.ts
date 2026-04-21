import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function POST(
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
    // Find items not yet sent to kitchen
    const unsentItems = await db.collection("OrderItem").aggregate([
      { $match: { orderId: new ObjectId(id), isSentToKitchen: { $ne: true } } },
      {
        $lookup: {
          from: "Product",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      {
        $lookup: {
          from: "Size",
          localField: "sizeId",
          foreignField: "_id",
          as: "size"
        }
      },
      { $unwind: "$product" },
      { $unwind: "$size" }
    ]).toArray();

    if (unsentItems.length === 0) {
      return NextResponse.json({ message: "No new items to send to kitchen" }, { status: 200 });
    }

    // Update items as sent
    await db.collection("OrderItem").updateMany(
      { _id: { $in: unsentItems.map(item => item._id) } },
      { $set: { isSentToKitchen: true, sentAt: new Date() } }
    );

    // Format ticket data
    const ticket = {
      orderId: id,
      timestamp: new Date(),
      items: unsentItems.map(item => ({
        name: item.product.name,
        size: item.size.name,
        quantity: item.quantity,
        note: item.note
      }))
    };

    return NextResponse.json(ticket);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to send ticket" }, { status: 500 });
  }
}
