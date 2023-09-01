import fp from 'fastify-plugin'
import Postgrator from "postgrator";

async function runMigrations(app) {
  let client
  try {
    client = await app.pg.connect()

    const postgrator = new Postgrator({
      migrationPattern: `${process.cwd()}/migrations/*` ,
      driver: "pg",
      database: app.config.PGDATABASE,
      schemaTable: "schemaversion",
      execQuery: (query) => client.query(query),
    });

    await postgrator.migrate();
  } catch (err) {
    app.log.error(err, 'Error running migrations')
    throw err
  } finally {
    await client.release()
  }
}

export default fp(runMigrations, { name: 'migrations', dependencies: ['pg'] })
