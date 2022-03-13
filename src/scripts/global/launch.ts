import {SudokuApp} from "./main";

export abstract class ILaunch {
    app: SudokuApp;

    constructor(app: SudokuApp) {
        this.app = app;
    }

    abstract onStart();
}