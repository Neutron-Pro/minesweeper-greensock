const options = {x:9, y:9, bombs: 10, seed: 0}

Vue.component('screen', {
   props:{
       winner: Boolean
   },
   template: `<div id="screen">
        <p><i class="fas" :class="{'fa-trophy': winner, 'fa-bomb': !winner}"></i> {{ winner ? 'Victory' : 'Loose' }}</p>
   </div>`,
   mounted() {
       playShowScreen();
       setTimeout(()=> this.$parent.reset(true), 3_000);
   }
});

Vue.component('cell', {
   props:{
       cell: Object
   },
   template: `<div class="cell" :class="{close: !cell.open, open: cell.open}" :id="cell.id"
            @click.left.prevent="setOpen()" @click.right.prevent="setFlag()">
        <div v-if="cell.flag || cell.open" class="content">
            <i v-if="cell.flag" class="fas fa-flag"></i>
            <i v-else-if="cell.open && cell.bomb" class="fas fa-bomb"></i>
            <p v-if="cell.open && !cell.bomb && cell.index > 0" :class="'index-'+cell.index">{{cell.index}}</p>
        </div> 
   </div>`,
   methods: {
       setOpen(){
           this.$parent.setOpen(this.cell);
       },
       setFlag() {
           this.$parent.setFlag(this.cell);
       }
   },
   mounted(){
       if(this.cell.x === this.$parent.options.x-1 && this.cell.y === this.$parent.options.y-1){
           playGameEnter();
       }
   },
   updated() {
       if(this.$parent.animations.length > 0){
           playOpeningCases(this.$parent.animations);
           this.$parent.animations = [];
       }
   }
});

