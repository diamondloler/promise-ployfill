console.log(Promise.toString())


var p3 = new Promise(function (resovle) {
    setTimeout(function () {
        resovle(3)
    }, 1000)
})

p3.then(function (res) {
    console.log(res)
})


//console.log(test())