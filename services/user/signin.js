import fp from 'fastify-plugin'

export default fp(async (fastify) => {
  fastify.post(
    '/signin', {
    schema: {
      body: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          password: { type: 'string' }
        },
        required: ['email', 'password']
      }
    }
  }, async (request, reply) => {
    const { email, password } = request.body

    // Validate email and password
    if (!email || !password) {
      reply.status(400).send({ error: 'Email and password are required.' })
      return
    }

    // Check if user exists
    const { rows: [user] } = await fastify.userMethods.getUserByEmail(email)
    if (!user) {
      reply.status(401).send({ error: 'Invalid email or password.' })
      return
    }

    // Check if password is correct
    const isPasswordCorrect = await fastify.userMethods.isPasswordCorrect(password, user.password)
    if (!isPasswordCorrect) {
      reply.status(401).send({ error: 'Invalid email or password.' })
      return
    }

    // Check if user has a session
    const { rows: [session] } = await fastify.userMethods.getUserSession(email)
    if (session) {
      return { token: session.token }
    }

    // Generate JWT token
    const { password: _, ...userWithoutPassword } = user
    const token = await fastify.userMethods.createToken(userWithoutPassword)
    await fastify.userMethods.createUserSession(user.id, token)

    // Return token
    reply.send({ token })
  })

  fastify.delete('/signout', {onRequest: [ fastify.authenticate ]}  ,async (request, reply) => {
      // Delete session
    await fastify.userMethods.deleteUserSession(token)

    return reply.code(201)
  });
})
