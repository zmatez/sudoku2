import * as fs from "fs";
import * as path from "path";

export namespace Data {
    export class DataLoader {
        private readonly path: string;
        private readonly newEntry: boolean;

        // json object
        private data: any = {};

        constructor() {
            this.path = process.env.APPDATA;
            if (this.path == null) {
                this.path = process.env.HOME;
            }

            this.path = path.join(this.path, "Srajszczaj Development", "Sudoku");

            this.newEntry = !fs.existsSync(this.path);
            if(this.newEntry){
                fs.mkdirSync(this.path,{recursive: true});
            }

            this.path = path.join(this.path, "data.json");
            if(!fs.existsSync(this.path)){
                this.save()
            }
        }

        public getValue<T>(key: string, defaultValue: T): T {
            if (this.data.hasOwnProperty(key)) {
                return <T>this.data[key];
            }

            return defaultValue;
        }

        public setValue(key: string, value: any) {
            this.data[key] = value;
        }

        public save() {
            fs.writeFileSync(this.path,JSON.stringify(this.data),{encoding: "utf-8"});
        }

        public load() {
            this.data = JSON.parse(fs.readFileSync(this.path,{encoding: "utf-8"}).toString());
        }
    }
}