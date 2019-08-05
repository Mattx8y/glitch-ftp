const fs = require("fs");

const ftp = require("ftp-srv");
const git = require("simple-git/promise")();

module.exports = {
  create: async function create(options = {
    port: 21,
    anonymous: false,
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
      url: `ftp://0.0.0.0:${options.port}`,
      anonymous: options.anonymous
    });
    server.on("login", function login({connection, username, password}, resolve, reject) {
      for (let i in options.accounts) {
        let account = options.accounts[i];
        if (account.username === username && account.password === password)
          return resolve({
            root: projectStorage
          });
      };
      reject(new TypeError("Invalid username or password"));
    });
    server.on("STOR", async function(error, fileName) {
      if (error)
        throw error;
      let cwd = process.cwd();
      process.chdir(projectStorage);
      await git.commit("Updated file");
      await git.push(gitURL);
      process.chdir(cwd);
    });
    return server;
  }
};
