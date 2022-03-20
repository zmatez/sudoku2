import {ILaunch} from "../global/launch";
import {SudokuApp} from "../global/main";
import {Game} from "./game";

const nwApp = nw.Window.get();

export namespace Index {
    import Difficulty = Game.Difficulty;

    export class IndexLaunch implements ILaunch {
        public readonly app: SudokuApp;
        private difficulty = Difficulty.MEDIUM;
        private boardSize = 3;

        constructor(app: SudokuApp) {
            this.app = app;
        }

        onStart(data?) {
            let creditsMusic = new Audio('../../music/red_sun_in_the_sky.mp3');
            let playBtn = document.getElementsByClassName('play')[0];
            let optionsBtn = document.getElementsByClassName('options')[0];
            let creditsBtn = document.getElementsByClassName('credits')[0];
            let wrapper = document.getElementById('wrapper');
            let backL = document.getElementById('left');
            let backR = document.getElementById('right');

            //let difficultyBtns = document.getElementsByClassName('option');

            playBtn.addEventListener('click', () => {
                let width = 240 * this.boardSize;
                let height = 205 * this.boardSize;

                nw.Window.open("views/game.html?size=" + this.boardSize + "&difficulty=" + (Difficulty.values.indexOf(this.difficulty)), {
                    "title": "Sudoku",
                    "icon": "images/logo.png",
                    "frame": false,
                    "width": width,
                    "height": height,
                    "min_width": width,
                    "min_height": height,
                    "position": "center",
                    "resizable": true
                })
                window.close();
            });
            optionsBtn.addEventListener('click', () => {
                wrapper.style.transform = "translateX(0)";
            });

            creditsBtn.addEventListener('click', () => {
                wrapper.style.transform = "translateX(-200%)";
                creditsMusic.play();
            });

            backL.addEventListener('click', () => {
                wrapper.style.transform = "translateX(-100%)";
                creditsMusic.load();
            });

            backR.addEventListener('click', () => {
                wrapper.style.transform = "translateX(-100%)";
            });

            //this.selectDifficulty(difficultyBtns);
        }

        selectDifficulty(difficulty) {
            if (difficulty.classList !== "selected") {
                difficulty.classList.add("selected");
            }
            //todo to gunwo pickowanie difficulty
        }

    }
}