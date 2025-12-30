import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import payments from "./routes/payments.routes.js";
import auth from "./routes/auth.routes.js";
import course from "./routes/course.routes.js";
import videos from "./routes/videos.routes.js";

dotenv.config();

const app = express();

/* ✅ RENDER-SAFE CORS CONFIG */
app.use(
  cors({
    origin: [
      "http://localhost:8081",
      "http://localhost:5173",
      "https://dellacourse.vercel.app/",
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use("/api/payments", payments);
app.use("/api/auth", auth);
app.use("/api/course", course);
app.use("/api/videos", videos);

app.get("/", (req, res) => {
  res.send("Backend running");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
