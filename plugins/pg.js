import pg from '@fastify/postgres'
import fp from 'fastify-plugin'

async function pgConfig(app) {
  const {
    PGDATABASE: database,
    PGPORT: port,
    PGUSER: user,
    PGHOST: host,
    PGPASSWORD: password
  } = app.config

  const config = {
    host,
    port,
    database,
    user,
    password
  }

  app.register(pg, config)
}

export default fp(pgConfig, { name: 'pg', dependencies: ['env'] })
