'use strict'

const INIT = Symbol.for('INIT')

function isFn(test) {
    return typeof test === 'function'
}

function* init(iterator) { // eslint-disable-line require-yield
    iterator[INIT] = true

    return iterator.next()
}

function use(runner) {
    function* promisedDone(promise) { // eslint-disable-line require-yield
        return promise.then(res => run.run([res][Symbol.iterator]()))
    }

    // eslint-disable-next-line require-yield
    function* promisedNext(promise, iterator) {
        return promise.then(arg => run.run(iterator, arg))
    }

    function* stepper(iterator, ...args) {
        if (!iterator[INIT]) {
            const result = yield* run.init(iterator)

            if (result.value && isFn(result.value.then)) {
                if (result.done) {
                    return yield* run.promisedDone(result.value)
                }

                return yield* run.promisedNext(result.value, iterator)
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
                    return yield* run.promisedDone(result.value)
                }

                return yield* run.promisedNext(result.value, iterator)
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

    run.init = init
    run.stepper = stepper
    run.runner = runner
    run.promisedDone = promisedDone
    run.promisedNext = promisedNext
    run.run = run
    run.use = use

    return run
}

function* runner(iterator, ...args) {
    if (isFn(iterator)) {
        iterator = iterator(...args)
        args = []
    }

    return yield* this.stepper(iterator, ...args)
}

module.exports = use(runner)
