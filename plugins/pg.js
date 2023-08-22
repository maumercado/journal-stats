import pg from '@fastify/postgres'
import fp from 'fastify-plugin'

async function pgConfig(fastify) {
  const {
    PGDATABASE: database,
    PGPORT: port,
    PGUSER: user,
    PGHOST: host,
    PGPASSWORD: password
  } = fastify.config

  const config = {
    host,
    port,
    database,
    user,
    password
  }

  fastify.register(pg, config)
}

export default fp(pgConfig, { name: 'pg', dependencies: ['env'] })
