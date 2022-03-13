import {Game} from "../views/game";
import GameLaunch = Game.GameLaunch;
const win = nw.Window.get();
win.showDevTools();

export class SudokuApp {
    private devMode: boolean = true;

    constructor() {
        if(this.devMode){
           // let game = new GameLaunch(this,3);
           // game.onStart()
        }
        this.createToolbar();
        let redsun = new Audio('../../images/redsuninthesky.mp3');
        let closeBtn = document.getElementsByClassName('close')[0];
        let minimizeBtn = document.getElementsByClassName('minimize')[0];
        let playBtn = document.getElementsByClassName('play')[0];
        let optionsBtn = document.getElementsByClassName('options')[0];
        let creditsBtn = document.getElementsByClassName('credits')[0];
        let wrapper = document.getElementById('wrapper');
        let backL = document.getElementById('left');
        let backR = document.getElementById('right');

        closeBtn.addEventListener('click',()=>{window.close();});
        minimizeBtn.addEventListener('click',()=>{nw.Window.get().minimize();});

        playBtn.addEventListener('click',()=>{
            //plej gejm
        });
        optionsBtn.addEventListener('click',()=>{
            wrapper.style.transform = "translateX(0)";
        });

        creditsBtn.addEventListener('click',()=>{
            wrapper.style.transform = "translateX(-200%)";
            redsun.play();
        });

        backL.addEventListener('click',()=>{
            wrapper.style.transform = "translateX(-100%)";
            redsun.load();
        });

        backR.addEventListener('click',()=>{
            wrapper.style.transform = "translateX(-100%)";
        });

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

        let close = document.createElement("div");
        close.classList.add('close');
        wrapper.appendChild(close);

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
