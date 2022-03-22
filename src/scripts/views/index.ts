import {ILaunch} from "../global/launch";
import {SudokuApp} from "../global/main";
import {Game} from "./game";
import {Animator} from "../global/animator";

const nwApp = nw.Window.get();

export namespace Index {
    import Difficulty = Game.Difficulty;
    import MainAnimation = Animator.MainAnimation;

    export class IndexLaunch extends ILaunch {
        public readonly app: SudokuApp;
        private difficulty = Difficulty.DEFAULT;
        private boardSize = 3;

        private animation: MainAnimation;

        constructor(app: SudokuApp) {
            super(app);
        }

        onStart(data?) {
            this.animation = new MainAnimation(<HTMLDivElement>document.getElementById('wrapper'),{r: 0, b: 0, g: 0});


            this.animation.start()

            let creditsMusic = new Audio('../../music/red_sun_in_the_sky.mp3');
            let playBtn = document.getElementsByClassName('play')[0];
            let optionsBtn = document.getElementsByClassName('options')[0];
            let creditsBtn = document.getElementsByClassName('credits')[0];
            let wrapper = document.getElementById('wrapper');
            let backL = document.getElementById('left');
            let backR = document.getElementById('right');

            let difficultyBtns = document.getElementsByClassName('diff');
            let sizeBtns = document.getElementsByClassName('size');
            let themeBtns = document.getElementsByClassName('theme');

            playBtn.addEventListener('click', () => {
                let width = 240 * this.boardSize;
                let height = 205 * this.boardSize;

                nw.Window.open("views/game.html?size=" + this.boardSize + "&difficulty=" + (Difficulty.values.indexOf(this.difficulty)) + "&theme=" + this.app.theme, {
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

            for (let i = 0; i < difficultyBtns.length; i++) {
                difficultyBtns[i].addEventListener('click', () => {
                    for (let i = 0; i < difficultyBtns.length; i++)
                        difficultyBtns[i].classList.remove('selected');

                    this.selectDifficulty(parseInt(difficultyBtns[i].getAttribute('value')));
                    difficultyBtns[i].classList.add('selected');
                });
            }

            for (let i = 0; i < sizeBtns.length; i++) {
                sizeBtns[i].addEventListener('click', () => {
                    for (let i = 0; i < sizeBtns.length; i++)
                        sizeBtns[i].classList.remove('selected');

                    this.selectSize(parseInt(sizeBtns[i].getAttribute('value')));
                    sizeBtns[i].classList.add('selected');
                });
            }
            for (let i = 0; i < themeBtns.length; i++) {
                themeBtns[i].addEventListener('click', () => {
                    for (let i = 0; i < themeBtns.length; i++)
                        themeBtns[i].classList.remove('selected');

                    this.app.selectTheme(themeBtns[i].getAttribute('value') == "light" ? "light" : "dark");
                    themeBtns[i].classList.add('selected');
                });
            }

        }
        selectDifficulty(diffId: number) {
            this.difficulty = Difficulty.values[diffId];
        }

        selectSize(sizeValue: number) {
            this.boardSize = sizeValue;
        }

        onThemeChange(theme: "light" | "dark"){
            if(this.app.theme === "dark"){
                this.animation.background = {r: 0, b: 0, g: 0};
            }else{
                this.animation.background = {r: 160, b: 175, g: 160};
            }
        }
    }
}