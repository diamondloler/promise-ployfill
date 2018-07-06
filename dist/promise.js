(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return factory(root);
        });
    } else if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = factory(root);
    } else {
        !root.Promise && (root.Promise = factory(root));
    }
})(typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : this, function (window) {
    var isFunction = function (v) {
        return typeof v === 'function'
    }
    var getAsyncFunc = function () {
        return typeof process === 'object' &&
            process !== null &&
            typeof process.nextTick === 'function' &&
            process.nextTick ||
            typeof setImmediate === 'function' &&
            setImmediate ||
            setTimeout;
    }
    var asyncFn = getAsyncFunc()

    
    var _promise = function (callback) {
        //记录生成实例的数目
        this.speciality.modelCount++;

        //mark the result of onResolve or onReject
        var result

        this.then = function (onResolve, onReject) {
            if (isFunction(onResolve) || isFunction(onReject)) {
                var item = {
                    onResolve: onResolve || null,
                    onReject: onReject || null
                }
                this.deferreds.push(item)
                this.speciality.isThenAble = true
            }
            return new _promise()
        }


        //create async mutation function
        var createMutation = function (type, cb, vm) {
            return function (value) {
                if (value instanceof _promise) {
                    throw new Error('the value of ' + type + ' should not construtor itself')
                }
                if (!value) return
                asyncFn(function () {
                    if (vm.speciality.isThenAble) {
                        isFunction(cb) && cb.call(vm, value)
                    }
                })
            }
        }

        var getDeferred = function (arr) {
            return arr.length == 0 ? {} : arr.shift()
        }

        var isInstance = function (obj) {
            return obj && obj instanceof _promise || false
        }

        var resolve = createMutation('resolve', function (value) {
            //async run
            var deferred = getDeferred(this.deferreds)

            result = deferred.onResolve && deferred.onResolve(value)
            //决定下一个mutation执行             
            this.speciality.isThenAble = isInstance(result) || this.speciality.staticMode
        }, this)

        var reject = createMutation('reject', function (value) {
            //async run
            var deferred = getDeferred(this.deferreds)
            deferred.onReject && deferred.onReject(value)
            //终止后续promise执行   
            this.speciality.isThenAble = false
        }, this)

        callback && callback.call(null, resolve, reject)
    }

    //延迟对象
    _promise.prototype.deferreds = []

    //promise特性对象
    _promise.prototype.speciality = {
        isThenAble: false,
        modelCount: 0,
        results: [],
        staticMode: false
    }


    _promise.all = function (queues) {
        if (!queues || !Array.isArray(queues) || queues.length == 0) {
            throw new TypeError('The 1st arguments must be array that has more than one element')
        }

        var proto = this.prototype,
            deferreds = proto.deferreds,
            speciality = proto.speciality,
            results = speciality.results,
            done = null

        speciality.staticMode = true

        var pushResultsStack = function (v) {
            v && results.push(v)
        }

        return new _promise(function (resolve) {
            var distribute = function () {
                var value = queues.shift()
                if (value === void 0) {
                    if (done) {
                        deferreds.push(done)
                        resolve(results)
                    }
                    return
                }
                if (value instanceof _promise) {
                    value.then((res) => {
                        pushResultsStack(res)
                        distribute()
                    }, (err) => {
                        //假如发生错误，立即停止递归，记录错误并触发最外层的then回调
                        pushResultsStack(err)
                        proto.deferreds = [done]
                        done = null
                        resolve(results)
                        return
                    })
                } else if (typeof value !== 'function') {
                    pushResultsStack(value)
                    distribute()
                } else {
                    throw new TypeError('The array member should not a function')
                }
            }
            //确保promise.all.then最先执行
            asyncFn(() => {
                //mark the finally done Object
                //移出promise.all.then里的回调，记录在done中
                done = deferreds.shift()

                //递归执行distribute，不同的值，不同逻辑处理，直到延迟队列为空或rejected停止
                distribute()
            })
        })
    }

    _promise.race = function (queues) {
        if (!queues || !Array.isArray(queues) || queues.length == 0) {
            throw new TypeError('The 1st arguments must be array that has more than one element')
        }

        var loop = 0,
            isRuned = false,
            currItem;
        var proto = this.prototype
        var deferreds = proto.deferreds
        var speciality = proto.speciality

        speciality.staticMode = true

        return new _promise((resolve, reject) => {
            asyncFn(() => {
                var done = deferreds.shift()
                while (currItem = queues[loop++]) {
                    if (!(currItem instanceof _promise)) {
                        throw new TypeError(
                            'The 1st argument ’s content  must be instance of _promise')
                    }
                    currItem.then((res) => {
                        if (isRuned) return
                        proto.deferreds = [done]
                        resolve(res)
                        isRuned = true
                    }, (err) => {
                        if (isRuned) return
                        proto.deferreds = [done]
                        reject(err)
                        isRuned = true
                    })
                }
            })
        })
    }

    return _promise
})