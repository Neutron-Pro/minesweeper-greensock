const options = {x:9, y:9, bombs: 10, seed: 0}

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

Vue.component('screen', {
   render: function (element) {
       return element('div', this.$slots.default)
   },
   mounted() {
       gsap.from(document.getElementById('screen'), {opacity: 0, duration: .5, ease: 'power2.in'});
       setTimeout(()=>{
           this.$parent.reset(true);
           gsap.to(document.getElementById('screen'), {opacity: 0, duration: .5, delay: 1, ease: 'power2.out', onComplete: () => {
               this.$parent.screen = false;
           }});
       }, 3_000);
   }
});

Vue.component('cell', {
   props:{
       cell: Object,
   },
   render: function (element){
       return element('div', this.$slots.default)
   },
   mounted(){
       if(this.cell.x === this.$parent.options.x-1 && this.cell.y === this.$parent.options.y-1){
           gsap.from('.cell', {opacity: 0, duration: .5, stagger: 0.01, ease: 'elastic'});
       }
   }
});

const vue = new Vue({
    el: '#gamePanel',
    data: {
        options,
        cells: [],
        bombs: 0,
        frees: 0,
        win: false,
        screen: false,
        rand: new Rand(options.seed),
        animations: []
    },
    methods: {
        setOpen(cell){
            if(!cell.open && !cell.flag){
                cell.open = true;
                this.animations.push(document.getElementById(cell.id));
                if(cell.bomb){
                    this.showScreen();
                    return;
                }
                if(cell.index === 0){
                    this.getAdjacentCell(cell).forEach(cell => this.setOpen(cell.cell));
                }
                this.frees--;
                this.win = this.frees <= 0;
                if(this.win){
                    this.showScreen();
                }
            }
        },
        setFlag(cell){
            if(!cell.open){
                cell.flag = !cell.flag;
            }
        },
        showScreen(){
            this.screen = true;
        },
        reset(animation = false){
            this.cells = this.generateCell();
            this.win = false;
            this.rand = new Rand(this.options.seed);

            if(animation){
                gsap.from('.cell', {opacity: 0, duration: .5, stagger: 0.01, ease: 'elastic'});
            }
        },
        generateCell(){
            const cells = new Array(this.options.x);
            for(let i = 0; i < cells.length; i++){
                cells[i] = new Array(this.options.y);
            }
            return this.fillCells(cells);
        },
        fillCells(cells){
            for(let y = 0; y < this.options.y; y++){
                for(let x = 0; x < this.options.x; x++){
                    cells[x][y] = {x, y, index: 0, bomb: false, open: false, flag: false, id: `${x}-${y}`}
                }
            }
            return this.loadCell(cells)
                .reduce((acc, cells) => cells.reduce((acc,cell) => [...acc, cell], acc), []);
        },
        loadCell(cells){
            this.bombs = Math.round((this.options.x * this.options.y) * (this.options.bombs / 100));
            this.frees = (this.options.x * this.options.y) - this.bombs;
            let remainingBomb = this.bombs;
            while (remainingBomb > 0){
                const x = this.rand.next(this.options.x);
                const y = this.rand.next(this.options.y);
                if(cells[x][y].bomb){
                    continue;
                }
                cells[x][y].bomb = true;
                for(let xx = x-1; xx < x+2; xx++){
                    for(let yy = y-1; yy < y+2; yy++){
                        if((xx < 0 || xx >= this.options.x) || (yy < 0 || yy >= this.options.y) || (xx === x && yy === y)){
                            continue;
                        }
                        cells[xx][yy].index++;
                    }
                }
                remainingBomb--;
            }
            return cells;
        },
        getAdjacentCell(cell){
            return this.$children.filter(current => this.isAdjacent(Math.abs(current.cell.x - cell.x), Math.abs(current.cell.y - cell.y)));
        },
        isAdjacent(x, y){
            return x !== y && x < 2 && y < 2;
        }
    },
    mounted(){
        this.reset()
    },
    updated(){
        if(this.animations.length > 0){
            gsap.from(this.animations, {duration: 1, opacity: 0, stagger: 0.01, ease: 'elastic'});
            this.animations = [];
        }
    }
})