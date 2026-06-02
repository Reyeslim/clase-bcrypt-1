import express from "express"
import { authController } from "../controllers/auth.js"
import { authMiddleware } from "../middlewares/authMiddleware.js"
import { requireRole } from "../middlewares/requireRole.js"

const router = express.Router()

// Ruta pública
router.post("/login", authController.login)
// Rutas protegidas
router.get("/profile", authMiddleware, authController.getProfile)
router.post("/logout", authController.logout)
// Ruta restringida por rol
router.get(
  "/admin",
  authMiddleware,
  requireRole("admin"),
  authController.getAdmin,
)

export default router
