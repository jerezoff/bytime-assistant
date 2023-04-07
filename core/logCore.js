class logCore {
    constructor() {
        this.logCount = 0
    }

    debug() {
        this.logCount++
        console.debug(`>> ${this.logCount}`, ...arguments)
    }
}

module.exports = {
    logCore
}
