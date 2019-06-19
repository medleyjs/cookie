'use strict';

const {parse, serialize} = require('cookie');
const {sign, unsign} = require('cookie-signature');

function cookie(app, {secret} = {}) {
  app.decorateRequest('cookies', null);

  app.addHook('onRequest', onRequest);

  app.decorateResponse('setCookie', setCookie);
  app.decorateResponse('clearCookie', clearCookie);

  app.decorateRequest('unsignCookie', function unsignCookie(value) {
    return unsign(value, secret);
  });

  app.decorateResponse('signCookie', function signCookie(value) {
    return sign(value, secret);
  });
}

function onRequest(req, res, next) {
  const cookieHeader = req.headers.cookie;

  req.cookies = cookieHeader === undefined ? {} : parse(cookieHeader);

  next();
}

function setCookie(name, value, options) {
  const opts = Object.assign({path: '/'}, options);

  this.append('set-cookie', serialize(name, value, opts));

  return this;
}

const clearCookieExpiresDate = new Date(1);

function clearCookie(name, options) {
  // IE/Edge don't support Max-Age=0, so use Expires instead
  const clearOpts = Object.assign({
    expires: clearCookieExpiresDate,
    maxAge: null,
    path: '/',
  }, options);

  clearOpts.maxAge = null; // In case options contains maxAge

  this.append('set-cookie', serialize(name, '', clearOpts));

  return this;
}

cookie.meta = {
  name: '@medley/cookie',
};

module.exports = cookie;
