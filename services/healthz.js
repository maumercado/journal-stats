import fp from 'fastify-plugin'

export default async function healtzh(fastify) {
  fastify.get('/', async (request) => {
    return { status: 'ok' }
  })
}

fp(productRoutes, { dependencies: ['productService'] })
