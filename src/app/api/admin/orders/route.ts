import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  try {
    const orders = await db.collection("Order").aggregate([
      {
        $lookup: {
          from: "User",
          localField: "userId",
          foreignField: "_id",
          as: "staff"
        }
      },
      { $unwind: "$staff" },
      {
        $lookup: {
          from: "OrderItem",
          localField: "_id",
          foreignField: "orderId",
          as: "items"
        }
      },
      {
        $project: {
          id: { $toString: "$_id" },
          code: 1,
          status: 1,
          totalPrice: 1,
          paymentMethod: 1,
          createdAt: 1,
          staffName: "$staff.name",
          itemCount: { $size: "$items" }
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 100 }
    ]).toArray();

    return NextResponse.json(orders);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
