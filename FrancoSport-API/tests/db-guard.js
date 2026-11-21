/**
 * Safety check for the database the test suite resets with
 * `prisma db push --force-reset`: only a local database whose name is clearly
 * a test database (e.g. fs_test) is accepted.
 */
const LOCAL_HOSTS = ['127.0.0.1', 'localhost'];
const TEST_NAME = /(^|_)test(_|$)/i;

export const assertSafeTestDatabaseUrl = (databaseUrl) => {
  let url;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('La URL de la base de datos de pruebas no es una URL válida (se esperaba mysql://usuario:clave@127.0.0.1:puerto/fs_test)');
  }

  if (!LOCAL_HOSTS.includes(url.hostname)) {
    throw new Error(
      `Se rechaza resetear la base de datos en el host "${url.hostname}": las pruebas solo pueden usar ${LOCAL_HOSTS.join(' o ')}`
    );
  }

  const dbName = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!TEST_NAME.test(dbName)) {
    throw new Error(
      `Se rechaza resetear "${dbName}": el nombre de la base de datos de pruebas debe ser "test" o llevar "test" separado por guion bajo (por ejemplo fs_test)`
    );
  }
};
