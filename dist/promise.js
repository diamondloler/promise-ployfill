(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return factory(root);
        });
    } else if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(root);
    } else {
        factory(root)
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
        return obj && obj instanceof PromisePolyfill
    }


    var PromisePolyfill = function (resolver) {

        var fulfilled = false
        var rejected = false

        // when resolver trigger reject , isThenAble is false, stop chain calls
        var isThenAble = false

        // 延迟队列
        var deferreds = []

        // onfulfilled or onrejected callback push deferreds stack
        this.then = function (onResolve, onReject) {
            if (isFunction(onResolve) || isFunction(onReject)) {
                deferreds.push({
                    onResolve: onResolve || null,
                    onReject: onReject || null
                })
                isThenAble = true
            } else {
                throw new Error('the arguments of \"promise.then\" can\'t be empty');
            }

            // async/await compatibility
            resolver && resolver.call(null, resolve, reject)

            return this
        }


        //create async mutation handler
        var createMutationHandler = function (type, cb) {
            return function (value) {
                if (value instanceof PromisePolyfill) {
                    throw new Error('the value of ' + type + ' should not construtor itself')
                }
                if (!value) return
                asyncTask(function () {
                    isThenAble && isFunction(cb) && cb.call(null, value)
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

        //通过内部promise实例resolve的数据，消费当前实例内部的延时队列
        var onInnerPromiseFulfilled = function (res) {
            resolve(res)
        }

        var onInnerPromiseRejected = function (err) {
            reject(err)
        }

        var resolve = createMutationHandler('resolve', function (value) {
            if (rejected) throw Error('can\'t not call resolve, promise is already rejected')

            if (!deferreds.length) return

            deferred = popDeferredsStack(deferreds)

            result = deferred.onResolve && deferred.onResolve(value)

            fulfilled = true

            if (isInstance(result)) {
                isThenAble = true
                result.then(onInnerPromiseFulfilled, onInnerPromiseRejected)
            }

        })

        var reject = createMutationHandler('reject', function (value) {
            if (fulfilled) throw Error('can\'t not call reject, promise is already fulfilled')

            deferred = popDeferredsStack(deferreds)

            deferred.onReject && deferred.onReject(value)

            rejected = true
            isThenAble = false
        })
    }


    PromisePolyfill.all = function (queue) {
        if (!Array.isArray(queue)) return;

        var results = []
        var i = queue.length
        var consume = i
        var done = false
        var item, _resolve

        var onResolved = function (res) {
            mutationProxy(res, this)
        }

        var onRejected = function (err) {
            mutationProxy(err, this, true)
        }

        var mutationProxy = function (v, ins, isReject) {
            if (done) return

            var index = findIndex(queue, ins)
            if (index === false) return
            results[index] = v

            var args = isReject ? [results, true] : [results]

            untilDone.apply(null, args)
        }


        function untilDone(result, ocurrError) {
            consume--

            if (ocurrError || !consume) {
                _resolve(result)
                done = true
            }
        }


        while (i--) {
            item = queue[i]
            if (isInstance(item)) {
                item.then(onResolved.bind(item), onRejected.bind(item))
            } else if (isFunction(item)) {
                //       
                continue;
            } else {
                // ordinary value    
                results[i] = item
                untilDone(results)
            };
        }


        return new PromisePolyfill(function (resolve) {
            _resolve = resolve
        })
    }


    PromisePolyfill.resolve = function (v) {
        return isInstance(v) ?
            v :
            new PromisePolyfill(function (resovle) {
                resovle(v || 'fulfilled')
            })
    }

    PromisePolyfill.reject = function (v) {
        return new PromisePolyfill(function (resovle, reject) {
            reject(v || 'rejected')
        })
    }


    PromisePolyfill.next = function () {
        var queue = [].slice.call(arguments)

        function next(res, err) {
            if (err) {
                //console the error from previous loop include (async, sync)
                return console.warn(err)
            }

            if (!queue.length) {
                //execluted all of queue 
                return;
            }

            var fn = queue.shift()

            if (isFunction(fn)) {
                try {
                    res !== void 0 ? fn.call(null, next, res) : fn.call(null, next)
                } catch (error) {
                    //catch sync error
                    next(null, error)
                }
            }
        }

        next()
    }


    PromisePolyfill.race = function (queue) {
        if (!Array.isArray(queue)) return;
        var _resolve
        var i = queue.length
        var item

        var onMutated = function (data) {
            _resolve(data)
        }

        while (i--) {
            item = queue[i]
            if (isInstance(item)) {
                item.then(onMutated, onMutated)
            }
        }

        return new PromisePolyfill(function (resovle) {
            _resolve = resovle
        })
    }

    return window.Promise || (window.Promise = PromisePolyfill)
})
