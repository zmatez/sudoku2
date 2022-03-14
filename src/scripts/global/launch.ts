import {SudokuApp} from "./main";

export abstract class ILaunch {
    readonly app: SudokuApp;

    constructor(app: SudokuApp) {
        this.app = app;
    }

    abstract onStart();
}