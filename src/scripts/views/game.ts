import {ILaunch} from "../global/launch";
import {SudokuApp} from "../global/main";
import {Utils} from "../global/utils";

export namespace Game {
    import rint = Utils.rint;

    export class GameLaunch extends ILaunch {
        private readonly size: number;
        private readonly difficulty: Difficulty;
        private readonly cellSize: number;
        private readonly parent: HTMLDivElement;
        private board: HTMLDivElement;
        private loader: HTMLDivElement;
        private groups: CellGroup[][] = [];
        private cells: Cell[][] = [];

        constructor(app: SudokuApp, difficulty: Difficulty, size: number) {
            super(app);
            this.size = size;
            this.difficulty = difficulty;
            this.cellSize = (Math.min(document.body.offsetWidth, document.body.offsetHeight) * 0.8) / (this.size * this.size);
            this.parent = <HTMLDivElement>document.getElementsByClassName('game')[0];
        }

        onStart() {
            this.generate();
        }

        generate() {
            if (this.board) {
                this.board.remove();
            }
            this.board = document.createElement('div');
            this.board.classList.add("board");
            this.board.style.gridTemplateRows = "repeat(" + this.size + ", 1fr)";
            this.board.style.gridTemplateColumns = "repeat(" + this.size + ", 1fr)";

            // this.loader = document.createElement('div');
            // this.loader.classList.add("loader");
            // this.loader.innerHTML = "<span class=\"loader-spinner\"></span><h1>Loading board...</h1>";
            // this.parent.appendChild(this.loader);

            for (let x = 0; x < this.size; x++) {
                for (let y = 0; y < this.size; y++) {
                    let group = this.createGroupCell(x, y);
                    group.element.style.gridTemplateRows = "repeat(" + this.size + ", 1fr)";
                    group.element.style.gridTemplateColumns = "repeat(" + this.size + ", 1fr)";

                    for (let xi = 0; xi < this.size; xi++) {
                        for (let yi = 0; yi < this.size; yi++) {
                            let cell = group.createCell(this.size, xi, yi);

                            let cx = (x * this.size) + xi;
                            let cy = (y * this.size) + yi;

                            if (!this.cells[cx]) {
                                this.cells[cx] = [];
                            }
                            this.cells[cx][cy] = cell;
                        }
                    }

                    this.board.appendChild(group.element);
                }
            }


            for (let xg = 0; xg < this.size; xg++) {
                for (let yg = 0; yg < this.size; yg++) {
                    let toFill = Math.ceil(rint(this.difficulty.minFill, this.difficulty.maxFill) / 100 * (this.size * this.size));

                    while(true) {
                        let toFillLocal = toFill;
                        while (toFillLocal > 0) {
                            let rx = rint(0, this.size - 1);
                            let ry = rint(0, this.size - 1);

                            let xc = xg * this.size + rx;
                            let yc = yg * this.size + ry;

                            let cell = this.cells[xc][yc];
                            if (cell.value == null) {
                                let available = this.getNumbersFor(xc, yc);
                                if (available.length > 0) {
                                    cell.value = available[rint(0, available.length - 1)];
                                    cell.update()
                                    toFillLocal--;
                                }
                            }
                        }

                        let correct = true;
                        for (let x = 0; x < this.size; x++) {
                            for (let y = 0; y < this.size; y++) {
                                let xc = xg * this.size + x;
                                let yc = yg * this.size + y;

                                let available = this.getNumbersFor(xc, yc);
                                if(available.length == 0){
                                    correct = false;
                                    break
                                }
                            }

                            if(!correct){
                                break
                            }
                        }

                        if(correct){
                            break
                        } else {
                            for (let x = 0; x < this.size; x++) {
                                for (let y = 0; y < this.size; y++) {
                                    let xc = xg * this.size + x;
                                    let yc = yg * this.size + y;

                                    let cell = this.cells[xc][yc];
                                    cell.value = null;
                                    cell.update()
                                }
                            }
                        }
                    }
                }
            }

            this.onLoad();

        }

