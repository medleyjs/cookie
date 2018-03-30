'use strict';

const assert = require('assert');
const medley = require('@medley/medley');
const cookie = require('..');

describe('req.cookies', () => {

  it('should be an object of parsed cookies', () => {
    const app = medley();

    app.registerPlugin(cookie);

    app.get('/', (req, res) => {
      assert.deepStrictEqual(req.cookies, {
        foo: 'bar',
        withSpace: 'a space',
      });

      res.send('success');
    });

    return app.inject({
      url: '/',
      headers: {
        Cookie: 'foo=bar; withSpace=a%20space',
      },
    }).then((res) => {
      assert.strictEqual(res.payload, 'success');
    });
  });

});


describe('req.setCookie()', () => {

  it('should set a cookie to send to the client', () => {
    const app = medley();

    app.registerPlugin(cookie);

    app.get('/', (req, res) => {
      res.setCookie('foo', 'bar');
      res.send();
    });

    return app.inject('/').then((res) => {
      assert.strictEqual(res.headers['set-cookie'], 'foo=bar; Path=/');
    });
  });

  it('should set multiple cookies to send to the client', () => {
    const app = medley();

    app.registerPlugin(cookie);

    app.get('/', (req, res) => {
      res
        .setCookie('a', '1')
        .setCookie('b', '2', {maxAge: 3600, httpOnly: true, secure: true})
        .send();
    });

    return app.inject('/').then((res) => {
      assert.deepStrictEqual(res.headers['set-cookie'], [
        'a=1; Path=/',
        'b=2; Max-Age=3600; Path=/; HttpOnly; Secure',
      ]);
    });
  });

});


describe('req.clearCookie()', () => {

  it('should clear a cookie', () => {
    const app = medley();

    app.registerPlugin(cookie);

    app.get('/', (req, res) => {
      res.clearCookie('foo', 'bar');
      res.send();
    });

    return app.inject('/').then((res) => {
      assert.strictEqual(
        res.headers['set-cookie'],
        'foo=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT'
      );
    });
  });

  it('should clear multiple cookies', () => {
    const app = medley();

    app.registerPlugin(cookie);

    app.get('/', (req, res) => {
      res
        .clearCookie('a', {expires: new Date()})
        .clearCookie('b', {maxAge: 3600, httpOnly: true, secure: true})
        .send();
    });

    return app.inject('/').then((res) => {
      assert.deepStrictEqual(res.headers['set-cookie'], [
        'a=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
        'b=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure',
      ]);
    });
  });

});


describe('res.sign() and req.unsign()', () => {

  it('should sign and unsign cookies', () => {
    const app = medley();

    app.registerPlugin(cookie, {secret: 'tobiiscool'});

    app.get('/', (req, res) => {
      const signed = res.signCookie('hello');
      assert.strictEqual(signed, 'hello.DGDUkGlIkCzPz+C0B064FNgHdEjox7ch8tOBGslZ5QI');

      const unsigned = req.unsignCookie(signed);
      assert.strictEqual(unsigned, 'hello');

      res.send('success');
    });

    return app.inject('/').then((res) => {
      assert.strictEqual(res.payload, 'success');
    });
  });

});
