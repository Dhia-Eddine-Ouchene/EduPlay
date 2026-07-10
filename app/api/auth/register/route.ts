import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendWelcomeEducator, sendWelcomeStudent } from "@/lib/mail";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  creatorType: z.enum(["Teacher", "Content Creator", "Both", "Student"]),
});

export async function POST(req: Request) {
  try {
    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid input", details: body.error.flatten() }, { status: 400 });
    }
    const { name, email, password, creatorType } = body.data;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });

    const hashed = await hash(password, 12);
    const isStudent = creatorType === "Student";

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        role: isStudent ? "STUDENT" : "EDUCATOR",
        ...(isStudent ? {} : { educatorProfile: { create: { creatorType } } }),
      },
    });

    if (isStudent) void sendWelcomeStudent(user.email, user.name);
    else void sendWelcomeEducator(user.email, user.name);

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
