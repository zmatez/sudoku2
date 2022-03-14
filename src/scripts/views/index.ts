import {ILaunch} from "../global/launch";
import {SudokuApp} from "../global/main";
import {Game} from "./game";
const nwApp = nw.Window.get();

export namespace Index {
    import Difficulty = Game.Difficulty;

    export class IndexLaunch implements ILaunch {
        readonly app: SudokuApp;

        constructor(app: SudokuApp) {
            this.app = app;
        }

        onStart() {
            let difficulty = Difficulty.MEDIUM;
            let creditsMusic = new Audio('../../music/red_sun_in_the_sky.mp3');
            let playBtn = document.getElementsByClassName('play')[0];
            let optionsBtn = document.getElementsByClassName('options')[0];
            let creditsBtn = document.getElementsByClassName('credits')[0];
            let wrapper = document.getElementById('wrapper');
            let backL = document.getElementById('left');
            let backR = document.getElementById('right');

            let difficultyBtns = document.getElementsByClassName('option');

            playBtn.addEventListener('click',()=>{
                nw.Window.open("views/game.html", {
                    "title": "Sudoku",
                    "icon": "images/logo.png",
                    "frame": false,
                    "width": 720,
                    "height": 540,
                    "position": "center",
                    "resizable": false
                })
                window.close();
            });
            optionsBtn.addEventListener('click',()=>{
                wrapper.style.transform = "translateX(0)";
            });

            creditsBtn.addEventListener('click',()=>{
                wrapper.style.transform = "translateX(-200%)";
                creditsMusic.play();
            });

            backL.addEventListener('click',()=>{
                wrapper.style.transform = "translateX(-100%)";
                creditsMusic.load();
            });

            backR.addEventListener('click',()=>{
                wrapper.style.transform = "translateX(-100%)";
            });

            this.selectDifficulty(difficultyBtns);
        }

        selectDifficulty(difficulty){
            if(difficulty.classList !== "selected"){
                difficulty.classList.add("selected");
            }
            //todo to gunwo pickowanie difficulty
        }

    }
}