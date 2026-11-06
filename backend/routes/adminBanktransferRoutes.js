import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  listBankTransfers,
  approveBankTransfer,
  rejectBankTransfer,
} from "../controllers/adminBankTransferController.js";

const router = Router();

// Admins only.
router.use(authenticate, authorize("admin"));

router.get("/", listBankTransfers);
router.post("/:id/approve", approveBankTransfer);
router.post("/:id/reject", rejectBankTransfer);

export default router;
