'use strict'

const INIT = Symbol.for('INIT')

function isFn(test) {
    return typeof test === 'function'
}

function* pass(value) { // eslint-disable-line require-yield
    return value
}

function* defaultInit(iterator) { // eslint-disable-line require-yield
    iterator[INIT] = true

    return iterator.next()
}

function* defaultRunner(iterator, ...args) {
    if (isFn(iterator)) {
        iterator = iterator(...args)
        args = []
    }

    return yield* this.stepper(iterator, ...args)
}

function use(runner = defaultRunner, init = defaultInit) {
    function* promisedDone(promise) { // eslint-disable-line require-yield
        return promise.then(res => this.run(pass(res)))
    }

    // eslint-disable-next-line require-yield
    function* promisedNext(promise, iterator) {
        return promise.then(arg => this.run(iterator, arg))
    }

    function* stepper(iterator, ...args) {
        if (!iterator[INIT]) {
            const result = yield* this.init(iterator)

            if (result.value && isFn(result.value.then)) {
                if (result.done) {
                    return yield* this.promisedDone(result.value)
                }

                return yield* this.promisedNext(result.value, iterator)
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
                    return yield* this.promisedDone(result.value)
                }

                return yield* this.promisedNext(result.value, iterator)
            }

            if (result.done) {
                return result.value
            }

            args = [result.value]
            yield result.value
        }
    }

    function run(iterator, ...args) {
        return Promise.resolve().then(() => {
            iterator = run.runner(iterator, ...args)

            while (true) { // eslint-disable-line no-constant-condition
                const result = iterator.next()

                if (result.done) {
                    return result.value
                }
            }
        })
    }

    return Object.assign(run, {
        pass, promisedDone, promisedNext,
        stepper, runner, init, run, use,
    })
}

module.exports = use(defaultRunner, defaultInit)
