(function (root, factory) {
    if (typeof module === "object" && module.exports) {
        // like commonjs
        module.exports = factory(root);
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(function () {
            return factory(root);
        });
    } else {
        // Global
        factory(root)
    }
})(typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this, function (window) {

    var isFunction = function (v) {
        return typeof v === 'function'
    }


    var asyncTask = (function () {
        return typeof process === 'object' &&
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


    var _toString = Object.prototype.toString

    var isPlainObject = function (obj) {
        return _toString.call(obj) === '[object Object]'
    }

    var isNativeFn = function (fn) {
        if (!isFunction(fn)) return false;
        var fnStr = fn.toString()
        var flag = fnStr.slice(fnStr.indexOf('[') + 1, fnStr.lastIndexOf(']'))
        return flag === 'native code';
    }


    //create a async mutation func
    var createAsyncMutation = function (type, cb) {
        return function (value) {
            if (isInstance(value)) {
                throw new TypeError('the value of ' + type + ' should not the promise itself')
            }

            var ins = this
            asyncTask(function () {
                ins.isThenable && cb.call(ins, value)
            })
        }
    }

    var consumeDeferredQueue = function (arr) {
        return arr.length == 0 ? {} : arr.shift()
    }

    // Function.prototype.bind polyfill
    var bind = function (fn, context) {
        return function () {
            fn.apply(context, arguments)
        }
    }

    var promiseId = 0

    var PromisePolyfill = function (resolver) {
        if (!isFunction(resolver)) {
            throw new Error('The resolver must be a function');
        }
        this.promiseId = promiseId++
        this.resolver = resolver
        this.fulfilled = false
        this.rejected = false
        this.isThenable = false //赋予能力可以使 promise 从 pending 状态 突变到 fulfilled or rejected
        this.deferreds = []
    }

    PromisePolyfill.prototype.reject = createAsyncMutation('reject', function (value) {
        if (this.fulfilled) throw Error('can\'t not call reject, promise is already fulfilled')

        this.rejected = true
        this.isThenable = false

        var deferred = consumeDeferredQueue(this.deferreds)
        if (!deferred.onReject) {
            throw new Error('Uncaught (in promise)' + ' ' + value)
        }
        deferred.onReject(value)
    })


    PromisePolyfill.prototype.resolve = createAsyncMutation('resolve', function (value) {
        if (!this.deferreds.length) return

        if (this.rejected) throw Error('can\'t not call resolve, promise is already rejected')

        this.fulfilled = true
        this.isThenable = true

        var deferred = consumeDeferredQueue(this.deferreds)
        var result = deferred.onResolve && deferred.onResolve(value)

        if (isInstance(result)) {
            //构造魔法回调，利用内部的promise实例，消化本实例自身的延时队列，实现链式效果
            result.then(bind(this.runResolve, this), bind(this.runReject, this))
        } else {
            //回调的结果不是promise的实例，但延时队列又没消费完的时候，会继续递归地执行resolve进行消费
            this.resolve()
        }

    })

    PromisePolyfill.prototype.runResolve = function (res) {
        this.resolve(res)
    }

    PromisePolyfill.prototype.runReject = function (res) {
        this.reject(res)
    }


    PromisePolyfill.prototype.then = function (onResolve, onReject) {
        if (isFunction(onResolve) || isFunction(onReject)) {
            this.deferreds.push({
                onResolve: onResolve || null,
                onReject: onReject || null
            })
            this.isThenable = true
        } else {
            throw new Error('the arguments of \"promise.then\" can\'t be empty');
        }

        // async/await compatibility
        this.resolver && this.resolver(bind(this.resolve, this), bind(this.reject, this))
        this.resolver = null

        return this
    }


    //Under the IE9 Version, the 'catch' is the keyword to browser;
    PromisePolyfill.prototype['catch'] = function (rejected) {
        this.then(null, rejected);
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
                item.then(bind(onResolved, item), bind(onRejected, item))
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
        if (isPlainObject(v) && !isInstance(v) && typeof v.then === 'function') {
            return new PromisePolyfill(v.then)
        }

        if (isInstance(v)) {
            return v
        }

        return new PromisePolyfill(function (resovle) {
            resovle(v)
        })
    }


    PromisePolyfill.reject = function (v) {
        return new PromisePolyfill(function (resovle, reject) {
            reject(v)
        })
    }

    PromisePolyfill.race = function (queue) {
        if (!Array.isArray(queue)) return;
        var _resolve
        var onMutated = function (data) {
            _resolve(data)
        }

        var i = queue.length
        var item
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

    //return window.Promise = PromisePolyfill
    return isNativeFn(window.Promise) && window.Promise || (window.Promise = PromisePolyfill)
})