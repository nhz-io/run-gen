'use strict'

const INIT = Symbol.for('INIT')

function isFn(test) {
    return typeof test === 'function'
}

function* init(iterator) { // eslint-disable-line require-yield
    iterator[INIT] = true

    return iterator.next()
}

function* promisedDone(promise) { // eslint-disable-line require-yield
    return promise.then(res => run([res][Symbol.iterator]()))
}

// eslint-disable-next-line require-yield
function* promisedNext(promise, iterator) {
    return promise.then(arg => run(iterator, arg))
}

function* stepper(iterator, ...args) {
    if (!iterator[INIT]) {
        const result = yield* init(iterator)

        if (result.value && isFn(result.value.then)) {
            if (result.done) {
                return yield* promisedDone(result.value)
            }

            return yield* promisedNext(result.value, iterator)
        }

        if (result.done) {
            return result.value
        }

        if (args.length < 1) {
            args = [result.value]
        }
    }

    while (true) { // eslint-disable-line no-constant-condition
        const result = iterator.next(args.length < 2 ? args[0] : args)

        if (result.value && isFn(result.value.then)) {
            if (result.done) {
                return yield* promisedDone(result.value)
            }

            return yield* promisedNext(result.value, iterator)
        }

        if (result.done) {
            return result.value
        }

        args = [result.value]
        yield result.value
    }
}

function* runner(iterator, ...args) {
    return yield* stepper(iterator, ...args)
}

function run(iterator, ...args) {
    return Promise.resolve().then(() => {
        iterator = runner(iterator, ...args)

        while (true) { // eslint-disable-line no-constant-condition
            const result = iterator.next()

            if (result.done) {
                return result.value
            }
        }
    })
}

module.exports = run
