import fp from 'fastify-plugin';

export default fp(async (fastify) => {
  fastify.register(require('fastify-jwt'), {
    secret: fastify.config.JWT_SECRET,
  })

  fastify.decorate('authenticate', async function (request) {
    try {
      await request.jwtVerify()
    } catch (err) {
      return err
    }
  })
}, { name: 'jwt', dependencies: ['env'] })
