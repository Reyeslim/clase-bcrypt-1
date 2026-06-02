import express from "express"
import cookieParser from "cookie-parser"
import authRouter from "./routes/authRoutes.js"

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use(authRouter)

export default app
