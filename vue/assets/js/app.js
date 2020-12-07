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
           gsap.to(document.getElementById('screen'), {opacity: 0, duration: .5, delay: 10, ease: 'power2.out', onComplete: () => {
               this.$parent.screen = false;
               this.$parent.winner = false;
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
        winner: false,
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
                    this.getAdjacentCell(cell, 2).forEach(target => {
                       const el = document.getElementById(target.cell.id);
                       el.style.zIndex = gsap.utils.random(5,10);
                       gsap.to(el, {
                           duration: gsap.utils.random(0.5, 2.5),
                           x: gsap.utils.random(-200, 200),
                           y: gsap.utils.random(-200, 200),
                           rotationX: gsap.utils.random(180, 1800, 180),
                           rotationY: gsap.utils.random(180, 1800, 180),
                           rotation: gsap.utils.random(-180, 180)
                       })
                    });
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
            this.winner = this.win;
        },
        reset(animation = false){
            if(animation){
                const elements = document.querySelectorAll('.cell');
                for(let i = elements.length - 1; i > -1; i--){
                    gsap.to(elements[i], {
                        y:(window.innerHeight - elements[i].clientHeight) - elements[i].offsetTop,
                        x:gsap.utils.random(-150, 150),
                        duration: 2,
                        delay: 0.05 * (elements.length-i),
                        rotation: gsap.utils.random(-180, 180),
                        ease: 'elastic',
                        onComplete: () => {
                            if(i === 0){
                                this.resetGame();
                                gsap.to('.cell', {
                                    y: 0,
                                    x: 0,
                                    zIndex: 0,
                                    rotationX: 0,
                                    rotationY: 0,
                                    duration: 2,
                                    stagger: 0.02,
                                    rotation: 0,
                                    delay: 1,
                                    ease: 'elastic'
                                })
                            }
                        }
                    })
                }
                return;
            }
            this.resetGame();
        },
        resetGame(){
            this.cells = this.generateCell();
            this.win = false;
            this.rand = new Rand(this.options.seed);
            document.documentElement.style.setProperty('--count-case-width', this.options.x);
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
        getAdjacentCell(cell, radius = 1){
            return this.$children.filter(current => this.isAdjacent(Math.abs(current.cell.x - cell.x), Math.abs(current.cell.y - cell.y), radius));
        },
        isAdjacent(x, y, radius){
            return !(x === y && Math.abs(x) === radius) && x <= radius && y <= radius;
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
