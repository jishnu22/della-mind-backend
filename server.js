import express from "express";
import cors from "cors";

import payments from "./routes/payments.routes.js";
import auth from "./routes/auth.routes.js";
import course from "./routes/course.routes.js";
import videos from "./routes/videos.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/payments", payments);
app.use("/api/auth", auth);
app.use("/api/course", course);
app.use("/api/videos", videos);

app.get("/", (_, res) => res.send("Backend running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
