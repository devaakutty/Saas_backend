export const PLAN_CONFIG = {
  starter: {
    id: "starter",
    name: "Starter",

    // 🔢 Limits
    userLimit: 1,
    invoiceLimit: 5, // 🔥 changed from 10 → 5

    // 🎯 Feature flags
    analytics: false,
    prioritySupport: false,
    customBranding: false,
    automation: false,
    apiAccess: false,
  },

  pro: {
    id: "pro",
    name: "Pro",

    userLimit: 5,
    invoiceLimit: null, // null = unlimited

    analytics: true,
    prioritySupport: true,
    customBranding: false,
    automation: false,
    apiAccess: false,
  },

  business: {
    id: "business",
    name: "Business",

    userLimit: 10,
    invoiceLimit: null, // unlimited

    analytics: true,
    prioritySupport: true,
    customBranding: true,
    automation: true,
    apiAccess: false,
  },

  enterprise: {
    id: "enterprise",
    name: "Enterprise",

    userLimit: 25,
    invoiceLimit: null,

    analytics: true,
    prioritySupport: true,
    customBranding: true,
    automation: true,
    apiAccess: true,
  },
};
