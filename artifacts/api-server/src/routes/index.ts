import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import customersRouter from "./customers";
import collectionsRouter from "./collections";
import receiptsRouter from "./receipts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(customersRouter);
router.use(collectionsRouter);
router.use(receiptsRouter);

export default router;
