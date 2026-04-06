/**
 * Variables mínimas para levantar AppModule en e2e sin depender de un .env local.
 */
process.env.JWT_SECRET =
  process.env.JWT_SECRET ??
  'e2e-test-jwt-secret-must-be-long-enough-for-hs256';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '1h';
