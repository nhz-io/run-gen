'use strict'

const INIT = Symbol.for('INIT')

function isFn(test) {
    return typeof test === 'function'
}

function* init(task) { // eslint-disable-line require-yield
    task[INIT] = true

    return task.next()
}

function* promisedDone(promise) { // eslint-disable-line require-yield
    return promise.then(res => run([res][Symbol.iterator]()))
}

// eslint-disable-next-line require-yield
function* promisedNext(promise, task, ...args) {
    return promise.then(arg => run(task, arg, ...args))
}

function* stepper(task, ...args) {
    if (!task[INIT]) {
        const result = yield* init(task)

        if (result.value && isFn(result.value.then)) {
            if (result.done) {
                return yield* promisedDone(result.value)
            }

            return yield* promisedNext(result.value, task)
        }

        if (result.done) {
            return result.value
        }

        if (args.length < 1) {
            args = [result.value]
        }
    }

    while (true) { // eslint-disable-line no-constant-condition
        const result = task.next(args.length < 2 ? args[0] : args)

        if (result.value && isFn(result.value.then)) {
            if (result.done) {
                return yield* promisedDone(result.value)
            }

            return yield* promisedNext(result.value, task)
        }

        if (result.done) {
            return result.value
        }

        args = [result.value]
        yield result.value
    }
}

function* runner(task, ...args) {
    return yield* stepper(task, ...args)
}

function run(task, ...args) {
    return Promise.resolve().then(() => {
        const iterator = runner(task, ...args)

        while (true) { // eslint-disable-line no-constant-condition
            const result = iterator.next()

            if (result.done) {
                return result.value
            }
        }
    })
}

module.exports = run
