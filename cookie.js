'use strict';

const {parse: parseCookie, serialize: serializeCookie} = require('cookie');
const {sign, unsign} = require('cookie-signature');

const clearCookieExpiresDate = new Date(1);

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
  req.cookies = cookieHeader === undefined ? {} : parseCookie(cookieHeader);
  next();
}

function setCookie(name, value, options) {
  options = Object.assign({path: '/'}, options);
  this.append('set-cookie', serializeCookie(name, value, options));

  return this;
}

function clearCookie(name, options) {
  // IE/Edge don't support Max-Age=0, so use Expires instead
  options = Object.assign({expires: null, maxAge: null}, options);
  options.expires = clearCookieExpiresDate;
  options.maxAge = null; // In case options contains maxAge

  this.setCookie(name, '', options);

  return this;
}

cookie.meta = {
  name: '@medley/cookie',
};

module.exports = cookie;
