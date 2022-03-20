import {ILaunch} from "../global/launch";
import {SudokuApp} from "../global/main";
import {Utils} from "../global/utils";

export namespace Game {
    import rint = Utils.rint;
    import rfloat = Utils.rfloat;
    import ColorMixer = Utils.ColorMixer;

    const win = nw.Window.get();

    export class GameLaunch extends ILaunch {
        private readonly parent: HTMLDivElement;

        private size: number;
        private difficulty: Difficulty;
        private emptyCount: number;
        private cellSize: number;

        private header: HTMLDivElement;
        private board: HTMLDivElement;
        private groups: CellGroup[][] = [];
        private cells: Cell[][] = [];
        private timer: number = 0;
        private timerElement: HTMLDivElement;
        private errorsElement: HTMLDivElement;
        private sizeElement: HTMLDivElement;
        private difficultyElement: HTMLDivElement;
        private resized: boolean = false;
        public frozen: boolean = false;
        public won: boolean = false;

        public duringSelection: Cell;
        private highlightData: { cell: Cell, x: number, y: number } = {
            cell: null,
            x: -1,
            y: -1
        };

        private button: HTMLDivElement;

        constructor(app: SudokuApp) {
            super(app);
            this.parent = <HTMLDivElement>document.getElementsByClassName('game')[0];
        }

        needsDataBeforeStart(): boolean {
            return true;
        }

        onStart(data: URLSearchParams) {

            //data

            this.size = parseInt(data.get("size"));
            this.difficulty = Difficulty.values[parseInt(data.get("difficulty"))];
            this.emptyCount = (this.size * this.size * this.size * this.size) - rfloat(this.difficulty.minFill, this.difficulty.maxFill) / 100 * (this.size * this.size * this.size * this.size);
            this.cellSize = (Math.min(document.body.offsetWidth, document.body.offsetHeight) * 0.8) / (this.size * this.size);

            //! ---

            //events

            win.on('resize', (w, h) => {
                this.resized = true;
            })
            win.on('maximize', () => {
                this.resized = true;
            })
            win.on('minimize', () => {
                this.resized = true;
            })
            win.on('restore', () => {
                this.resized = true;
            })
            setInterval(() => {
                if (this.resized) {
                    this.resized = false;
                    this.onResize();
                }
            }, 100);

            document.body.addEventListener('keydown', (e) => {
                this.onKey(e)
            })
            //! ---

            //components

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

            this.button = document.createElement('div');
            this.button.classList.add("button", "btn-give-up");
            this.button.innerHTML = "Give up";
            this.button.addEventListener('click', () => {
                if (this.button.classList.contains("btn-give-up")) {
                    //give up
                    this.giveUp();
                } else {
                    //close
                    nw.Window.open("views/index.html", {
                        "title": "Sudoku",
                        "icon": "images/logo.png",
                        "frame": false,
                        "width": 500,
                        "height": 500,
                        "position": "center",
                        "resizable": false
                    })
                    window.close();
                }
            })

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

            let generated = false;
            while(!generated){
                try {
                    this.fillBoard();
                }catch (e){
                    continue
                }
                generated = true;
            }
            this.refresh();

            this.onLoad();
        }

        onLoad() {
            this.parent.innerHTML = "";
            this.parent.appendChild(this.header);
            this.parent.appendChild(this.board);
            this.parent.appendChild(this.button);

            this.onChange();
            this.onResize()

            setInterval(() => {
                if (!this.frozen) {
                    this.timer++;
                    this.tick();
                }
            }, 1000)

            win.focus();
            document.body.focus();
        }

