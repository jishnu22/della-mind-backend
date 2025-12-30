import express from "express";
import { lessons } from "../data/lessons.js";

const router = express.Router();

router.get("/lessons", (_, res) => {
  res.json(
    lessons.map(({ streamId, ...rest }) => rest)
  );
});

export default router;
