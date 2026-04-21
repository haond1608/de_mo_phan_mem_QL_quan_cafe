import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const logs = await db
    .collection("AuditLog")
    .aggregate([
      {
        $lookup: {
          from: "User",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          id: { $toString: "$_id" },
          action: 1,
          target: 1,
          timestamp: 1,
          user: { name: 1, username: 1 },
        },
      },
      { $sort: { timestamp: -1 } },
      { $limit: 100 },
    ])
    .toArray();

  return NextResponse.json(logs);
}