        onResize() {
            if (this.cells) {
                for (let x = 0; x < this.size * this.size; x++) {
                    for (let y = 0; y < this.size * this.size; y++) {
                        let cell = this.cells[x][y];
                        if (cell) {
                            cell.resize()
                        }
                    }
                }
            }
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
            //safety reset
            for (let x = 0; x < this.size * this.size; x++) {
                for (let y = 0; y < this.size * this.size; y++) {
                    let cell = this.cells[x][y];
                    cell.value = null;
                }
            }

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
                    cell.update()
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
                cell.validNumber = cell.value;
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
                    if (cell.editable) {
                        let oldValue = cell.value;
                        cell.value = null;
                        if (oldValue == null || !this.getNumbersFor(x, y).includes(oldValue)) {
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

            if (errors == 0 && !this.won && !this.frozen) {
                this.onWin();
            }
        }

        public onWin() {
            this.frozen = true;
            this.won = true;
            this.parent.classList.add("won");
            this.makeBtnClose();
            this.clearHighlight();
            this.announce("You win!", "success");
            document.body.focus();

            for (let x = 0; x < this.size * this.size; x++) {
                for (let y = 0; y < this.size * this.size; y++) {
                    let cell = this.cells[x][y];
                    if (cell.editable) {
                        cell.element.classList.add("correct-value");
                    }
                }
            }
        }

        public highlight(cell: Cell) {
            if (this.frozen) {
                return
            }
            if (this.highlightData.cell == cell) {
                return
            }
            if (this.duringSelection && cell != this.duringSelection) {
                this.highlight(this.duringSelection);
                return;
            }

            this.clearHighlight();

            let x = cell.x + (cell.group.x * this.size);
            let y = cell.y + (cell.group.y * this.size);

            for (let i = 0; i < this.size * this.size; i++) {
                let c = this.cells[i][y];
                c.highlight()
            }
            for (let i = 0; i < this.size * this.size; i++) {
                let c = this.cells[x][i];
                c.highlight()
            }
            cell.group.cells.forEach(cX => {
                cX.forEach(cY => {
                    cY.highlight();
                })
            });

            cell.hover();
            this.highlightData = {
                cell: cell,
                x: x,
                y: y
            }
        }

        private clearHighlight() {
            for (let x = 0; x < this.size * this.size; x++) {
                for (let y = 0; y < this.size * this.size; y++) {
                    let cell = this.cells[x][y];
                    cell.removeHighlight();
                }
            }
        }

        private onKey(e: KeyboardEvent) {
            if (e.key == "ArrowLeft" || e.key == "ArrowRight" || e.key == "ArrowUp" || e.key == "ArrowDown" || e.key == "Enter") {
                if (!this.highlightData.cell) {
                    this.highlightData = {
                        cell: this.cells[0][0],
                        x: 0,
                        y: 0
                    }
                } else {
                    let max = this.size * this.size;
                    if (e.key == "ArrowUp") {
                        let nextX = this.highlightData.x - 1;
                        if (nextX >= 0 && nextX < max) {
                            let cell = this.cells[nextX][this.highlightData.y];
                            this.highlight(cell);
                        }
                    } else if (e.key == "ArrowDown") {
                        let nextX = this.highlightData.x + 1;
                        if (nextX >= 0 && nextX < max) {
                            let cell = this.cells[nextX][this.highlightData.y];
                            this.highlight(cell);
                        }
                    } else if (e.key == "ArrowRight") {
                        let nextY = this.highlightData.y + 1;
                        if (nextY >= 0 && nextY < max) {
                            let cell = this.cells[this.highlightData.x][nextY];
                            this.highlight(cell);
                        }
                    } else if (e.key == "ArrowLeft") {
                        let nextY = this.highlightData.y - 1;
                        if (nextY >= 0 && nextY < max) {
                            let cell = this.cells[this.highlightData.x][nextY];
                            this.highlight(cell);
                        }
                    } else if (e.key == "Enter") {
                        if (!this.duringSelection) {
                            this.highlightData.cell.openMenu()
                        }
                    }
                }
            }

            if (e.key == "Escape") {
                this.giveUp();
            }
        }

        public giveUp() {
            if (this.frozen) {
                return
            }
            this.frozen = true;

            this.makeBtnClose()
            this.parent.classList.add("give-up");
            this.clearHighlight();
            this.announce("You lose!", "fail");
            document.body.focus();

            let oldValues: number[][] = [];
            const add = (x: number, y: number) => {
                if (!oldValues[x]) {
                    oldValues[x] = [];
                }
                let cell = this.cells[x][y];
                if (cell.editable) {
                    oldValues[x][y] = cell.value;
                    cell.value = null;
                }
            }

            for (let x = 0; x < this.size * this.size; x++) {
                for (let y = 0; y < this.size * this.size; y++) {
                    add(x, y);
                }
            }

            let x: number = -1;
            let y: number = -1;
            const next = () => {
                if (x == -1 && y == -1) {
                    x = 0;
                    y = 0;
                    if (this.cells[x][y].editable) {
                        return true
                    }
                }

                while (true) {
                    y++;
                    if (y < this.size * this.size) {
                        //good
                        if (this.cells[x][y].editable) {
                            break
                        } else {
                            continue
                        }
                    } else {
                        y = 0;
                        x++;

                        if (x < this.size * this.size) {
                            //good
                            if (this.cells[x][y].editable) {
                                break
                            } else {
                                continue
                            }
                        } else {
                            return false;
                        }
                    }
                }

                return true;
            }

            let interval = null;
            interval = setInterval(() => {
                if (next()) {
                    let cell = this.cells[x][y];
                    let valid = cell.validNumber;
                    let oldValue = oldValues[x][y];
                    if (valid != oldValue) {
                        cell.element.classList.add("wrong-value");
                        cell.select(valid)
                    } else {
                        cell.element.classList.add("correct-value");
                        cell.value = valid;
                        cell.update();
                        this.onChange(cell);
                    }
                } else {
                    clearInterval(interval);
                }
            }, 150)

        }

        private makeBtnClose() {
            this.button.classList.remove("btn-give-up");
            this.button.classList.add("btn-close");
            this.button.innerHTML = "Continue";
        }

        announce(text: string, clazz: string) {
            let box = document.createElement('div');
            box.classList.add("message-popup", clazz);
            box.innerHTML = "<div class='info'>" + text + "</div>";
            this.parent.appendChild(box);
            setTimeout(() => {
                box.remove();
            }, 5000)
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
        public validNumber: number = null;
        private menu: CellPopup;
        public fontSize: number = 14;

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

            this.group.element.appendChild(this.element);

            this.element.addEventListener('mouseenter', () => {
                this.group.parent.highlight(this);
            })
        }

        saveState() {
            this.editable = this.value == null;
            if (this.editable) {
                this.element.classList.add("editable");
                this.element.addEventListener('click', () => {
                    this.openMenu()
                })
            }
        }

        update() {
            if (this.value) {
                this.element.innerHTML = this.value + "";
            } else {
                this.element.innerHTML = "";
            }

            let cellSize = this.element.offsetWidth;
            this.fontSize = cellSize / 4;
            this.element.style.fontSize = this.fontSize + "px";
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

        openMenu() {
            if (this.group.parent.frozen) {
                return
            }
            if (this.editable) {
                this.group.parent.highlight(this);
                this.group.parent.duringSelection = this;
                this.menu = new CellPopup(this);
                this.menu.show();
                this.menu.onHide = () => {
                    setTimeout(() => {
                        if (this.group.parent.duringSelection == this) {
                            this.group.parent.duringSelection = null;
                        }
                    }, 100)
                }
            }
        }

        resize() {
            this.update();
            if (this.menu) {
                this.menu.hide()
            }
        }

        highlight() {
            this.element.classList.add("highlight");
        }

        hover() {
            this.element.classList.add("hover");
        }

        removeHighlight() {
            this.element.classList.remove("highlight");
            this.element.classList.remove("hover");
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

        public onHide: () => void = () => {
        };

        constructor(cell: Game.Cell) {
            this.cell = cell;
        }

        show() {
            this.animationEntries = [];
            this.element = document.createElement('div');
            this.element.classList.add("cell-popup");
            this.element.tabIndex = -1;
            let cellSize = Math.min(this.cell.element.offsetWidth, 80);

            let elSize = (cellSize * (3 / 1.2));
            this.element.style.width = elSize + "px";
            this.element.style.height = elSize + "px";

            let total = this.cell.size * this.cell.size + 1;
            let center = document.createElement('div');
            center.classList.add("center");
            this.element.appendChild(center);

            let mouseX = -1;
            let mouseY = -1;

            this.element.addEventListener('mousemove', (e) => {
                mouseX = e.clientX;
                mouseY = e.clientY;
            });
            this.element.addEventListener('mouseleave', (e) => {
                mouseX = -1;
                mouseY = -1;
            })

            for (let i = 0; i < total; i++) {
                let val = document.createElement('canvas');
                val.classList.add("value");

                this.values[i] = val;

                const select = () => {
                    this.selectedValue = i;
                    if (this.selected) {
                        this.selected.classList.remove("reselected");
                    }
                    this.selected = val;
                    if (!this.selected.classList.contains("selected")) {
                        this.selected.classList.add("reselected");
                    }
                }

                const findHover = () => {
                    if (mouseX != -1 && mouseY != -1) {
                        let max = (length) / 2;
                        let min = {
                            dist: -1,
                            element: null
                        }
                        for (let element of document.elementsFromPoint(mouseX, mouseY)) {
                            if (element.classList.contains("value")) {
                                let centerX = element.getBoundingClientRect().left + element.getBoundingClientRect().width / 2;
                                let centerY = element.getBoundingClientRect().top + element.getBoundingClientRect().height / 2;

                                let dist = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));
                                if (min.element == null || min.dist > dist) {
                                    if(dist < max) {
                                        min = {
                                            dist: dist,
                                            element: element
                                        }
                                    }
                                }
                            }
                        }
                        return min.element == val;
                    }
                    return false;
                }

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
                val.width = elSize * upscale;
                val.style.width = elSize + "px";
                val.style.height = length + "px";

                let ctx = val.getContext("2d");

                //!----------------------------------------------------------------------
                this.animationEntries.push((tick, hideTick) => {
                    let hover = findHover();
                    if (hover) {
                        select()
                    }

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
                    ctx.fillStyle = "rgb(" + colorR + "," + colorG + ", " + colorB + ")";
                    ctx.strokeStyle = "red";
                    ctx.lineCap = "round";
                    ctx.lineWidth = 2;

                    ctx.imageSmoothingEnabled = true;

                    let center = {
                        x: length * upscale,
                        y: length * upscale
                    }

                    const fillWedge = (cx, cy, radius, startAngle, endAngle, fillcolor, stroke = false) => {
                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        ctx.arc(cx, cy, radius, startAngle, endAngle);
                        ctx.closePath();
                        if(stroke){
                            ctx.lineWidth = 1;
                            ctx.strokeStyle = fillcolor;
                            ctx.stroke();
                        } else {
                            ctx.fillStyle = fillcolor;
                            ctx.fill();
                        }
                    }

                    const degToAngle = (deg) => {
                        let start=-Math.PI/2;
                        let fullCircle=Math.PI*2;
                        return(start+fullCircle*(deg/360));
                    }

                    ctx.save();
                    ctx.imageSmoothingEnabled = false;
                    ctx.globalCompositeOperation = "source-out";
                    {
                        //lower circle
                        let cx = center.x;
                        let cy = center.y;
                        let radius = length * upscale / 3;
                        let startAngle = -((deg + 1) / 2) % 360;
                        let endAngle = ((deg + 1) / 2) % 360;

                        fillWedge(cx, cy, radius, degToAngle(startAngle), degToAngle(endAngle), ctx.fillStyle);
                    }
                    ctx.globalAlpha = 0.8;
                    {
                        //upper circle
                        let cx = center.x;
                        let cy = center.y;
                        let radius = length * upscale;
                        let startAngle = -(deg / 2) % 360;
                        let endAngle = (deg / 2) % 360;

                        fillWedge(cx, cy, radius, degToAngle(startAngle), degToAngle(endAngle), ctx.fillStyle);
                    }
                    ctx.restore();

                    if (i != 0) {
                        ctx.save();
                        ctx.translate(length * upscale, length / 3 * upscale);
                        ctx.rotate(-(i / total * 360) / 180 * Math.PI);
                        ctx.font = "600 " + ((this.cell.fontSize) * upscale) + 'px Poppins';
                        ctx.textAlign = "center";
                        ctx.fillStyle = "white";
                        ctx.fillText((i) + "", 0, 5 * upscale);
                        ctx.restore()
                    }
                })

                this.element.appendChild(val);
            }

            let rect = this.cell.element.getBoundingClientRect();
            this.element.style.top = (rect.top) + "px";
            this.element.style.left = (rect.left) + "px";

            this.element.addEventListener('blur', () => {
                this.onHide();
                if (this.selectedValue == 0) {
                    if (this.cell.value != null) {
                        this.cell.select(null);
                        if (this.originallySelected) {
                            this.originallySelected.classList.remove("selected");
                            this.selected.classList.add("selected");
                        }
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


            this.element.style.top = (rect.top + (rect.height / 2) - (this.element.getBoundingClientRect().height / 2)) + "px";
            this.element.style.left = (rect.left + (rect.height / 2) - (this.element.getBoundingClientRect().width / 2)) + "px";

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

        hide() {
            this.element.blur()
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