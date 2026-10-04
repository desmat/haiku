// Ignored in production so a leaked env var can't swap out real services in a deployment.
// Keep `process.env.X` literal: client code relies on next.config.js `env` inlining.
export const isAiMock = () => process.env.NODE_ENV !== "production" && process.env.AI_MOCK == "true";

export const isBlobMock = () => process.env.NODE_ENV !== "production" && process.env.BLOB_MOCK == "true";
