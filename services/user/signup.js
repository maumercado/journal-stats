import fp from 'fastify-plugin';

export default async function userSignup (fastify) {

  fastify.post('/signup', async (request, reply) => {
    const { email, firstName, lastName, password } = request.body;

    // Check if email already exists in database
    const result = await fastify.userMethods.getUserByEmail(email);

    if (result.rowCount > 0) {
      return reply
        .code(400)
        .send({ success: false, message: 'Email already exists.' });
    }

    // If email doesn't exist, create a new user
    try {
      const hashedPassword = await fastify.userMethods.generateHashPassword(password);
      const token = await fastify.userMethods.createUser(email, firstName, lastName, hashedPassword);
      await fastify.userMethods.createUserSession(user.id, token);

      return reply
        .code(201)
        .send({ success: true, message: 'User created successfully.', token });
    } catch (err) {
      request.log.error(err, 'Error creating user.');
      return reply
        .code(500)
        .send({ success: false, message: 'An error occurred while creating the user.' });
    }
  });
}

fp(userSignup, { name: 'userSignup', dependencies: ['pg', 'env'] });
