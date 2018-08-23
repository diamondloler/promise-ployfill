const Promise = require('./promise')

console.log(Promise.toString())

var p1 = new Promise((resovle, reject) => {
    setTimeout(() => {
        resovle('加速度')
    }, 1200)
})

var p2 = new Promise((resovle) => {
    setTimeout(() => {
        resovle(800)
    }, 1000)
})

async function haha () {
    var res = await p1
    console.log(res)
    var res2 = await p2
    console.log(res2)
}

 haha()