        onLoad() {
            this.parent.innerHTML = "";
            this.parent.appendChild(this.board);
        }

        createGroupCell(x: number, y: number): CellGroup {
            if (!this.groups[x]) {
                this.groups[x] = [];
            }

            const cellGroup = new CellGroup(x, y, this);
            this.groups[x][y] = cellGroup;

            return cellGroup;
        }

        getCellAt(x: number, y: number): Cell {
            return this.cells[x][y];
        }

        getNumbersFor(x: number, y: number): number[] {
            let numbers: number[] = [];
            for (let i = 1; i <= (this.size * this.size); i++) {
                numbers.push(i);
            }
            for (let xs = 0; xs < (this.size * this.size); xs++) {
                for (let ys = 0; ys < (this.size * this.size); ys++) {
                    if (xs == x || ys == y) {
                        let cell = this.getCellAt(xs, ys);
                        if (cell.value != null) {
                            if (numbers.includes(cell.value)) {
                                numbers.splice(numbers.indexOf(cell.value), 1);
                            }
                        }
                    }
                }
            }

            let cell = this.getCellAt(x, y);
            let group = cell.group;
            for (let xi = 0; xi < this.size; xi++) {
                for (let yi = 0; yi < this.size; yi++) {
                    let c = group.cells[xi][yi];
                    if (c.value != null) {
                        if (numbers.includes(c.value)) {
                            numbers.splice(numbers.indexOf(c.value), 1);
                        }
                    }
                }
            }

            return numbers;
        }
    }

    export class CellGroup {
        public readonly x;
        public readonly y;
        public readonly element: HTMLDivElement;
        public cells: Cell[][] = [];
        public parent: GameLaunch;

        constructor(x: number, y: number, parent: GameLaunch) {
            this.x = x;
            this.y = y;
            this.parent = parent;
            this.element = document.createElement('div');
            this.element.classList.add("cell-group");
        }

        public createCell(size: number, x: number, y: number, value: number = null): Cell {
            if (!this.cells[x]) {
                this.cells[x] = [];
            }

            const cell = new Cell(size, x, y, this, value);
            this.cells[x][y] = cell;

            return cell;
        }
    }

    export class Cell {
        public readonly size;
        public readonly x;
        public readonly y;
        public readonly group: CellGroup;
        public readonly element: HTMLDivElement;
        public value: number | null;
        public readonly editable: boolean;

        constructor(size: number, x: number, y: number, group: CellGroup, value: number = null) {
            this.size = size;
            this.x = x;
            this.y = y;
            this.group = group;
            this.value = value;
            this.editable = value == null;
            this.element = document.createElement('div');
            this.element.classList.add('cell');
            if (this.editable) {
                this.element.classList.add("editable");
            }
            if (value) {
                this.element.innerHTML = value + "";
            }


            this.element.addEventListener('click', () => {
                let available = this.group.parent.getNumbersFor((this.group.x * this.size) + this.x, (this.group.y * this.size) + this.y);
                console.log(available)
            })

            this.group.element.appendChild(this.element);
        }

        update() {
            if (this.value) {
                this.element.innerHTML = this.value + "";
            } else {
                this.element.innerHTML = "";
            }
        }
    }

    export class Difficulty {
        public static EASY: Difficulty = new Difficulty("easy", 40, 60);
        public static MEDIUM: Difficulty = new Difficulty("medium", 20, 40);
        public static HARD: Difficulty = new Difficulty("hard", 10, 20);

        public static readonly values: Difficulty[] = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];

        public name: string;
        public minFill: number;
        public maxFill: number;

        constructor(name: string, minFill: number, maxFill: number) {
            this.name = name;
            this.minFill = minFill;
            this.maxFill = maxFill;
        }

    }
}