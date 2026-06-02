import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import prisma from "../lib/prisma.js"

const login = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) {
    throw new Error("El email o la contraseña no son válidos")
  }

  const isValid = await bcrypt.compare(password, user.password)

  if (!isValid) {
    throw new Error("El email o la contraseña no son válidos")
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "2h" },
  )

  return token
}

export const authService = { login }
