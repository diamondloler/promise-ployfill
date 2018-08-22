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

    // 延迟对象
    var deferreds = []

    // 可延展性
    var isThenAble = false

    var staticMode = false

    var count = 0

    var Promises = function (callback) {

        var fulfilled = false
        var rejected = false

        this.id = count++

            // onfulfilled or onrejected callback push deferreds stack
            this.then = function (onResolve, onReject) {
                if (isFunction(onResolve) || isFunction(onReject)) {
                    deferreds.push({
                        onResolve: onResolve || null,
                        onReject: onReject || null,
                        id: this.id
                    })
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
                    // console.log(staticMode, '是否可扩展');
                    (staticMode || isThenAble) && isFunction(cb) && cb.call(null, value)
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
        var len = queue.length
        var consume = len
        var done = false
        var item,
            _resolve

        staticMode = true

        var onResovle = function (res) {
            mutationProxy(res, this)
        }

        var onReject = function (err) {
            mutationProxy(err, this, true)
        }

        var mutationProxy = function (v, ins, isReject) {
            if (done) return

            var index = findIndex(queue, ins)

            // console.log(ins, index, queue, v)

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
                staticMode = false
            }
        }

        asyncTask(function () {
            _resolve = (deferreds.shift()).onResolve
            for (var i = 0; i < len; i++) {
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
                }
            }

        })

        return new Promises()
    }


    return Promises
})

var p1 = new Promises((resovle, reject) => {
    setTimeout(() => {
        resovle('加速度')
    }, 500)
})

var p2 = new Promises((resovle) => {
    setTimeout(() => {
        resovle(800)
    }, 1000)
})

Promises.all([p1, 1, 5, 5, p2, {
    a: 666
}]).then((result) => {
    console.log(result)
})





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
    })