import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { getCart, replaceCart } from "../controller/cartController";
const router = Router();
router.use(protect);
router.get("/", getCart);
// PUT replaces the complete current bag; revision prevents stale overwrites.
router.put("/", replaceCart);
export default router;
