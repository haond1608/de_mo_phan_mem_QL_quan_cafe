import { getDb } from "@/lib/mongodb";
import { login } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  const db = await getDb();
  const user = await db.collection("User").findOne({ username });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 },
    );
  }

  await login({
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    name: user.name,
  });

  return NextResponse.json({
    user: {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      name: user.name,
    },
  });
}
