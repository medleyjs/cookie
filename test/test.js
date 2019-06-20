'use strict';

const assert = require('assert');
const medley = require('@medley/medley');
const selfRequest = require('@medley/self-request');
const cookie = require('..');

function makeApp(cookieOpts) {
  const app = medley();

  app.register(cookie, cookieOpts);
  app.register(selfRequest);

  return app;
}

describe('req.cookies', () => {

  it('should be an object of parsed cookies', async () => {
    const app = makeApp();

    app.get('/', (req, res) => {
      assert.deepStrictEqual(req.cookies, {
        foo: 'bar',
        withSpace: 'a space',
      });

      res.send('success');
    });

    const res = await app.request({
      url: '/',
      headers: {
        Cookie: 'foo=bar; withSpace=a%20space',
      },
    });
    assert.strictEqual(res.body, 'success');
  });

  it('should support parsed cookies using the decode option', async () => {
    const app = makeApp({
      decode: str => str.replace(/-/g, '_'),
    });

    app.get('/', (req, res) => {
      assert.deepStrictEqual(req.cookies, {
        foo: 'bar_buzz',
        zab: '_a%20buzz_buzz',
      });

      res.send('success');
    });

    const res = await app.request({
      url: '/',
      headers: {
        Cookie: 'foo=bar-buzz; zab=-a%20buzz-buzz',
      },
    });
    assert.strictEqual(res.body, 'success');
  });

});


describe('res.setCookie()', () => {

  it('should set a cookie to send to the client', async () => {
    const app = makeApp();

    app.get('/', (req, res) => {
      res.setCookie('foo', 'bar');
      res.send();
    });

    const res = await app.request('/');
    assert.deepStrictEqual(res.headers['set-cookie'], ['foo=bar; Path=/']);
  });

  it('should set multiple cookies to send to the client', async () => {
    const app = makeApp();

    app.get('/', (req, res) => {
      res.setCookie('a', '1');
      res.setCookie('b', '2', {maxAge: 3600, httpOnly: true, secure: true});
      res.send();
    });

    const res = await app.request('/');
    assert.deepStrictEqual(res.headers['set-cookie'], [
      'a=1; Path=/',
      'b=2; Max-Age=3600; Path=/; HttpOnly; Secure',
    ]);
  });

});


describe('res.clearCookie()', () => {

  it('should clear a cookie', async () => {
    const app = makeApp();

    app.get('/', (req, res) => {
      res.clearCookie('foo');
      res.send();
    });

    const res = await app.request('/');
    assert.deepStrictEqual(
      res.headers['set-cookie'],
      ['foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT']
    );
  });

  it('should clear a cookie with options', async () => {
    const app = makeApp();

    app.get('/', (req, res) => {
      res.clearCookie('foo', {maxAge: 3600, httpOnly: true, secure: true});
      res.send();
    });

    const res = await app.request('/');
    assert.deepStrictEqual(
      res.headers['set-cookie'],
      ['foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure']
    );
  });

  it('should clear multiple cookies', async () => {
    const app = makeApp();

    app.get('/', (req, res) => {
      res.clearCookie('a', {path: '/some/path'});
      res.clearCookie('b', {httpOnly: true, secure: true});
      res.send();
    });

    const res = await app.request('/');
    assert.deepStrictEqual(res.headers['set-cookie'], [
      'a=; Path=/some/path; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      'b=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure',
    ]);
  });

});


describe('res.signCookie() and req.unsignCookie()', () => {

  it('should sign and unsign cookies', async () => {
    const app = makeApp({secret: 'tobiiscool'});

    app.get('/', (req, res) => {
      const signed = res.signCookie('hello');
      assert.strictEqual(signed, 'hello.DGDUkGlIkCzPz+C0B064FNgHdEjox7ch8tOBGslZ5QI');

      const unsigned = req.unsignCookie(signed);
      assert.strictEqual(unsigned, 'hello');

      res.send('success');
    });

    const res = await app.request('/');
    assert.strictEqual(res.body, 'success');
  });

});
