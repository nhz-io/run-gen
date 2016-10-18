<h1 align="center">run-gen</h1>

<p align="center">
  <a href="https://npmjs.org/package/run-gen">
    <img src="https://img.shields.io/npm/v/run-gen.svg?style=flat"
         alt="NPM Version">
  </a>

  <a href="https://www.bithound.io/github/nhz-io/run-gen">
    <img src="https://www.bithound.io/github/nhz-io/run-gen/badges/score.svg"
         alt="Bithound Status">
  </a>

  <a href="https://github.com/nhz-io/run-gen/blob/master/LICENSE">
    <img src="https://img.shields.io/github/license/nhz-io/run-gen.svg?style=flat"
         alt="License">
  </a>
</p>

<h3 align="center">Run generators to completion</h3>

* Use generators (almost) as you would normally use functions.
* use `result = yield Promise.resolve('result')` to abstract the async
* `return` result from generator as completion value

## Install
```bash
npm i -S run-gen
```

## Dev

```bash
git clone https://github.com/nhz-io/run-gen
cd run-gen
npm i
npm start
```

### Coverage
```bash
npm run coverage
```

## Example usage (NPM Downloads stats)
```js
const fetch = require('node-fetch')
const run = require('run-gen')

const downloadsUrl = `https://api.npmjs.org/downloads/point`
const registryUrl = `https://registry.npmjs.org`

function* downloads(pkg, period) {
    const res = yield fetch(`${downloadsUrl}/${period}/${pkg}`)
    const stats = JSON.parse(yield res.text())
    return (stats && stats.downloads) || 'unknown'
}

function* info(pkg) {
    const res = yield fetch(`${registryUrl}/${pkg}`)
    const info = JSON.parse(yield res.text())
    return {
        name: info.name,
        descriptions: info.description,
    }
}

function* stats(pkg, period = 'last-month') {
    return Object.assign(
        {},
        yield* info(pkg),
        {downloads: yield* downloads(pkg, period)}
    )
}

run(stats('npm')).then(r => console.log(r), e => console.log(e))
```

## License

### [MIT](LICENSE)
