const options = {x: 9, y:9, bomb: 10, seed: 0}

class Board extends React.Component{
    constructor(props) {
        super(props);
        this.onClickCell = this.onClickCell.bind(this);
        this.state = {
            screen: false
        }
        this.animations = {
            opening: []
        }
    }

    componentDidMount() {
        this.reset();
    }


    generateCells(rand, bombs){
        const cells = new Array(this.props.options.x);
        for(let i = 0; i < cells.length; i++)
            cells[i] = new Array(this.props.options.y);
        return this.fillCells(cells, rand, bombs);
    }

    fillCells(cells, rand, bombs){
        for(let y = 0; y < this.props.options.y; y++){
            for(let x = 0; x < this.props.options.x; x++){
                cells[x][y] = new Cell({x,y,handle:this.onClickCell})
            }
        }
        return this.fillBombCell(cells, rand, bombs);
    }

    fillBombCell(cells, rand, bombs){
        let remainingBomb = bombs;
        while (remainingBomb > 0){
            const x = rand.next(this.props.options.x);
            const y = rand.next(this.props.options.y);
            if(cells[x][y].state.bomb){
                continue;
            }
            cells[x][y].state.bomb = true;
            for(let xx = x-1; xx < x+2; xx++){
                for(let yy = y-1; yy < y+2; yy++){
                    if((xx < 0 || xx >= this.props.options.x) || (yy < 0 || yy >= this.props.options.y) || (xx === x && yy === y)){
                        continue;
                    }
                    cells[xx][yy].state.index++;
                }
            }
            remainingBomb--;
        }
        return cells;
    }

    getAdjacentCells(cell){
        return this.state.cells.reduce((acc, cells) => {
            cells.filter(current => cell !== current && this.isAdjacent(Math.abs(current.state.x - cell.state.x), Math.abs(current.state.y - cell.state.y)))
                .forEach(value => acc.push(value));
            return acc;
        }, []);
    }

    isAdjacent(x, y){
        return x !== y && x < 2 && y < 2;
    }

    onClickCell(cell, event){
        event.preventDefault();
        let array = [];
        switch (event.button){
            case 0:
                array = [...cell.open(this)];
                break;
            case 2:
                array = [...cell.setFlag(this)];
                break;
        }
        if(array.length > 0){
            this.animations.opening = [...this.animations.opening, ...array];
        }
    }

    componentDidUpdate(nextProps, nextState) {
        if(this.animations.opening.length > 0){
            gsap.from(this.animations.opening.map(el => el.getElementsByTagName('p')), {duration: 1, opacity: 0, stagger: 0.01, ease: 'elastic'});
            this.animations.opening = [];
        }

        if(!this.state.screen && (this.state.end || this.state.win)){
            console.log('End ! Win:', this.state.win);
            this.setState({screen: true});
        }
    }

    reset(){
        const rand = new Rand(this.props.options.seed)
        const bombs = Math.round((this.props.options.x * this.props.options.y) * (this.props.options.bomb / 100));
        this.setState({
            cells: this.generateCells(rand, bombs),
            rand: rand,
            bombs: bombs,
            frees: (this.props.options.x * this.props.options.y) - bombs,
            end: false,
            win: false,
        });
    }

    render() {
        return (
            <div id="board">
                {this.state.cells ? this.state.cells.map(cells => cells.map(cell => cell.render())) : null}
                {this.state.screen ? <End board={this}/> : null}
            </div>
        );
    }
}

class Cell{
    constructor(props) {
        this.state = {
            ...props,
            id: `${props.x}-${props.y}`,
            index: 0,
            bomb: false,
            flag: false,
            open: false
        }
    }

    open(board, update = true){
        let array = [];
        if(!this.state.open && !this.state.flag){
            array.push(document.getElementById(this.state.id));
            this.state.open = true;
            if(this.state.bomb){
                board.setState({end: true});
                return array;
            }else if(this.state.index === 0){
                board.getAdjacentCells(this).forEach(cell => array = [...array, ...cell.open(board, false)])
            }
            if (update){
                board.setState({frees: board.state.frees-array.length, win: (board.state.frees-array.length) <= 0});
            }
        }
        return array;
    }

    setFlag(board){
        const array = [];
        if(!this.state.open){
            if(!this.state.flag){
                array.push(document.getElementById(this.state.id));
                board.setState(() => board.state.cells[this.state.x][this.state.y].state.flag = true);
            }else{
                gsap.to(document.getElementById(this.state.id).getElementsByTagName('p'), {duration: 1, opacity: 0, stagger: 0.01, ease: 'power2.out', onComplete: () => {
                    board.setState(() => board.state.cells[this.state.x][this.state.y].state.flag = false);
                }})
            }
        }
        return array;
    }

    render(){
        return <CellComponent key={this.state.id} cell={this}/>
    }
}

class CellComponent extends React.Component{
    componentDidMount() {
        if(this.props.cell.state.x === 8 && this.props.cell.state.y === 8){
            gsap.from(".cell", {duration: 1, opacity: 0, stagger: 0.01, ease: "elastic"});
        }
    }

    render() {
        return (
            <div id={this.props.cell.state.id} className={`cell ${this.props.cell.state.open ? 'open' : 'close'}`} onClick={(e) => this.props.cell.state.handle(this.props.cell, e)} onContextMenu={(e) => this.props.cell.state.handle(this.props.cell, e)}>
                {
                    this.props.cell.state.open
                        ? <p className="content">{this.props.cell.state.bomb ? <i className="fas fa-bomb"></i> : this.props.cell.state.index > 0 ? this.props.cell.state.index : null}</p>
                        : this.props.cell.state.flag
                        ? <p className="content"><i className="fas fa-flag"></i></p>
                        : null
                }
            </div>
        );
    }
}

class End extends React.Component{
    componentDidMount() {
        gsap.from(document.getElementById("screen"), {duration: .5, opacity: 0, ease: 'power2.in', onComplete: () => {
            setTimeout(() => {
                this.props.board.reset();
                gsap.from(".cell", {duration: 1, opacity: 0, stagger: 0.01, ease: "elastic"});
                gsap.to(document.getElementById("screen"), {duration: .5, opacity: 0, ease: 'power2.out', delay: 1, onComplete: () => {
                    this.props.board.setState({screen: false});
                }});
            }, 3_000);
        }});
    }

    render() {
        return (
            <div id="screen">
                {
                    this.props.board.state.win
                        ? <p><i className="fas fa-trophy"></i> Victory</p>
                        : <p><i className="fas fa-bomb"></i> Loose</p>
                }
            </div>
        );
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

ReactDOM.render(<Board options={options}/>, document.getElementById('gamePanel'));
