import { Router } from "express";
import { getTheme, updateTheme } from "../controllers/GlobalSettingsController";
import { checkJwt } from "../middlewares/checkJwt";

const router = Router();

router.get("/theme", getTheme);
router.post("/theme", checkJwt, updateTheme);


export default router;
