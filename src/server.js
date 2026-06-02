import app from "./app.js"

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`🔐 Auth API corriendo en http://localhost:${PORT}`)
  console.log(`POST /login  |  POST /logout  |  GET /profile  |  GET /admin`)
})
