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

      const { password: _, ...userWithoutPassword } = user
      const userResponse = { createdAt: user.created_at, firstName: user.firstname, lastName: user.lastname, email: user.email, userId: user.id }
      // Check if user has a session
      const session = await fastify.userMethods.getUserSession(user)
      if (session) {
        return { token: session.token, ...userResponse }
      }

      // Generate JWT token
      const token = await fastify.userMethods.createToken(userWithoutPassword)
      await fastify.userMethods.createUserSession(userWithoutPassword, token)

      // Return token and user
      return { ...userResponse, token }
    })

  fastify.delete('/signout', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    // Delete session
    await fastify.userMethods.deleteUserSession(request.user.token)

    return reply.code(201)
  })
})