Vue.component('game', {
    props: {
        options: Object
    },
    template: `<div>
        <div id="board">
            <cell v-for="cell in cells" :key="cell.id" v-bind:cell="cell" />
        </div>
        <screen v-if="screen" v-bind:winner="winner" />
    </div>`,
    data: () => {
        return {
            cells: [],
            bombs: 0,
            frees: 0,
            win: false,
            winner: false,
            screen: false,
            rand: new Rand(options.seed),
            animations: []
        }
    },
    methods: {
        setOpen(cell){
            if(!cell.open && !cell.flag){
                cell.open = true;
                this.animations.push(document.getElementById(cell.id));
                if(cell.bomb){
                    this.showScreen();
                    this.getAdjacentCell(cell, 2).forEach(target => playExplode(document.getElementById(target.cell.id)));
                    return;
                }
                if(cell.index === 0){
                    this.getAdjacentCell(cell).forEach(cell => this.setOpen(cell.cell));
                }
                this.frees--;
                this.win = this.frees <= 0;
                if(this.win){
                    playOpeningCases('.cell');
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
                    playReset(elements[i], elements.length-i, ()=>{
                        if(i === 0){ playResetComplete(this) }
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
            const cells = new Array(this.options.y);
            for(let i = 0; i < cells.length; i++){
                cells[i] = new Array(this.options.x);
            }
            return this.fillCells(cells);
        },
        fillCells(cells){
            for(let y = 0; y < this.options.y; y++){
                for(let x = 0; x < this.options.x; x++){
                    cells[y][x] = {x, y, index: 0, bomb: false, open: false, flag: false, id: `${x}-${y}`}
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
                if(cells[y][x].bomb){
                    continue;
                }
                cells[y][x].bomb = true;
                for(let xx = x-1; xx < x+2; xx++){
                    for(let yy = y-1; yy < y+2; yy++){
                        if((xx < 0 || xx >= this.options.x) || (yy < 0 || yy >= this.options.y) || (xx === x && yy === y)){
                            continue;
                        }
                        cells[yy][xx].index++;
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
        this.reset();
    }
})

Vue.component('game-menu', {
    props:{
        options: Object
    },
    template: `<div id="menu">
        <div class="title">
            <h1 class="white">Minesweeper</h1>
            <h2>With <span class="green">Vue.JS</span> & <span class="white">Green</span><span class="green">Sock</span></h2>
            <div class="round rt rl"></div>
            <div class="round rt rr"></div>
            <div class="round rb rl"></div>
            <div class="round rb rr"></div>
            <div class="links">
                <a href="https://vuejs.org/"><img src="https://vuejs.org/images/logo.png" alt="Vue.JS Logo"></a>
                <a href="https://greensock.com/"><img src="https://greensock.com/uploads/monthly_2018_06/favicon.ico.4811a987b377f271db584b422f58e5a7.ico" alt="GreenSock Logo"></a>
            </div>
        </div>
        <div class="options">
            <h3 class="white">Number of cells</h3>
            <div class="option-list">
                <div class="option-group">
                    <label for="case-x">on X: {{ options.x }}</label>
                    <input type="range" name="case-x" id="case-x" min="9" max="30" v-model:value="options.x">
                </div>
                <div class="option-group">
                    <label for="case-y">on Y: {{ options.y }}</label>
                    <input type="range" name="case-y" id="case-y" min="9" max="30" v-model:value="options.y">
                </div>
            </div>
            <h3 class="white">Number of bombs</h3>
            <div class="option-list">
                <div class="option-group">
                    <label for="case-x"> {{ options.bombs }}%</label>
                    <input type="range" name="case-x" id="bombs" min="10" max="50" v-model:value="options.bombs">
                </div>
            </div>
            <button @click="onPlay()">Play</button>
        </div>
    </div>`,
    data: function (){
        return {
            timeline: null
        }
    },
    methods: {
        onPlay(){
            this.options.x = parseInt(this.options.x);
            this.options.y = parseInt(this.options.y);
            this.options.bombs = parseInt(this.options.bombs);
            this.$parent.game = true
        },
        playTimeline(){
            this.timeline.to('#menu', {
                duration: 15,
                backgroundPositionX: `${gsap.utils.random(0, 100)}%`,
                backgroundPositionY: `${gsap.utils.random(0, 100)}%`,
                onComplete: this.playTimeline
            })
        }
    },
    mounted(){
        this.timeline = gsap.timeline();
        this.playTimeline();
        this.timeline.play();
    },
    destroyed(){
        this.timeline.kill();
    }
})

const vue = new Vue({
    el: '#gamePanel',
    data: {
        options,
        game: false
    }
})

/* ANIMATIONS GSAP */

function playGameEnter(){
    playFrom('.cell', {opacity: 0, duration: .5, stagger: (0.81 / (options.x*options.y)), ease: 'elastic'});
}

function playReset(element, index, complete = () => {}){
    gsap.to(element, {
        y:(window.innerHeight - element.clientHeight) - element.offsetTop,
        x:gsap.utils.random(-150, 150),
        duration: 2,
        delay: (4.05 / (options.x * options.y)) * index,
        rotation: gsap.utils.random(-180, 180),
        ease: 'elastic',
        onComplete: complete
    })
}

function playResetComplete(game){
    game.resetGame();
    playTo('.cell', {y: 0, x: 0, zIndex: 0, rotationX: 0, rotationY: 0, duration: 2, stagger: (1.62 / (options.x*options.y)), rotation: 0, delay: 1, ease: 'elastic'}, () => {
        playTo(document.getElementById('screen'), {opacity: 0, duration: .5, ease: 'power2.out'}, () => {
            game.screen = false;
            game.winner = false;
        });
    })
}

function playOpeningCases(cases){
    playFrom(cases, {duration: 1, opacity: 0, stagger: 0.01, ease:'elastic'});
}

function playExplode(element){
    element.style.zIndex = `${Math.round(gsap.utils.random(2, 10))}`;
    playTo(element, {
        duration: gsap.utils.random(0.5, 2.5),
        x: gsap.utils.random(-200, 200),
        y: gsap.utils.random(-200, 200),
        rotationX: gsap.utils.random(180, 1800, 180),
        rotationY: gsap.utils.random(180, 1800, 180),
        rotation: gsap.utils.random(-180, 180)
    })
}

function playShowScreen(){
    gsap.from(document.getElementById('screen'), {opacity: 0, duration: .5, ease: 'power2.in'});
}

/** @param {HTMLElement[]|HTMLElement|string} elements
  * @param {$ObjMap} params
  * @param {function=} complete */
function playFrom(elements, params, complete = () => {}){
    gsap.from(elements, {...params, onComplete: complete});
}

/** @param {HTMLElement[]|HTMLElement|string} elements
 * @param {$ObjMap} params
 * @param {function=} complete */
function playTo(elements, params, complete = () => {}){
    gsap.to(elements, {...params, onComplete: complete});
}
