const panel = document.getElementById('gamePanel');
const options = {x: 9, y: 9, bombs: 10, seed: 0}
let board = null;
let screen = null;

function newGame(){
    if(board !== null){
        board.destroy();
        panel.removeChild(board.element);
        board = null;
    }

    const boardElement = document.createElement('div');
    boardElement.id = 'board';
    panel.prepend(boardElement);

    board = new Board(boardElement, options);
    document.documentElement.style.setProperty('--count-case-width', board.options.x);
    board.generate();
}

/* GAME EVENT */
/** @param {Cell} cell
 * @param {MouseEvent} event */
function onClickCell(cell, event){
    event.preventDefault();
    switch (event.button){
        case 0:
            cell.open()
            break;
        case 2:
            cell.setFlag();
            break;
    }

    if(cell.board.end){
        showEndGame(cell.board);
    }
}

/**
 * @param {Board} board
 */
function showEndGame(board){
    if(screen){
        panel.removeChild(screen);
    }
    const newScreen = document.createElement('div');
    newScreen.id = 'screen';
    newScreen.innerHTML = `<p><i class="fas fa-${board.win ? 'trophy"></i> Victory' : 'bomb"></i> Loose'}</p>`;
    screen = newScreen;

    board.cells.forEach(cells => cells.forEach(cell => cell.showContent()));
    panel.append(screen);

    gsap.from(screen, {opacity: 0, duration: .5, ease: "power2.in", onComplete: () => {
        setTimeout(() => {
            this.newGame();
            gsap.to(screen, {opacity: 0, duration: .5, delay: 1, ease: "power2.out", onComplete: () => {
                panel.removeChild(screen);
                screen = null;
            }})
        }, 3_000);
    }})
}

/* GAME OBJECTS */

class Board{
    /** @param {HTMLElement} element
     * @param {$ObjMap} options */
    constructor(element, options = {x: 9, y:9, bombs: 10, seed: 0}) {
        this.element = element;
        this.options = options;
        this.cells = new Array(options.x);
        for (let i = 0; i < this.cells.length; i++) {
            this.cells[i] = new Array(options.y);
        }
        this.rand = new Rand(options.seed);
        this.cellFree = 0;
        this.cellBomb = 0;
        this.end = false;
        this.win = false;
    }

    generate(){
        for(let y = 0; y < this.options.y; y++){
            for(let x = 0; x < this.options.x; x++){
                const div = document.createElement('div');
                div.classList.add('cell', 'close');
                this.cells[x][y] = new Cell(this, x, y, div);
                this.cells[x][y].events.click = (event) => {
                    onClickCell(this.cells[x][y], event);
                };
                div.addEventListener('click', this.cells[x][y].events.click);
                div.addEventListener('contextmenu', this.cells[x][y].events.click);
                this.element.append(div);
            }
        }
        gsap.from(".cell", {duration: 1, opacity: 0, stagger: 0.01, ease: "elastic"});

        this.cellBomb = Math.round((this.options.x * this.options.y) * (this.options.bombs / 100));
        this.cellFree = (this.options.x * this.options.y) - this.cellBomb;
        let remainingBomb = this.cellBomb;
        while (remainingBomb > 0){
            const x = this.rand.next(this.options.x);
            const y = this.rand.next(this.options.y);
            if(this.cells[x][y].bomb){
                continue;
            }
            this.cells[x][y].bomb = true;
            for(let xx = x-1; xx < x+2; xx++){
                for(let yy = y-1; yy < y+2; yy++){
                    if((xx < 0 || xx >= this.options.x) || (yy < 0 || yy >= this.options.y) || (xx === x && yy === y)){
                        continue;
                    }
                    this.cells[xx][yy].index++;
                }
            }
            remainingBomb--;
        }
    }

    /**
     * @param {Cell} cell
     * @return {Cell[]}
     */
    getAdjacentCell(cell){
        return this.cells.reduce((acc, cells) => {
            cells.filter(current => cell !== current && this.isAdjacent(Math.abs(current.x - cell.x), Math.abs(current.y - cell.y)))
                 .forEach(value => acc.push(value));
            return acc;
        }, []);
    }

    isAdjacent(x, y){
        return x !== y && x < 2 && y < 2;
    }

    /** @param {boolean} win */
    setWin(win){
        this.win = win;
        this.setEnd(win);
    }

    /** @param {boolean} win */
    setEnd(end){
        this.end = end;
    }

    destroy(){
        this.cells.forEach(cells => cells.forEach(cell => {
            cell.element.removeEventListener('click', cell.events.click);
            cell.element.removeEventListener('contextmenu', cell.events.click);
        }))
    }
}

class Cell{
    /** @param {Board} board
     * @param {int} x
     * @param {int} y
     * @param {HTMLElement} element*/
    constructor(board, x, y, element){
        this.board = board;
        this.element = element;
        this.events = {};
        this.x = x;
        this.y = y;
        this.close = true;
        this.bomb = false;
        this.flag = false;
        this.index = 0;
    }
    open(){
        if(this.close && !this.flag){
            this.switchClass('open', 'close');
            this.showContent();
            this.close = false;
            if(this.bomb){
                //TODO: GAME OVER !
                this.board.setEnd(true);
                return;
            }
            this.board.cellFree--;
            this.board.setWin(this.board.cellFree <= 0);
            if(!this.board.win && this.index === 0){
                this.board.getAdjacentCell(this).forEach(cell => cell.open());
            }
        }
    }

    setFlag(){
        if(this.close){
            this.flag = !this.flag;
            this.showFlagContent();
        }
    }

    showContent(){
        if(this.close){
            this.element.innerHTML = `<p class="content">${this.bomb ? '<i class="fas fa-bomb"></i>' : this.index > 0 ? this.index : ''}</p>`
            gsap.from(this.element.getElementsByTagName('p'), {duration: .5, opacity: 0, ease: "power2.in"})
        }
    }

    showFlagContent(){
        if(!this.flag){
            gsap.to(this.element.getElementsByTagName('p'), {duration: .5, opacity: 0, ease: "power2.out", onComplete: ()=>{
                this.element.innerText = '';
            }});
        }else{
            this.element.innerHTML = '<p class="content"><i class="fas fa-flag"></i></p>';
            gsap.from(this.element.getElementsByTagName('p'), {duration: .5, opacity: 0, ease: "power2.in"})
        }
    }

    /**
     * @param {?string} newClass
     * @param {?string} oldClass
     */
    switchClass(newClass, oldClass){
        if(newClass) this.element.classList.add(newClass);
        if(oldClass) this.element.classList.remove(oldClass);
    }
}

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


newGame();
