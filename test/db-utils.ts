export function getTestDatabaseUrl(envKey: string = 'DATABASE_URL'): string {
  const originalUrl = process.env[envKey];
  if (!originalUrl) {
    throw new Error(`${envKey} environment variable is not set`);
  }

  if (!originalUrl.includes('_test?')) {
    return originalUrl.replace(/\/([^?]+)\?/, '/$1_test?');
  }

  return originalUrl;
}
