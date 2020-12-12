class Rand{
    /** @param {int|undefined} seed */
    constructor(seed){
        if(seed === undefined || seed < 1){
            seed = Math.floor(Math.random() * 1_000_000)+1
        }
        this.orignalSeed = seed;
        this.seed = seed;
    }
    /** @param {int|undefined} bound */
    next(bound){
        this.seed = Math.sin(this.seed) * 10000;
        let rand = this.seed - Math.floor(this.seed);
        if(bound !== undefined || bound > 0){
            rand = Math.floor(rand * bound);
        }
        return rand;
    }
}
