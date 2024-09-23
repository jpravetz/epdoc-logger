const os = require('node:os');
const path = require('node:path');

const { fsitem } = require('@epdoc/fsutil');

const tNow = new Date().getTime();
const DAY = 24 * 3600 * 1000;
const WEEK = 7 * DAY;
const home = os.userInfo().homedir;

const BAHIA2_FOLDER = path.resolve(home, 'dev/epdoc/network-config/bahia2');
const OJOCHAL1_FOLDER = path.resolve(home, 'dev/epdoc/network-config/ojochal1');
const CONFIG_FOLDER = path.resolve(home, 'dev/epdoc/network-config/ojochal1/config');
const PWD = path.resolve(home, 'dev/epdoc/routergen');
const CWD = path.resolve(home, 'dev/epdoc/routergen');
const TMP = path.resolve(home, 'dev/epdoc/routergen/tmp');
// Execute `npm run launch` to run this script
const BUILDS = [
  { reg: new RegExp(/HEX_ROUTER/, 'g'), val: `-o ${TMP} ${OJOCHAL1_FOLDER}/config/hex-router.config.json` },
  { reg: new RegExp(/HAP_TALLER/, 'g'), val: `-o ${TMP} ${OJOCHAL1_FOLDER}/config/hap-taller.config.json` },
  { reg: new RegExp(/HAP_BRAIN/, 'g'), val: `-o ${TMP} ${OJOCHAL1_FOLDER}/config/hap-brain.config.json` },
  { reg: new RegExp(/HAP_LAVADO/, 'g'), val: `-o ${TMP} ${OJOCHAL1_FOLDER}/config/hap-lavado.config.json` },
  { reg: new RegExp(/HAP_BAHIA2/, 'g'), val: `-o ${TMP} ${BAHIA2_FOLDER}/config/hap-bahia2.config.json` },
  { reg: new RegExp(/HAP_BAHIA3/, 'g'), val: `-o ${TMP} ${BAHIA2_FOLDER}/config/hap-bahia3.config.json` },
  { reg: new RegExp(/CWD/, 'g'), val: CWD },
  { reg: new RegExp(/OJOCHAL1/, 'g'), val: OJOCHAL1_FOLDER }
];

function days(n) {
  const s = new Date(tNow - n * DAY).toISOString();
  return s.replace(/T.*/, '').replace(/\-/g, '');
}

const scripts = [
  '',
  '-h',
  'gen HEX_ROUTER',
  'gen HAP_TALLER',
  'gen HAP_LAVADO',
  'gen HAP_BRAIN',
  'gen HAP_BAHIA2',
  '--log trace gen -t --comment "Updated script adds more comments" -o tmp OJOCHAL1/config/hex-router.config.json',
  'read --json -o CWD/tmp/xx.json OJOCHAL1/snapshots/hap-taller_20240225.rsc',
  'read --scrub -o CWD/tmp  OJOCHAL1/snapshots/hap-taller_20240504.rsc',
  'read CWD/tmp/tmp.rsc',
  'read --log trace parse CWD/tmp/tmp.rsc',
  '--log trace parse -o tmp/xx.rsc tmp/tmp.rsc'
];

let result = {
  version: '0.2.0',
  configurations: [
    {
      name: 'Debug Jest Tests',
      type: 'node',
      request: 'launch',
      runtimeArgs: ['--inspect-brk', '${workspaceRoot}/node_modules/.bin/jest', '--runInBand'],
      console: 'integratedTerminal',
      internalConsoleOptions: 'neverOpen'
    }
  ]
};

scripts.forEach((line) => {
  let altLine = line;
  BUILDS.forEach((item) => {
    altLine = altLine.replace(item.reg, item.val);
  });
  let entry = {
    type: 'node',
    request: 'launch',
    name: `routergen ${line}`,
    skipFiles: ['<node_internals>/**'],
    program: '${workspaceFolder}/dist/src/cli.js',
    args: ['--color', '--pwd', PWD, '--cwd', CWD].concat(altLine.split(/\s+/)),
    outFiles: ['${workspaceFolder}/dist/**/*.js']
  };
  result.configurations.push(entry);
});

let fs = fsitem(__dirname, '.vscode', 'launch.json');
return fs
  .writeJson(result)
  .then((resp) => {
    console.log('Updated launch script');
  })
  .catch((err) => {
    console.log(err);
  });
