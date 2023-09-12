import fp from 'fastify-plugin'

export default async function healthz (fastify) {
  fastify.get('/', async () => {
    return { status: 'ok' }
  })
}

fp(healthz, { dependencies: [] })
