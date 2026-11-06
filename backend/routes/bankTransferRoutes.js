import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.js";
import {
  getBankDetails,
  createBankTransferRequest,
  getMyBankTransfers,
} from "../controllers/bankTransferController.js";

const router = Router();

// Students only.
router.use(authenticate, authorize("student"));

router.get("/details", getBankDetails);
router.get("/mine", getMyBankTransfers);
router.post("/", createBankTransferRequest);

export default router;
