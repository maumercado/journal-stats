import fp from 'fastify-plugin'

export default fp(async (fastify) => {

  fastify.get('/profile',{ onRequest: [fastify.authenticate] }, async (request, reply) => {
    if (!request.user) reply.code(401).send({ error: 'Unauthorized' })
    reply.send(request.user)
  })
})
