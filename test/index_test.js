
/**
 * Module dependencies.
 */

import koa from 'koa';
import paginate from '../src';
import request from './request';

/**
 * Test `paginate`.
 */

describe('paginate', () => {
  it('should return 200 if no `Range` header is provided', function *() {
    const app = koa();

    app.use(paginate());

    app.use(function *() {
      this.body = '';
    });

    yield request(app.listen())
      .get('/')
      .expect(200)
      .end();
  });

  it('should return 206 if a valid `Range` header is provided', function *() {
    const app = koa();

    app.use(paginate());

    yield request(app.listen())
      .get('/')
      .set('Range', 'items=0-5')
      .expect(206)
      .end();
  });

  it('should use the default values', function *() {
    const app = koa();

    app.use(paginate());

    yield request(app.listen())
      .get('/')
      .expect('Content-Range', 'items 0-49/*')
      .end();
  });

  it('should accept a `maximum` option', function *() {
    const app = koa();

    app.use(paginate({ maximum: 3 }));

    yield request(app.listen())
      .get('/')
      .expect('Content-Range', 'items 0-2/*')
      .end();
  });

  it('should return 500 if `maximum` is not a number', function *() {
    const app = koa();

    app.use(paginate({ maximum: 'invalid' }));

    yield request(app.listen())
      .get('/')
      .expect(500)
      .end();
  });

  it('should return 500 if `maximum` is 0', function *() {
    const app = koa();

    app.use(paginate({ maximum: 0 }));

    yield request(app.listen())
      .get('/')
      .expect(500)
      .end();
  });

  it('should return 500 if `maximum` is lower than 0', function *() {
    const app = koa();

    app.use(paginate({ maximum: -1 }));

    yield request(app.listen())
      .get('/')
      .expect(500)
      .end();
  });

  it('should return 500 if `maximum` is not a safe integer', function *() {
    const app = koa();

    app.use(paginate({ maximum: 9007199254740993 }));

    yield request(app.listen())
      .get('/')
      .expect(500)
      .end();
  });

  it('should accept a `Range` header', function *() {
    const app = koa();

    app.use(paginate());

    yield request(app.listen())
      .get('/')
      .set('Range', 'items=0-5')
      .expect('Content-Range', 'items 0-5/*')
      .end();
  });

  it('should return 412 if the `Range` is malformed', function *() {
    const app = koa();

    app.use(paginate());

    yield request(app.listen())
      .get('/')
      .set('Range', 'invalid')
      .expect(412, 'Precondition Failed')
      .end();
  });

  it('should return 416 if the `Range` is invalid', function *() {
    const app = koa();

    app.use(paginate());

    yield request(app.listen())
      .get('/')
      .set('Range', 'items=5-1')
      .expect(416, 'Range Not Satisfiable')
      .end();
  });

  it('should return 416 if `first position` value is higher than `length`', function *() {
    const app = koa();

    app.use(paginate());

    app.use(function *() {
      this.pagination.length = 10;
    });

    yield request(app.listen())
      .get('/')
      .set('Range', 'items=10-12')
      .expect(416)
      .end();
  });

  it('should return 416 if `first position` and `last position` have equal values and are equal to `length`', function *() {
    const app = koa();

    app.use(paginate());

    app.use(function *() {
      this.pagination.length = 10;
    });

    yield request(app.listen())
      .get('/')
      .set('Range', 'items=10-10')
      .expect(416)
      .end();
  });

  it('should return 416 if `first position` and `last position` have equal values and are higher than `length`', function *() {
    const app = koa();

    app.use(paginate());

    app.use(function *() {
      this.pagination.length = 10;
    });

    yield request(app.listen())
      .get('/')
      .set('Range', 'items=11-11')
      .expect(416)
      .end();
  });

  it('should return 416 if `first position` is not a safe integer', function *() {
    const app = koa();

    app.use(paginate());

    yield request(app.listen())
      .get('/')
      .set('Range', 'items=9007199254740992-9007199254740993')
      .expect(416)
      .end();
  });

  it('should return 416 if `last position` is not a safe integer', function *() {
    const app = koa();

    app.use(paginate());

    yield request(app.listen())
      .get('/')
      .set('Range', 'items=1-9007199254740992')
      .expect(416)
      .end();
  });

  it('should return 416 if `allowAll` is false and `last position` is `*`', function *() {
    const app = koa();

    app.use(paginate({ allowAll: false }));

    yield request(app.listen())
      .get('/')
      .set('Range', 'items=0-*')
      .expect(416)
      .end();
  });

  it('should return 206 if `last position` is `*`', function *() {
    const app = koa();

    app.use(paginate());

    yield request(app.listen())
      .get('/')
      .set('Range', 'items=0-*')
      .expect(206)
      .end();
  });

  it('should return the `length` if `last position` is `*`', function *() {
    const app = koa();

    app.use(paginate());

    app.use(function *() {
      this.pagination.length = 20;
    });

    yield request(app.listen())
      .get('/')
      .set('Range', 'items=0-*')
      .expect('Content-Range', 'items 0-19/20')
      .end();
  });

  it('should not allow `last position` value to be higher than `length`', function *() {
    const app = koa();

    app.use(paginate());

    app.use(function *() {
      this.pagination.length = 3;
    });

    yield request(app.listen())
      .get('/')
      .set('Range', 'items=0-5')
      .expect('Content-Range', 'items 0-2/3')
      .end();
  });

  it('should not allow `last position` to be equal to `length`', function *() {
    const app = koa();

    app.use(paginate());

    app.use(function *() {
      this.pagination.length = 20;
    });

    yield request(app.listen())
      .get('/')
      .set('Range', 'items=0-20')
      .expect('Content-Range', 'items 0-19/20')
      .end();
  });

  it('should not allow `last position` value to be higher than `maximum`', function *() {
    const app = koa();

    app.use(paginate({ maximum: 3 }));

    yield request(app.listen())
      .get('/')
      .set('Range', 'items=0-5')
      .expect('Content-Range', 'items 0-2/*')
      .end();
  });

  it('should use the diference between `last position` and `first position`, plus one, as `limit`', function *() {
    const app = koa();

    const lastPosition = 6;
    const firstPosition = 2;

    app.use(paginate());

    app.use(function *() {
      this.pagination.limit.should.equal(lastPosition - firstPosition + 1);
    });

    yield request(app.listen())
      .get('/')
      .set('Range', `items=${firstPosition}-${lastPosition}`)
      .end();
  });

  it('should use the `first position` as `offset`', function *() {
    const app = koa();
    const firstPosition = 2;

    app.use(paginate());

    app.use(function *() {
      this.pagination.offset.should.equal(firstPosition);
    });

    yield request(app.listen())
      .get('/')
      .set('Range', `items=${firstPosition}-5`)
      .end();
  });

  it('should expose the given `range-unit`', function *() {
    const app = koa();

    app.use(paginate({ unit: 'bytes' }));

    app.use(function *() {
      this.pagination.unit.should.equal('foobar');
    });

    yield request(app.listen())
      .get('/')
      .set('Range', 'foobar=0-5')
      .expect('Content-Range', 'foobar 0-5/*')
      .end();
  });

  it('should set the `byte-range-spec` to `*` if length is 0', function *() {
    const app = koa();

    app.use(paginate({ unit: 'bytes' }));

    app.use(function *() {
      this.pagination.length = 0;
    });

    yield request(app.listen())
      .get('/')
      .expect('Content-Range', 'bytes */0')
      .end();
  });
});
