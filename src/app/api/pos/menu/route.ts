import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();

  const categories = await db.collection("Category").find().toArray();
  const products = await db
    .collection("Product")
    .aggregate([
      { $match: { status: "AVAILABLE" } },
      {
        $lookup: {
          from: "Size",
          localField: "_id",
          foreignField: "productId",
          as: "sizes",
        },
      },
      {
        $project: {
          id: { $toString: "$_id" },
          name: 1,
          basePrice: 1,
          categoryIDs: {
            $map: {
              input: "$categoryIDs",
              as: "cid",
              in: { $toString: "$$cid" },
            },
          },
          sizes: {
            $map: {
              input: "$sizes",
              as: "size",
              in: {
                id: { $toString: "$$size._id" },
                name: "$$size.name",
                price: "$$size.price",
              },
            },
          },
        },
      },
    ])
    .toArray();

  const toppings = await db.collection("Topping").find().toArray();

  return NextResponse.json({
    categories: categories.map((c) => ({ ...c, id: c._id.toString() })),
    products,
    toppings: toppings.map((t) => ({ ...t, id: t._id.toString() })),
  });
}
