import { execSync } from "child_process";
import readline from "readline";

const REQUIRED_GIT_VERSION = "2.0";

const Paint = {
  red: (msg) => console.log("\x1b[31m%s\x1b[0m", msg),
  green: (msg) => console.log("\x1b[32m%s\x1b[0m", msg),
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (text) => {
  return new Promise((resolve) => rl.question(text, resolve));
};

let all_good = true;

const check = async (label, callback) => {
  console.log(`Checking ${label}...`);

  try {
    const [result, message] = await callback();
    all_good = all_good && result;

    result ? Paint.green(`[OK] ${message}`) : Paint.red(`[KO] ${message}`);
  } catch (e) {
    console.log("Test not available for now...");
    console.log(e);
  }
};

const checkShellIsZsh = () =>
  process.env.SHELL.match(/zsh/)
    ? [true, "Your default shell is zsh"]
    : [false, `Your default shell is ${process.env.SHELL}, but should be zsh`];

const checkGitVersion = () => {
  const versionTokens = execSync("git --version", { encoding: "utf8" })
    .replace("git version", "")
    .replace(/\s/g, "")
    .split(".")
    .map(Number);
  const requiredVersionTokens = REQUIRED_GIT_VERSION.split(".").map(Number);

  return versionTokens[0] === requiredVersionTokens[0] &&
    versionTokens[1] >= requiredVersionTokens[1]
    ? [true, `Your default git version is ${versionTokens.join(".")}`]
    : [
        false,
        `Your default git version is outdated: ${versionTokens.join(".")}`,
      ];
};

const gitEmailsMatch = async () => {
  const gitEmail = execSync("git config --global user.email", {
    encoding: "utf8",
  });

  console.log(
    "Please go to https://github.com/settings/emails and make sure that"
  );
  console.log(`the following email is listed on that page: ${gitEmail}`);
  const response = await question("Is that the case? (y/n + <Enter>)\n> ");
  rl.close();
  const ok = response.toLowerCase().includes("y");
  return [
    ok,
    ok
      ? "git email is included in Github emails"
      : `Add ${gitEmail} to your GitHub account or update your git global settings`,
  ];
};

const gitEditorSetup = async () => {
  const editor = execSync("git config --global core.editor");
  return editor.match(/code/i)
    ? [true, "VS Code is your default git editor"]
    : [
        false,
        "Ask a teacher to check your ~/.gitconfig editor setup. Right now, it's `#{editor.chomp}`",
      ];
};

const outro = async () => {
  if (all_good) {
    console.log("");
    Paint.green("🚀  Awesome! Your computer is now ready!");
  } else {
    console.log("");
    Paint.red("😥  Bummer! Something's wrong.");
  }
};

const checkAll = async () => {
  await check("shell", checkShellIsZsh);
  await check("git version", checkGitVersion);
  await check("git/Github email matching", gitEmailsMatch);
  await check("git editor", gitEditorSetup);
  await outro();
};

checkAll();
