(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return factory(root);
        });
    } else if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(root);
    } else {
        // !root.Promise && (root.Promise = factory(root));
        root.Promises = factory(root)
    }
})(typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this, function (window) {

    var isFunction = function (v) {
        return typeof v === 'function'
    }

    var asyncTask = (function () {
        return typeof process === 'object' &&
            process !== null &&
            typeof process.nextTick === 'function' &&
            process.nextTick ||
            typeof setImmediate === 'function' &&
            setImmediate ||
            setTimeout;
    })()

    var findIndex = function (arr, key) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == key) return i
        }
        return false
    }


    var isInstance = function (obj) {
        return obj && obj instanceof Promises
    }

    var count = 0


    var Promises = function (callback) {
      
        var fulfilled = false
        var rejected = false

        // 可延展性
        var isThenAble = false

        // 延迟对象
        var deferreds = []

        // onfulfilled or onrejected callback push deferreds stack
        this.then = function (onResolve, onReject) {
            if (isFunction(onResolve) || isFunction(onReject)) {
                deferreds.push({
                    onResolve: onResolve || null,
                    onReject: onReject || null
                })
                console.log(deferreds, count, '实例')
                isThenAble = true
            } else {
                throw new Error('the arguments of \"promise.then\" can\'t be empty');
            }
            return new Promises()
        }


        //create async mutation handler
        var createMutationHandler = function (type, cb) {
            return function (value) {
                if (value instanceof Promises) {
                    throw new Error('the value of ' + type + ' should not construtor itself')
                }
                if (!value) return
                asyncTask(function () {
                    // console.log(isThenAble)
                    isThenAble && isFunction(cb) && cb.call(null, value)
                    // console.log(isThenAble, 'asyncTask')
                })
            }
        }

        var popDeferredsStack = function (arr) {
            return arr.length == 0 ? {} : arr.shift()
        }

        // mark the result of onResolve 
        var result
        // deferred object
        var deferred

        var resolve = createMutationHandler('resolve', function (value) {
            if (rejected) throw Error('can\'t not call resolve, promise is already rejected')
            deferred = popDeferredsStack(deferreds)
            result = deferred.onResolve && deferred.onResolve(value)
            fulfilled = true
            isThenAble = isInstance(result)
        })

        var reject = createMutationHandler('reject', function (value) {
            if (fulfilled) throw Error('can\'t not call reject, promise is already fulfilled')
            deferred = popDeferredsStack(deferreds)
            deferred.onReject && deferred.onReject(value)
            rejected = true
            isThenAble = false
        })

        callback && callback.call(null, resolve, reject)
    }


    Promises.all = function (queue) {
        if (!Array.isArray(queue)) return;

        var results = []
        var i = queue.length
        var consume = i
        var done = false
        var item,
            _resolve

        var onResovle = function (res) {
            mutationProxy(res, this)
        }

        var onReject = function (err) {
            mutationProxy(err, this, true)
        }

        var mutationProxy = function (v, ins, isReject) {
            if (done) return

            var index = findIndex(queue, ins)
            if (index === false) return
            results[index] = v

            var args = isReject ? [_resolve, results, true] : [_resolve, results]

            untilDone.apply(null, args)
        }


        function untilDone(cb, result, ocurrError) {
            consume--

            if (ocurrError || !consume) {
                cb(result)
                done = true
            }
        }

        asyncTask(function () {
            while (i--) {
                item = queue[i]
                if (isInstance(item)) {
                    item.then(onResovle.bind(item), onReject.bind(item))
                } else if (isFunction(item)) {
                    //       
                    continue;
                } else {
                    // ordinary value    
                    results[i] = item
                    untilDone(_resolve, results)
                };
            }
        })

        return new Promises((resolve) => {
            _resolve = resolve
        })
    }


    return Promises
})

// var p1 = new Promises((resovle, reject) => {
//     setTimeout(() => {
//         resovle('加速度')
//     }, 500)
// })

// var p2 = new Promises((resovle) => {
//     setTimeout(() => {
//         resovle(800)
//     }, 1000)
// })

// Promises.all([p1, 1, 5, {
//     a: 666
// }, p2]).then((result) => {
//     console.log(result)
// })





var xixi = new Promises((resovle, reject) => {
    setTimeout(() => {
        resovle(1)
        // reject(66)
    }, 1000)
})

xixi.then((res) => {
        console.log(res)
        return new Promises(resovle => {
            resovle(666666)
        })
    }, (err) => {
        console.log(err)
    })
    .then((res) => {
        console.log(res)
        return new Promises(resovle => {
            setTimeout(() => {
                resovle(777777777)
            }, 1000)
        })
    })
    .then((res) => {
        console.log(res)
        return new Promises(resovle => {
            resovle(8888888)
        })
    })
    .then((res) => {
        console.log(res)
        return new Promises(resovle => {
            resovle(99999999)
        })
    })