import {ILaunch} from "../global/launch";
import {SudokuApp} from "../global/main";
import {Utils} from "../global/utils";

export namespace Game {
    import rint = Utils.rint;
    import rfloat = Utils.rfloat;
    import ColorMixer = Utils.ColorMixer;

    export class GameLaunch extends ILaunch {
        private readonly size: number;
        private readonly difficulty: Difficulty;
        private readonly emptyCount: number;
        private readonly cellSize: number;
        private readonly parent: HTMLDivElement;
        private header: HTMLDivElement;
        private board: HTMLDivElement;
        private groups: CellGroup[][] = [];
        private cells: Cell[][] = [];
        private timer: number = 0;
        private timerElement: HTMLDivElement;
        private errorsElement: HTMLDivElement;
        private sizeElement: HTMLDivElement;
        private difficultyElement: HTMLDivElement;

        constructor(app: SudokuApp, difficulty: Difficulty, size: number) {
            super(app);
            this.size = size;
            this.difficulty = difficulty;
            this.emptyCount = rfloat(this.difficulty.minFill, this.difficulty.maxFill) / 100 * (size * size * size * size);
            this.cellSize = (Math.min(document.body.offsetWidth, document.body.offsetHeight) * 0.8) / (this.size * this.size);
            this.parent = <HTMLDivElement>document.getElementsByClassName('game')[0];
        }

        onStart() {
            this.header = document.createElement('div');
            this.header.classList.add("header");

            this.timerElement = document.createElement('div');
            this.timerElement.classList.add("status-display", "timer");
            this.timerElement.innerHTML = "00:00";
            this.header.appendChild(this.timerElement);
            this.errorsElement = document.createElement('div');
            this.errorsElement.classList.add("status-display", "errors");
            this.errorsElement.innerHTML = "Errors";
            this.header.appendChild(this.errorsElement);
            this.sizeElement = document.createElement('div');
            this.sizeElement.classList.add("status-display", "size");
            this.sizeElement.innerHTML = this.size + "x" + this.size;
            this.header.appendChild(this.sizeElement);
            this.difficultyElement = document.createElement('div');
            this.difficultyElement.classList.add("status-display", "difficulty");
            this.difficultyElement.innerHTML = this.difficulty.name;
            this.difficultyElement.style.backgroundColor = this.difficulty.color;
            this.header.appendChild(this.difficultyElement);

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

            //generating cells
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

            this.fillBoard();
            this.refresh();

            this.onLoad();
        }

