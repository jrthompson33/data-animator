const fs = require('fs-extra');
const path = require('path');
const multirun = require('multirun');

const DEVSEQUENCE = ['cleanup', 'makedirs', 'copy', 'less', 'webpack'];

const COMMANDS = {
    cleanup: () => fs.remove('dist'),
    makedirs: [
        () => fs.mkdirs('dist'),
        () => fs.mkdirs('dist/css'),
        () => fs.mkdirs('dist/scripts'),
        () => fs.mkdirs('dist/assets'),
    ],
    copy: [
        () => copyFolder('public_app', 'dist'),
        () => copyFolder('assets', 'dist/assets'),
    ],
    less: {
        app: 'lessc less/app.less dist/styles/app.css',
    },
    server: 'python3 -m http.server 8010',
    watch: {
        tsc: 'tsc -w',
        wepback: 'webpack -w --mode=development',
        sass: 'node-sass -w sass/app.scss -o dist/styles',
    },
    webpack: 'webpack',
};

async function copyFolder(folder, location) {
    if (await fs.exists(folder)) {
        await fs.copy(folder, location);
    }
}

async function runCommands(sequence) {
    for (const cmd of sequence) {
        console.log('Build: ' + cmd);
        await multirun.run(COMMANDS[cmd]);
    }
}

let sequence = [];
process.argv.slice(2).forEach((arg) => {
    sequence.push(arg);
});

if (sequence.length === 0) {
    sequence = DEVSEQUENCE;
}

runCommands(sequence).catch((e) => {
    console.log(e.message);
    process.exit(-1);
});
