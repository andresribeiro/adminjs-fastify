import fastifyCookie from '@fastify/cookie';
import fastifyFormBody from '@fastify/formbody';
import FastifySessionPlugin from '@fastify/session';
import AdminJS from 'adminjs';
import { FastifyInstance } from 'fastify';

import { withLogin } from './authentication/login.handler.js';
import { withLogout } from './authentication/logout.handler.js';
import { withProtectedRoutesHandler } from './authentication/protected-routes.handler.js';
import { buildRouter } from './buildRouter.js';
import { AuthenticationOptions } from './types.js';

/**
 * @typedef {Function} Authenticate
 * @memberof module:@adminjs/fastify
 * @description
 * function taking 2 arguments email and password
 * @param {string} [email]         email given in the form
 * @param {string} [password]      password given in the form
 * @return {CurrentAdmin | null}      returns current admin or null
 */

/**
 * Builds the Express Router which is protected by a session auth
 *
 * Normally fastify-session holds session in memory, which is
 * not optimized for production usage and, in development, it causes
 * logging out after every page refresh (if you use nodemon).
 * @static
 * @memberof module:@adminjs/fastify
 * @example
 * const ADMIN = {
 *   email: 'test@example.com',
 *   password: 'password',
 * }
 *
 * AdminJSFastify.buildAuthenticatedRouter(adminJs, {
 *   authenticate: async (email, password) => {
 *     if (ADMIN.password === password && ADMIN.email === email) {
 *       return ADMIN
 *     }
 *     return null
 *   },
 *   cookieName: 'adminjs',
 *   cookiePassword: 'somePassword',
 * }, [router])
 */
export const buildAuthenticatedRouter = async (
  admin: AdminJS,
  auth: AuthenticationOptions,
  fastifyApp: FastifyInstance,
  sessionOptions?: FastifySessionPlugin.FastifySessionOptions
): Promise<void> => {
  await fastifyApp.register(fastifyCookie, {
    secret: auth.cookiePassword,
  });
  await fastifyApp.register(FastifySessionPlugin, {
    secret: auth.cookiePassword,
    cookieName: auth.cookieName ?? 'adminjs',
    cookie: sessionOptions?.cookie ?? { secure: false },
    ...(sessionOptions ?? {}),
  });
  await fastifyApp.register(fastifyFormBody);

  await buildRouter(admin, fastifyApp);
  withProtectedRoutesHandler(fastifyApp, admin);
  withLogin(fastifyApp, admin, auth);
  withLogout(fastifyApp, admin);
};
