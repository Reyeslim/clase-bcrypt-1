import jwt from "jsonwebtoken"

export const authMiddleware = (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({
      ok: false,
      error: "No autenticado",
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // {id, email, role}
    next()
  } catch (error) {
    res.clearCookie("token")
    res.status(401).json({
      ok: false,
      error: "Sesión inválida o expirada",
    })
  }
}
