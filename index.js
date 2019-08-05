const fs = require("fs");

const ftp = require("ftp-srv");
const git = require("simple-git/promise")();

module.exports = {
  create: async function create(options = {
    port: 21,
    accounts: []
  }) {
    if (typof options.projectName !== "string")
      throw new TypeError("Please specify the project name");
    if (typof options.gitUsername !== "string")
      throw new TypeError("Please specify the git username");
    let gitURL = `https://${options.gitUsername}:@api.glitch.com/git/${options.projectName}`;
    if (!fs.existsSync("./_projectStorage"))
      fs.mkdirSync("./_projectStorage");
    let projectStorage = `./projectStorage/${options.projectName}`;
    if (!fs.existsSync(projectStorage))
      fs.mkdirSync(projectStorage);
    await git.clone(gitURL, projectStorage);
    await git.addRemote(gitURL, projectStorage);
    let server = new ftp({
      url: `ftp://0.0.0.0:${options.port}`
    });
    server.on("login", function login({connection, username, password}, resolve, reject) {
      for (let i in options.accounts) {
        let account = options.accounts[i];
        if (account.username === username && account.password === password)
          return resolve({
            fs: require("./fs.js")(projectStorage, gitURL)
          });
      };
      reject(new TypeError("Invalid username or password"));
    });
    return server;
  }
};
