// Updated version of https://github.com/trs/ftp-srv/blob/HEAD/src/fs.js#L40 with git support

const _ = require('lodash');
const nodePath = require('path');
const uuid = require('uuid');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const errors = require('ftp-srv/src/errors.js');

const {FTPFileSystem} = require("ftp-srv");
const git = require("simple-git/promise")();

module.exports = function(projectStorage, gitURL) {
  return class FileSystem extends FTPFileSystem {
    write(fileName, {append = false, start = undefined} = {}) {
      const {fsPath, clientPath} = this._resolvePath(fileName);
      const stream = fs.createWriteStream(fsPath, {flags: !append ? 'w+' : 'a+', start});
      stream.once('error', () => fs.unlinkAsync(fsPath));
      stream.once('close', async () => {
        stream.end();
        let cwd = process.cwd();
        procss.chdir(projectStorage);
        await git.commit("Update " + fileName);
        await git.push(gitURL, "master");
        process.chdir(cwd);
      });
      return {
        stream,
        clientPath
      };
    }

    delete(path) {
      const {fsPath} = this._resolvePath(path);
      return fs.statAsync(fsPath)
      .then((stat) => {
        if (stat.isDirectory()) fs.rmdirAsync(fsPath);
        else fs.unlinkAsync(fsPath);
        let cwd = process.cwd();
        procss.chdir(projectStorage);
        await git.commit("Delete " + fileName);
        await git.push(gitURL, "master");
        process.chdir(cwd);
      });
    }

    rename(from, to) {
      const {fsPath: fromPath} = this._resolvePath(from);
      const {fsPath: toPath} = this._resolvePath(to);
      return fs.renameAsync(fromPath, toPath);
    }
  }
};
