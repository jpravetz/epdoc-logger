const fs = require('node:fs');

const FILENAME = 'package.json';

/**
 * @fileoverview Script to increment the version number in package.json. Will
 * increment the rightmost number that is found in the version.
 * @author [James Pravetz]
 */

fs.readFile(FILENAME, function (err, content) {
  if (err) {
    throw err;
  }
  let pkg = JSON.parse(content);
  fs.writeFile(FILENAME + '~', JSON.stringify(pkg, null, 2), function (err) {
    if (err) {
      throw err;
    }
    let version = pkg.version;
    let p = version.match(/^(.+)([^\d]+)(\d+)$/);
    if (p && p.length > 3) {
      let patch = parseInt(p[3], 10) + 1;
      pkg.version = [p[1], patch].join(p[2]);
      fs.writeFile(FILENAME, JSON.stringify(pkg, null, 2), function (err) {
        if (err) {
          throw err;
        }
        console.log(`Incremented package version ${version} -> ${pkg.version}`);
      });
    } else {
      console.log(`Invalid version number found in ${FILENAME}`);
    }
  });
});
