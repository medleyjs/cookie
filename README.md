# @medley/cookie

[![npm Version](https://img.shields.io/npm/v/@medley/cookie.svg)](https://www.npmjs.com/package/@medley/cookie)
[![Build Status](https://travis-ci.org/medleyjs/cookie.svg?branch=master)](https://travis-ci.org/medleyjs/cookie)
[![Coverage Status](https://coveralls.io/repos/github/medleyjs/cookie/badge.svg?branch=master)](https://coveralls.io/github/medleyjs/cookie?branch=master)
[![dependencies Status](https://img.shields.io/david/medleyjs/cookie.svg)](https://david-dm.org/medleyjs/cookie)

[Medley](https://www.npmjs.com/package/@medley/medley) plugin for parsing and setting cookies.


## Installation

```sh
# npm
npm install @medley/cookie --save

# yarn
yarn add @medley/cookie
```


## Usage

```js
const medley = require('@medley/medley');
const app = medley();

app.register(require('@medley/cookie'), {
  secret: 'to everybody', // `secret` should be a long, random string
});

app.get('/', (req, res) => {
  if (req.cookies.foo === undefined) {
    res.setCookie('foo', 'bar');
    res.send('cookie set');
  } else {
    res.send('foo = ' + req.cookies.foo);
    // Sends: 'foo = bar'
  }
});
```

The cookie plugin takes one option called `secret` which is used for signing/unsigning cookies.


## API

+ [`req.cookies`](#reqcookies)
+ [`req.unsignCookie(value)`](#requnsigncookievalue)
+ [`res.signCookie(value)`](#ressigncookievalue)
+ [`res.setCookie(name, value[, options])`](#ressetcookiename-value-options)
  + [Options](#options)
+ [`res.clearCookie(name[, options])`](#resclearcookiename-options)

### `req.cookies`

An object of parsed cookies.

```js
req.cookies // { cookieName: 'cookieValue', foo: 'bar' }
```

Note that cookies are parsed in an `onRequest` hook, so `req.cookies` will not
be available in any `onRequest` hooks added before registering this plugin.

### `req.unsignCookie(value)`

+ `value` *(string)* - A cookie value.
+ Returns *(string | false)* - The original cookie value (before signing) or `false` if the cookie was tampered with.

Unsigns a cookie value.

```js
const fooCookie = req.unsignCookie(req.cookies.foo);
console.log(fooCookie); // 'bar'

const tamperedFooCookie = req.unsignCookie(req.cookies.foo + 'str');
console.log(tamperedFooCookie); // false
```

### `res.signCookie(value)`

+ `value` *(string)* - A cookie value.
+ Returns *(string)* - The signed cookie value.

Signs a cookie value.

```js
const signedValue = res.signCookie('hello');
console.log(signedValue); // 'hello.DGDUkGlIkCzPz+C0B064FNgHdEjox7ch8tOBGslZ5QI'
res.setCookie('greeting', signedValue);
```

The signed value will be different depending on the `secret` option used when
registering the plugin.

### `res.setCookie(name, value[, options])`

+ `name` *(string)* - The name of the cookie.
+ `value` *(string)* - A cookie value.
+ `options` *(object)* - See the [options](#options) below.
+ chainable

Sets a cookie with `name` to `value`.

```js
res.setCookie('foo', 'bar');

// Sets a cookie that expires in 1 hour
res.setCookie('rememberme', 'true', { maxAge: 3600, httpOnly: true, secure: true });

// Default encode option
res.setCookie('cross_domain_cookie', 'value!', {
  domain: 'example.com'
});
// Result: 'cross_domain_cookie=value!; Domain=example.com; Path=/'

// Custom encode option
res.setCookie('cross_domain_cookie', 'value!', {
  domain: 'example.com',
  encode: require('strict-uri-encode') // https://www.npmjs.com/package/strict-uri-encode
});
// Result: 'cross_domain_cookie=value%21; Domain=example.com; Path=/;'
```

#### Options

| Property | Type | Description |
|----------|------|-------------|
| `domain` | *string* | Domain name for the cookie.
| `encode` | *function* | A synchronous function used for encoding the cookie value. Default: [`encodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent).
| `expires` | *Date* | Expiry date of the cookie in GMT. If not specified (and `maxAge` is not specified), a session cookie is created.
| `httpOnly` | *boolean* | Flags the cookie to be accessible only by the web server (and not by JavaScript in the browser). Default: `false`.
| `maxAge` | *number* | Convenient option for setting the expiry time relative to the current time in **seconds**. If not specified (and `expires` is not specified), a session cookie is created.
| `path` | *string* | URL path prefix at which the cookie will be available. Default: `'/'`.
| `sameSite` | *string* | Value of the [*SameSite*](https://tools.ietf.org/html/draft-ietf-httpbis-cookie-same-site-00#section-4.1.1) `Set-Cookie` attribute (either `'strict'` or `'lax'`).
| `secure` | *boolean* | Flags the cookie to be used with HTTPS only. Default: `false`.

### `res.clearCookie(name[, options])`

+ `name` *(string)* - The name of a cookie.
+ `options` *(object)* - See the [options](#options) above.
+ chainable

Clears a previously set cookie with `name`.

Note that for the cookie to be cleared, the `domain`, `httpOnly`, `path`, `sameSite`,
and `secure` options must be the same as when the cookie was originally set.

```js
res.clearCookie('foo');
res.clearCookie('rememberme', { httpOnly: true, secure: true });
```
