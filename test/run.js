import test from 'ava'

import run from '..'

test('sync', t => {
    t.plan(1)

    function* g1() {
        return 'pass g1'
    }

    function* g2() {
        return 'pass g2'
    }

    function* g3() {
        return [
            yield* g1(),
            yield* g2(),
            'pass g3',
        ]
    }

    return run(g3()).then(r => t.deepEqual(r, ['pass g1', 'pass g2', 'pass g3']))
})

test('async', t => {
    t.plan(1)

    function* g1() {
        return (yield Promise.resolve('pass g1'))[0]
    }

    function* g2() {
        return Promise.resolve('pass g2')
    }

    function* g3() {
        return [
            yield* g1(),
            (yield yield* g2())[0],
            (yield Promise.resolve('pass g3'))[0],
        ]
    }

    return run(g3()).then(r => t.deepEqual(r, ['pass g1', 'pass g2', 'pass g3']))
})
