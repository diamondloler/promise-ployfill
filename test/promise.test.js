const PromisePolyfill = require('../src/promise')
const sinon = require('sinon')

describe('This is a testing for Instance of PromisePolyfill', () => {
    var promise = null

    it('It should be a constructor', () => {
        expect(PromisePolyfill instanceof Function).toBeTruthy()
    })

    beforeEach(() => {
        promise = new PromisePolyfill((resolve, reject) => {
            resolve(1)
        })
    })

    it('it will asyncly get value of resolved ', () => {
        return expect(promise).resolves.toBe(1)
    })


    it('when then callback return a promise instance, it can chainly call the then function from current instance', () => {
        var results = []
        return promise.then((res) => {
            results.push(res)
            return new PromisePolyfill((resolve) => {
                setTimeout(() => {
                    resolve(2)
                }, 500)
            })
        }).then((res) => {
            results.push(res)
            return new PromisePolyfill((resolve) => {
                setTimeout(() => {
                    resolve(3)
                }, 200)
            })
        }).then((res) => {
            results.push(res)
            expect(results).toEqual([1, 2, 3])
        })
    })

    it('It can chainly call by fn of then without any return values', () => {
        var log = sinon.spy(console.log)
        return promise.then(() => {
            log('1')
        }).then(() => {
            log('2')
        }).then(() => {
            log('3')
            expect(log.callCount).toBe(3)
        })
    })


    it('it will asyncly get value of rejected', () => {
        var temp = new PromisePolyfill((resolve, reject) => {
            reject('error')
        })

        return temp.catch((err) => {
            expect(err).toBe('error')
        })
    })

    it('It should cooperate with async/await', async () => {
        var res = await promise
        expect(res).toBe(1)
    })
})



describe('This is a testing for static methods for PromisePolyfill', () => {
    var p1, p2, p3;

    beforeEach(() => {
        p1 = new PromisePolyfill((resovle) => {
            setTimeout(() => {
                resovle(1)
            }, 300)
        })

        p2 = new PromisePolyfill((resovle) => {
            setTimeout(() => {
                resovle(2)
            }, 200)
        })

        p3 = new PromisePolyfill((resovle) => {
            setTimeout(() => {
                resovle(3)
            }, 100)
        })
    })

    it('PromisePolyfill.all', () => {
        return PromisePolyfill.all([p1, p2, p3]).then((results) => {
            expect(results).toEqual([1, 2, 3])
        })
    })

    it('PromisePolyfill.race', () => {
        return PromisePolyfill.race([p1, p2, p3]).then((res) => {
            expect(res).toBe(3)
        })
    })

    it('PromisePolyfill.resolve', async () => {
        var plianValue = await PromisePolyfill.resolve(1)
        var plianValue2 = await PromisePolyfill.resolve(p3)
        var thenable = {
            then: function resolver(resolve, reject) {
                resolve(9527)
            }
        }
        var plianValue3 = await PromisePolyfill.resolve(thenable)

        expect(plianValue).toBe(1)
        expect(plianValue2).toBe(3)
        expect(plianValue3).toBe(9527)
    })

    it('PromisePolyfill.reject', async () => {
        var willCatch = PromisePolyfill.reject('error')
        return willCatch.catch((err) => {
            expect(err).toBe('error')
        })
    })
})