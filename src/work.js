 // Promise.resolve().then(() => {
        //     console.log('哈哈哈哈')
        // })

        // var p1 = new Promise(function (resovle, reject) {
        //     setTimeout(function () {
        //         resovle('加速度')
        //     }, 1000)
        // })

        var p2 = new Promise(function (resovle) {
            setTimeout(function () {
                resovle(800)
            }, 500)
        }).then((res) => {
            console.log(res)
        }).then(
            (res) => {
                console.log(1)
            }
        ).then(
            (res) => {
                console.log(4)
            }
        ).then(
            (res) => {
                console.log(7)
            }
        )


        var thenable = {
            then: function (onf, onr) {
                onf('哈哈哈哈')
            }
        }


        console.log(Promise.resolve(thenable).then((res) => {
            console.log(res)
        }))


        // Promise.race([p1, p2]).then((res) => {
        //     console.log(res)
        // })

        // var n1 = function (next) {
        //     setTimeout(() => {
        //         next(9527)
        //     }, 1000)
        // }

        // var n2 = function (next, res) {
        //     console.log(res, 66666666666666666)
        // }

        // Promise.next(n1, n2)

        // Promise.all([p1, 1, 5, {
        //     a: 666
        // }, p2]).then(function (result) {
        //     console.log(result)
        // })

        // async function haha () {
        //    var res = await p1;
        //    console.log(res);
        //    var res2 = await p2;
        //    console.log(res2);
        // }

        // haha();





        // var xixi = new Promise((resovle, reject) => {
        //     setTimeout(() => {
        //         resovle(1)
        //         // reject(66)
        //     }, 1000)
        // })

        // xixi.then((res) => {
        //     return new Promise(function (resovle) {
        //         console.log(res)
        //         setTimeout(() => {
        //             resovle(2)
        //         }, 1000)
        //     })
        // }).then((res) => {
        //     return new Promise(function (resovle) {
        //         console.log(res)
        //         setTimeout(() => {
        //             resovle(3)
        //         }, 1000)
        //     })
        // }).then((res) => {
        //     return new Promise(function (resovle) {
        //         console.log(res)
        //         setTimeout(() => {
        //             resovle(4)
        //         }, 1000)
        //     })
        // }).then((res) => {
        //     console.log(res)
        // })