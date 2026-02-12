import Account from "../models/Account.js";
import { PLAN_CONFIG } from "../planConfig.js";

export const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const account = await Account.findById(req.user.accountId);

      if (!account) {
        return res.status(404).json({
          message: "Account not found",
        });
      }

      const planFeatures = PLAN_CONFIG[account.plan];

      if (!planFeatures || !planFeatures[featureName]) {
        return res.status(403).json({
          message: `Upgrade to access ${featureName}`,
        });
      }

      next();
    } catch (error) {
      console.error("Feature check error:", error);
      res.status(500).json({
        message: "Feature validation failed",
      });
    }
  };
};
