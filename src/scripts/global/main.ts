import {Game} from "../views/game";
import GameLaunch = Game.GameLaunch;
import {Index} from "../views";
import IndexLaunch = Index.IndexLaunch;
import {ILaunch} from "./launch";
import {Data} from "./data";
import DataLoader = Data.DataLoader;

const nwApp = nw.Window.get();
//nw.Window.get().showDevTools();

export class SudokuApp {
    private readonly page: string;
    private readonly launched: ILaunch;
    public theme: "light" | "dark" = "dark";
    public data: DataLoader;

    private maximized: boolean = false;

    constructor() {
        this.data = new Data.DataLoader();
        this.data.load();

        this.page = document.currentScript.getAttribute("page");

        switch (this.page) {
            case "index": {
                this.launched = new IndexLaunch(this);
                break
            }
            case "game": {
                this.launched = new GameLaunch(this);
                break
            }
        }

        this.theme = this.data.getValue("theme", this.theme);

        this.defaults();
    }

    defaults() {
        this.createToolbar(this.page == "game");
    }

    onStart() {
        if (this.launched) {
            this.launched.onStart(new URLSearchParams(window.location.search));
        } else {
            console.error("Unable to launch controller for page: " + this.page)
        }

        this.selectTheme(this.theme);
    }

    createToolbar(canMaximize: boolean = false) {
        let wrapper = document.createElement("div");
        wrapper.classList.add('toolbar');

        let icon = document.createElement('img');
        icon.src = '../images/logo.png';
        icon.classList.add('icon');
        wrapper.appendChild(icon);

        let title = document.createElement("div");
        title.id = "title";
        title.innerText = 'Sudoku Breakout';
        wrapper.appendChild(title);

        let minimize = document.createElement("div");
        minimize.classList.add("minimize");
        wrapper.appendChild(minimize);

        let minimizeSvg = document.createElement('img');
        minimizeSvg.src = "../images/minimize.svg";
        minimizeSvg.classList.add("toolbar-img")
        minimize.appendChild(minimizeSvg);
        minimizeSvg.addEventListener('click', () => {
            nwApp.minimize();
        });

        if(canMaximize){
            let maximize = document.createElement("div");
            maximize.classList.add("maximize");
            wrapper.appendChild(maximize);

            let maximizeSvg = document.createElement('img');
            maximizeSvg.src = "../images/maximize.svg";
            maximizeSvg.classList.add("toolbar-img")
            maximize.appendChild(maximizeSvg);
            maximizeSvg.addEventListener('click', () => {
                this.maximized = !this.maximized;

                if(!this.maximized){
                    nwApp.restore()
                } else {
                    nwApp.maximize()
                }
            });
        }

        let close = document.createElement("div");
        close.classList.add('close');
        wrapper.appendChild(close);
        close.addEventListener('click', () => {
            window.close();
        });

        let closeSvg = document.createElement('img');
        closeSvg.classList.add("toolbar-img")
        closeSvg.src = "../images/close.svg";
        close.appendChild(closeSvg);

        let drag = document.createElement("div");
        drag.id = "drag";
        wrapper.appendChild(drag);

        document.body.append(wrapper);
    }

    selectTheme(theme: "light" | "dark") {
        this.theme = theme;
        if (theme === "light") {
            document.documentElement.classList.remove("dark");
            document.documentElement.classList.add("light");
        } else {
            document.documentElement.classList.remove("light");
            document.documentElement.classList.add("dark");
        }

        if(this.launched){
            this.launched.onThemeChange(theme);
        }

        //@ts-ignore
        if(this.data.getValue("theme","") != this.theme) {
            this.data.setValue("theme", this.theme);
            this.data.save();
        }
    }
}

const app = new SudokuApp();
app.onStart();