import { authService } from "../services/auth.js"

const cookieOptions = {
  httpOnly: true,
  secure: false,
  maxAge: 2 * 60 * 60 * 1000,
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        ok: false,
        error: "Email y contraseña son obligatorios",
      })
    }

    const token = await authService.login(email, password)

    res.cookie("token", token, cookieOptions)

    res.json({
      ok: true,
      message: "El login se realizó con éxito",
    })
  } catch (error) {
    res.status(401).json({
      ok: false,
      error: error.message,
    })
  }
}

const logout = (req, res) => {
  res.clearCookie("token")
  res.json({
    ok: true,
    message: "Sesión cerrada",
  })
}

const getProfile = (req, res) => {
  res.json({
    ok: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    },
  })
}

const getAdmin = (req, res) => {
  res.json({
    ok: true,
    message: `Bienvenido al panel de admin, ${req.user.email}`,
  })
}

export const authController = {
  login,
  logout,
  getProfile,
  getAdmin,
}
