import fp from 'fastify-plugin'
import Env from '@fastify/env'

async function Config(app) {
  const schema = {
    type: 'object',
    required: [
      'PGUSER',
      'PGHOST',
      'PGPORT',
      'PGDATABASE',
      'PGPASSWORD',
      'NODE_ENV'
    ],
    properties: {
      PGUSER: {
        type: 'string'
      },
      PGHOST: {
        type: 'string'
      },
      PGPORT: {
        type: 'number',
        default: 5432
      },
      PGDATABASE: {
        type: 'string'
      },
      PGPASSWORD: {
        type: 'string'
      },
      NODE_ENV: {
        type: 'string',
        default: 'development'
      }
    }
  }

  app.register(Env, { schema })
}

export default fp(Config, { name: 'env' })
