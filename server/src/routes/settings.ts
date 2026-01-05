import { Router } from "express";
import { getTheme, updateTheme } from "../controllers/GlobalSettingsController";
import { checkJwt } from "../middlewares/checkJwt";

const router = Router();

router.get("/theme", getTheme);
router.post("/theme", checkJwt, updateTheme);

import { getAutoCheckInConfig, updateAutoCheckInConfig } from "../controllers/GlobalSettingsController";
router.get("/auto-checkin", getAutoCheckInConfig);
router.post("/auto-checkin", [checkJwt], updateAutoCheckInConfig);

export default router;
