import bcrypt from "bcrypt"
import prisma from "../src/lib/prisma.js"

const users = [
  { email: "ana@example.com", password: "password123", role: "user" },
  { email: "admin@example.com", password: "admin123", role: "admin" },
  { email: "reyes@test.com", password: "reyes123", role: "user" },
  { email: "prueba@test.com", password: "prueba123", role: "admin" },
  { email: "prueba2@test.com", password: "prueba123", role: "user" },
]

console.log("Insertando usuarios")

for (const user of users) {
  const hash = await bcrypt.hash(user.password, 10)

  await prisma.user.upsert({
    where: { email: user.email },
    update: {},
    create: { email: user.email, password: hash, role: user.role },
  })

  console.log(`${user.email} (rol: ${user.role})`)
}

await prisma.$disconnect()
console.log("Usuarios insertados")
