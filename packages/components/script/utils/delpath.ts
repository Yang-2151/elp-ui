import fs from "fs";
import { resolve } from "path";
import { pkgPath } from "./paths";
//保留的文件
const stayFile = ["package.json", "README.md"];

const delPath = async (path: string) => {
  let files: string[] = [];

  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);

    for (const file of files) {
      let curPath = resolve(path, file);

      if (fs.statSync(curPath).isDirectory()) {
        // 递归删除子目录（跳过 node_modules）
        if (file != "node_modules") await delPath(curPath);
      } else {
        // 删除非保留文件
        if (!stayFile.includes(file)) {
          fs.unlinkSync(curPath);
        }
      }
    }

    if (path !== `${pkgPath}/elpUI`)
      fs.rmSync(path, { recursive: true, force: true }); // 关键修改
  }
};
export default delPath;
