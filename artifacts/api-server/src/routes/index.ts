import { Router, type IRouter } from "express";
import healthRouter from "./health";
import domainRouter from "./domain";

const router: IRouter = Router();

router.use(healthRouter);
router.use(domainRouter);

export default router;
