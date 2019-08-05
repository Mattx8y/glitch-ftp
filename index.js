const fs = require("fs");

const ftp = require("ftp-srv");
const git = require("simple-git/promise")();

function deleteFolderRecursive(path) {
  fs.readdirSync(path).forEach(function(file,index) {
    var curPath = path + "/" + file;
    if (fs.lstatSync(curPath).isDirectory()) { // recurse
      deleteFolderRecursive(curPath);
    } else { // delete file
      fs.unlinkSync(curPath);
    };
  });
  fs.rmdirSync(path);
};

module.exports = {
  create: async function create(options = {
    accounts: []
  }) {
    if (typeof options.projectName !== "string")
      throw new TypeError("Please specify the project name");
    if (typeof options.gitUsername !== "string")
      throw new TypeError("Please specify the git username");
    let gitURL = `https://${options.gitUsername}:@api.glitch.com/git/${options.projectName}`;
    if (!fs.existsSync("./_projectStorage"))
      fs.mkdirSync("./_projectStorage");
    let projectStorage = `./_projectStorage/${options.projectName}`;
    if (fs.existsSync(projectStorage)) {
      deleteFolderRecursive(projectStorage);
    };
    fs.mkdirSync(projectStorage);
    await git.clone(gitURL, projectStorage);
    let server = new ftp();
    server.on("login", function login({connection, username, password}, resolve, reject) {
      for (let i in options.accounts) {
        let account = options.accounts[i];
        if (account.username === username && account.password === password)
          return resolve({
            fs: require("./fs.js") (projectStorage, gitURL)
          });
      };
      reject("Invalid username or password");
    });
    server.listen().then(() => console.log("Your server is online!"));
    return server;
  }
};
