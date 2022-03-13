import {ILaunch} from "../global/launch";
import {SudokuApp} from "../global/main";

export namespace Game {
    export class GameLaunch extends ILaunch {
        private readonly size: number;
        private readonly cellSize: number;
        private readonly parent: HTMLDivElement;
        private board: HTMLDivElement;
        private cells: CellGroup[][] = [];

        constructor(app: SudokuApp, size: number) {
            super(app);
            this.size = size;
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
            this.parent.appendChild(this.board);

            for (let x = 0; x < this.size; x++) {
                for (let y = 0; y < this.size; y++) {
                    let group = this.createGroupCell(x, y);
                    group.element.style.gridTemplateRows = "repeat(" + this.size + ", 1fr)";
                    group.element.style.gridTemplateColumns = "repeat(" + this.size + ", 1fr)";

                    for (let xi = 0; xi < this.size; xi++) {
                        for (let yi = 0; yi < this.size; yi++) {
                            let cell = group.createCell(this.size, xi, yi);
                        }
                    }

                    this.board.appendChild(group.element);
                }
            }
        }

        createGroupCell(x: number, y: number): CellGroup {
            if (!this.cells[x]) {
                this.cells[x] = [];
            }

            const cellGroup = new CellGroup(x, y);
            this.cells[x][y] = cellGroup;

            return cellGroup;
        }
    }

    export class CellGroup {
        public readonly x;
        public readonly y;
        public readonly element: HTMLDivElement;
        public cells: Cell[][] = [];

        constructor(x: number, y: number) {
            this.x = x;
            this.y = y;
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
            this.group.element.appendChild(this.element);
        }
    }
}