        onLoad() {
            this.parent.innerHTML = "";
            this.parent.appendChild(this.header);
            this.parent.appendChild(this.board);

            this.onChange();

            setInterval(() => {
                this.timer++;
                this.tick();
            }, 1000)
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

        public fillBoard() {
            for (let x = 0; x < this.size * this.size; x++) {
                for (let y = 0; y < this.size * this.size; y++) {
                    this.fillAt(x, y);
                }
            }

            let total = this.size * this.size - 1;

            if (this.difficulty.fieldsMatchOnce) {
                let holesMade = 0;
                let tries = 100;
                while (holesMade < tries) {
                    this.makeHoleOneMatch(rint(0, total), rint(0, total))

                    holesMade++;
                }
            } else {
                let holesMade = 0;
                while (holesMade < this.emptyCount) {
                    if (this.makeHole(rint(0, total), rint(0, total))) {
                        holesMade++;
                    }
                }
            }

            for (let x = 0; x < this.size * this.size; x++) {
                for (let y = 0; y < this.size * this.size; y++) {
                    let cell = this.cells[x][y];
                    cell.saveState();
                }
            }
        }

        private fillAt(x: number, y: number) {
            let cell = this.cells[x][y];

            let oldValue = cell.value;
            if (cell.value == null) {
                cell.availableNumbers = [];
                cell.availableNumbers.push(...this.getNumbersFor(x, y));
            }

            cell.value = null;
            if (oldValue != null) {
                if (cell.availableNumbers.includes(oldValue)) {
                    cell.availableNumbers.splice(cell.availableNumbers.indexOf(oldValue), 1);
                }
            }

            if (cell.availableNumbers.length > 0) {
                cell.value = cell.availableNumbers[rint(0, cell.availableNumbers.length - 1)];
                if (cell.availableNumbers.includes(cell.value)) {
                    cell.availableNumbers.splice(cell.availableNumbers.indexOf(cell.value), 1);
                }
            } else {
                //backtrack
                let prevX = x;
                let prevY = y - 1;
                if (prevY < 0) {
                    prevX--;
                    prevY = this.size * this.size - 1;
                }

                this.fillAt(prevX, prevY);
                this.fillAt(x, y);
            }
        }

        private makeHole(x: number, y: number): boolean {
            let cell = this.cells[x][y];

            if (cell.value == null) {
                return false;
            }

            cell.value = null;

            return true;
        }

        private makeHoleOneMatch(x: number, y: number): boolean {
            let cell = this.cells[x][y];

            if (cell.value == null) {
                return false;
            }

            let oldValue = cell.value;
            cell.value = null;

            if (this.getNumbersFor(x, y).length == 1) {
                return true;
            }

            cell.value = oldValue;
            return false;
        }

        public findErrors(): number {
            let errors = 0;
            for (let x = 0; x < this.size * this.size; x++) {
                for (let y = 0; y < this.size * this.size; y++) {
                    let cell = this.cells[x][y];
                    if(cell.editable){
                        let oldValue = cell.value;
                        cell.value = null;
                        if(oldValue == null || !this.getNumbersFor(x,y).includes(oldValue)){
                            errors++;
                        }

                        cell.value = oldValue;
                    }
                }
            }
            return errors;
        }

        public refresh() {
            for (let x = 0; x < this.size * this.size; x++) {
                for (let y = 0; y < this.size * this.size; y++) {
                    let cell = this.cells[x][y];
                    cell.update();
                }
            }
        }

        private tick() {
            let minutes = Math.floor(this.timer / 60);
            let seconds = this.timer - minutes * 60;
            let min = minutes + "";
            let sec = seconds + "";
            if (minutes < 10) {
                min = '0' + min;
            }
            if (seconds < 10) {
                sec = '0' + sec;
            }
            this.timerElement.innerHTML = min + ":" + sec;
        }

        public onChange(cell?: Cell) {
            let errors = this.findErrors();
            this.errorsElement.innerHTML = errors + " errors";
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
        public editable: boolean;
        public availableNumbers: number[] = [];

        constructor(size: number, x: number, y: number, group: CellGroup, value: number = null) {
            this.size = size;
            this.x = x;
            this.y = y;
            this.group = group;
            this.value = value;
            this.element = document.createElement('div');
            this.element.classList.add('cell');

            if (value) {
                this.element.innerHTML = value + "";
            }

            this.element.addEventListener('click', () => {
                let available = this.group.parent.getNumbersFor((this.group.x * this.size) + this.x, (this.group.y * this.size) + this.y);
                console.log(available)
            })

            this.group.element.appendChild(this.element);
        }

        saveState() {
            this.editable = this.value == null;
            if (this.editable) {
                this.element.classList.add("editable");
                this.element.addEventListener('click', () => {
                    let popup = new CellPopup(this);
                    popup.show()
                })
            }
        }

        update() {
            if (this.value) {
                this.element.innerHTML = this.value + "";
            } else {
                this.element.innerHTML = "";
            }
        }

        select(value: number) {
            this.element.classList.add("changed");

            setTimeout(() => {
                this.value = value;
                this.update();
                this.group.parent.onChange(this);
            }, 300 * 0.2)
            setTimeout(() => {
                this.element.classList.remove("changed");
            }, 300)
        }
    }

    export class CellPopup {
        public readonly cell: Cell;
        private element: HTMLDivElement;
        private originallySelected: HTMLCanvasElement;
        private selected: HTMLCanvasElement;
        private selectedValue: number = 0;
        private values: HTMLCanvasElement[] = [];
        private animationEntries: ((ms: number, hideMs: number) => void)[] = [];

        private startTime: Date;
        private hideTime: Date;

        constructor(cell: Game.Cell) {
            this.cell = cell;
        }

        show() {
            this.animationEntries = [];
            this.element = document.createElement('div');
            this.element.classList.add("cell-popup");
            this.element.tabIndex = -1;
            let cellSize = Math.max(this.cell.element.offsetWidth,45);

            let elSize = (cellSize * (this.cell.size / 1.2));
            this.element.style.width = elSize + "px";
            this.element.style.height = elSize + "px";

            let total = this.cell.size * this.cell.size + 1;

            let center = document.createElement('div');
            center.classList.add("center");
            this.element.appendChild(center);

            for (let i = 0; i < total; i++) {
                let val = document.createElement('canvas');
                val.classList.add("value");

                this.values[i] = val;

                val.addEventListener('mousemove', () => {
                    this.selectedValue = i;
                    if (this.selected) {
                        this.selected.classList.remove("reselected");
                    }
                    this.selected = val;
                    if (!this.selected.classList.contains("selected")) {
                        this.selected.classList.add("reselected");
                    }
                })

                // val.style.left = (50 - 35 * Math.cos(-0.5 * Math.PI - 2 * (1 / total) * i * Math.PI)).toFixed(4) + "%";
                // val.style.top = (50 + 35 * Math.sin(-0.5 * Math.PI - 2 * (1 / total) * i * Math.PI)).toFixed(4) + "%";
                val.style.setProperty("--rotation", (i / total * 360) + "deg");

                if ((i == 0 && this.cell.value == null) || i == this.cell.value) {
                    val.classList.add("selected");
                    this.selected = val;
                    this.originallySelected = val;
                    this.selectedValue = i;
                }

                let length = elSize / 2;
                let deg = 360 / total;

                let upscale = 2;

                val.height = length * upscale;
                val.width = length * upscale;
                val.style.width = length + "px";
                val.style.height = length + "px";

                let ctx = val.getContext("2d");
                this.animationEntries.push((tick, hideTick) => {
                    ctx.clearRect(0, 0, val.width, val.height);

                    let colorR = 37;
                    let colorG = 41;
                    let colorB = 56;

                    if (val.classList.contains("reselected") || val.classList.contains("selected")) {
                        if (tick >= 200) {
                            let mix = ColorMixer.mixRgb("#252938", val.classList.contains("reselected") ? "#1f3d79" : "#5328c2", Math.min(tick - 200, 150) / 150);
                            colorR = mix.r;
                            colorG = mix.g;
                            colorB = mix.b;
                        }

                        if (hideTick > 0) {
                            let mix = ColorMixer.mixRgb(ColorMixer.rgbToHex(colorR, colorG, colorB), "#252938", Math.min(hideTick, 150) / 150);
                            colorR = mix.r;
                            colorG = mix.g;
                            colorB = mix.b;
                        }
                    }
                    ctx.fillStyle = "rgba(" + colorR + "," + colorG + ", " + colorB + ",0.8)";
                    ctx.strokeStyle = "rgba(83,40,194,0.5)";
                    ctx.lineCap = "round";
                    ctx.lineWidth = 2;

                    const drawAngledLine = (x, y, startLength, length, angle) => {
                        let radians = angle / 180 * Math.PI;
                        let startX = x + startLength * Math.cos(radians);
                        let startY = y - startLength * Math.sin(radians);
                        let endX = x + length * Math.cos(radians);
                        let endY = y - length * Math.sin(radians);

                        return {
                            sx: startX,
                            sy: startY,
                            ex: endX,
                            ey: endY
                        }
                    }

                    ctx.imageSmoothingEnabled = true;
                    ctx.beginPath();

                    let pos1 = drawAngledLine(length / 2, length, cellSize / 2, length, (90 + -(deg / 2)) % 360);
                    let pos2 = drawAngledLine(length / 2, length, cellSize / 2, length, (90 + (deg / 2)) % 360);

                    ctx.moveTo(pos1.sx * upscale, pos1.sy * upscale);
                    ctx.lineTo(pos1.ex * upscale, pos1.ey * upscale);
                    ctx.arcTo(length / 2 * upscale, 0, pos2.ex * upscale, pos2.ey * upscale, 90);
                    ctx.lineTo(pos2.ex * upscale, pos2.ey * upscale);
                    ctx.lineTo(pos2.sx * upscale, pos2.sy * upscale);
                    ctx.arcTo(length / 2 * upscale, (length - cellSize / 2) * upscale, pos1.sx * upscale, pos1.sy * upscale, 45);

                    ctx.closePath();
                    ctx.fill();

                    if (i != 0) {
                        ctx.save();
                        ctx.translate(length / 2 * upscale, length / 3 * upscale);
                        ctx.rotate(-(i / total * 360) / 180 * Math.PI);
                        ctx.font = "600 " + (14 * upscale) + 'px Poppins';
                        ctx.textAlign = "center";
                        ctx.fillStyle = "white";
                        ctx.fillText((i) + "", 0, 5 * upscale);
                        ctx.restore()
                    }
                })

                this.element.appendChild(val);
            }

            let rect = this.cell.element.getBoundingClientRect();
            this.element.style.top = rect.top + "px";
            this.element.style.left = rect.left + "px";

            this.element.addEventListener('blur', () => {
                if (this.selectedValue == 0 && this.cell.value != null) {
                    this.cell.select(null);
                    if (this.originallySelected) {
                        this.originallySelected.classList.remove("selected");
                        this.selected.classList.add("selected");
                    }
                } else if (this.selectedValue != this.cell.value) {
                    this.cell.select(this.selectedValue);
                    if (this.originallySelected) {
                        this.originallySelected.classList.remove("selected");
                        this.selected.classList.add("selected");
                    }
                }

                this.element.classList.add("hide");
                this.hideTime = new Date();
                setTimeout(() => {
                    this.element.remove();
                }, 400)
            });

            this.element.addEventListener('keydown', (e) => {
                e.preventDefault();
                if (e.key == "ArrowLeft") {
                    this.selectedValue--;
                    if (this.selectedValue < 0) {
                        this.selectedValue = this.cell.size * this.cell.size;
                    }
                } else if (e.key == "ArrowRight") {
                    this.selectedValue++;
                    if (this.selectedValue > this.cell.size * this.cell.size) {
                        this.selectedValue = 0;
                    }
                } else if (e.key == "ArrowUp") {
                    this.selectedValue = 0;
                } else if (e.key == "ArrowDown") {
                    this.selectedValue = Math.round(this.values.length / 2);
                } else if (e.key == "Enter") {
                    this.element.blur();
                    return
                }

                if (this.selected) {
                    this.selected.classList.remove("reselected");
                }
                this.selected = this.values[this.selectedValue];
                if (!this.selected.classList.contains("selected")) {
                    this.selected.classList.add("reselected");
                }
            })

            this.element.addEventListener('click', () => {
                this.element.blur();
            })

            document.body.appendChild(this.element);
            this.element.focus();

            requestAnimationFrame(() => this.animate());
        }

        animate() {
            if (this.element.parentElement != null) {
                requestAnimationFrame(() => this.animate());
            }

            if (this.startTime == null) {
                this.startTime = new Date();
            }

            let hideTicks = 0;
            if (this.hideTime != null) {
                hideTicks = new Date().getTime() - this.hideTime.getTime();
            }

            let ticks = new Date().getTime() - this.startTime.getTime();

            this.animationEntries.forEach((f) => f(ticks, hideTicks));
        }
    }

    export class Difficulty {
        public static DEFAULT: Difficulty = new Difficulty("default", 0, 0, "#3745cb").makeFieldsMatchOnce();
        public static EASY: Difficulty = new Difficulty("easy", 40, 60, "#37cb77");
        public static MEDIUM: Difficulty = new Difficulty("medium", 20, 40, "#de7225");
        public static HARD: Difficulty = new Difficulty("hard", 10, 20, "#cb374d");

        public static readonly values: Difficulty[] = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD];

        public name: string;
        public minFill: number;
        public maxFill: number;
        public fieldsMatchOnce: boolean = false;
        public color: string;

        constructor(name: string, minFill: number, maxFill: number, color: string) {
            this.name = name;
            this.minFill = minFill;
            this.maxFill = maxFill;
            this.color = color;
        }

        public makeFieldsMatchOnce(): this {
            this.fieldsMatchOnce = true;
            return this;
        }

    }
}