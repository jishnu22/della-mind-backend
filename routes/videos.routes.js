import express from "express";
import { lessons } from "../data/lessons.js";

const router = express.Router();

router.get("/stream", (req, res) => {
  const lessonId = Number(req.query.lessonId);
  const lesson = lessons.find(l => l.id === lessonId);

  if (!lesson) {
    return res.status(404).json({ error: "Video not found" });
  }

  res.json({
    url: `${process.env.CLOUDFLARE_STREAM_BASE}/${lesson.streamId}/iframe?autoplay=true&muted=true`
  });
});

export default router;
