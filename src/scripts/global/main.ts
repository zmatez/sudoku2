import {Game} from "../views/game";
import GameLaunch = Game.GameLaunch;
import {Index} from "../views";
import IndexLaunch = Index.IndexLaunch;
import Difficulty = Game.Difficulty;
import {ILaunch} from "./launch";

const nwApp = nw.Window.get();
nw.Window.get().showDevTools();

export class SudokuApp {
    private readonly devMode: boolean = true;
    private readonly page: string;
    private readonly launched: ILaunch;

    constructor() {
        if (this.devMode) {

        }

        this.page = document.currentScript.getAttribute("page");

        switch (this.page) {
            case "index": {
                this.launched = new IndexLaunch(this);
                break
            }
            case "game": {
                this.launched = new GameLaunch(this, Difficulty.EASY, 3);
                break
            }
        }

        this.defaults();
    }

    defaults() {
        this.createToolbar();

    }

    onStart() {
        if (this.launched) {
            this.launched.onStart()
        } else {
            console.error("Unable to launch controller for page: " + this.page)
        }
    }

    createToolbar() {
        let wrapper = document.createElement("div");
        wrapper.classList.add('toolbar');

        let icon = document.createElement('img');
        icon.src = '../images/logo.png';
        icon.classList.add('icon');
        wrapper.appendChild(icon);

        let title = document.createElement("div");
        title.id = "title";
        title.innerText = 'Sudoku';
        wrapper.appendChild(title);

        let minimize = document.createElement("div");
        minimize.classList.add("minimize");
        wrapper.appendChild(minimize);

        let minimizeSvg = document.createElement('img');
        minimizeSvg.src = "../images/minimize.svg";
        minimize.appendChild(minimizeSvg);
        minimizeSvg.addEventListener('click', () => {
            nwApp.minimize();
        });

        let close = document.createElement("div");
        close.classList.add('close');
        wrapper.appendChild(close);
        close.addEventListener('click', () => {
            window.close();
        });

        let closeSvg = document.createElement('img');
        closeSvg.src = "../images/close.svg";
        close.appendChild(closeSvg);

        let drag = document.createElement("div");
        drag.id = "drag";
        wrapper.appendChild(drag);

        document.body.append(wrapper);
    }

}

const app = new SudokuApp();
app.onStart();
