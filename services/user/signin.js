import fp from 'fastify-plugin';

export default fp(async (fastify) => {
  fastify.post('/signin', async (request, reply) => {
    const { email, password } = request.body;

    // Validate email and password
    if (!email || !password) {
      reply.status(400).send({ error: 'Email and password are required.' });
      return;
    }

    // Check if user exists
    const user = await fastify.userMethods.getUserByEmail(email);
    if (!user) {
      reply.status(401).send({ error: 'Invalid email or password.' });
      return;
    }

    // Check if password is correct
    const isPasswordCorrect = await fastify.userMethods.isPasswordCorrect(password, user.password);
    if (!isPasswordCorrect) {
      reply.status(401).send({ error: 'Invalid email or password.' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, fastify.config.JWT_SECRET);
    await fastify.userMethods.createUserSession(user.id, token);

    // Return token
    reply.send({ token });
  });
});
