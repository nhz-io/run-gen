/* eslint-disable require-yield, no-constant-condition */

'use strict'

const INIT = Symbol.for('INIT')

class RunGen {
    constructor() {
        this.run = this.run.bind(this)
    }

    * wrap(value) {
        return value
    }

    * resolve(result, iterator) {
        if (result.done) {
            return result.value.then(res => this.run(this.wrap(res)))
        }

        return result.value.then(res => this.run(iterator, res))
    }

    * init(iterator) {
        iterator[INIT] = true

        return iterator.next()
    }

    * runner(iterator, result, args) {
        if (result.value && typeof result.value.then === 'function') {
            return yield* this.resolve(result, iterator)
        }

        if (result.done) {
            return result.value
        }

        yield result.value

        return yield* this.runner(iterator, iterator.next(args || result.value))
    }

    * start(iterator, ...args) {
        if (typeof iterator === 'function') {
            iterator = iterator(...args)
            args = []
        }

        if (args.length < 2) {
            args = args[0]
        }

        if (iterator[INIT]) {
            return yield* this.runner(iterator, iterator.next(args))
        }

        return yield* this.runner(iterator, yield* this.init(iterator), args)
    }

    _run(...args) {
        const iterator = this.start(...args)

        while (true) {
            const result = iterator.next()

            if (result.done) {
                return result.value
            }
        }
    }

    run(...args) {
        return Promise.resolve().then(() => this._run(...args))
    }
}

const runGen = new RunGen()
runGen.run.RunGen = RunGen
runGen.run.INIT = INIT

module.exports = runGen.run
