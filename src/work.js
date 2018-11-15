console.log(Promise.toString())


var p3 = new Promise((resovle) => {
    setTimeout(() => {
        resovle(3)
    }, 100)
})

async function test() {
    var plianValue2 = await Promise.resolve(p3)
    console.log(plianValue2)
}

test()

//console.log(test())