# GitHub Pages 发布

项目为纯静态游戏，无需在线运行 Python，也不需要服务器密钥。仓库的 main 分支推送后，.github/workflows/pages.yml 会运行 Node.js 检查、生成静态发布包，再部署到 GitHub Pages。

## 不使用插件：GitHub 网页上传

1. 登录 GitHub，进入 https://github.com/new 创建 Public 仓库，例如 tingyu-jianghu，勾选添加 README 以创建 main 分支。
2. 解压项目中的 tingyu-jianghu-pages.zip，打开其中 tingyu-jianghu 文件夹。
3. 仓库选择 Add file → Upload files，把文件夹内的文件及 assets 文件夹一起上传，再点击 Commit changes。仓库根目录应直接显示 index.html。
4. 打开 Settings → Pages，Source 选择 Deploy from a branch，Branch 选择 main，目录选择 /(root)，点击 Save。
5. 部署完成后在同一页面点击 Visit site。地址通常为 https://用户名.github.io/tingyu-jianghu/，以页面返回的地址为准。

网页上传包包含完整的静态游戏，共 49 个文件，单文件低于网页上传限制；已包含 .nojekyll。macOS 在 Finder 中可按 Command + Shift + . 显示隐藏文件，再一起选中上传。压缩包需先解压，index.html 应位于仓库根目录。

若出现 “The file is too large”：发布 ZIP 本身约 45 MiB，超过网页上传单文件 25 MiB 的限制。可直接在 Finder 按 Command + Shift + G，输入 `/Users/apple/Documents/game/_site`，打开已解压的发布目录。将里面的网页文件与 assets 文件夹拖入上传区；这里总共 49 个文件，最大单文件约 3.62 MiB，符合限制。不要从整个项目根目录选取文件，以免把发布压缩包也选进去。

这一方式使用网页提交和分支发布，不需要 GitHub 插件、Git 命令或自定义 Actions 配置。如果 GitHub 账号本身要求登录验证，仍需完成其验证；插件连接与 GitHub 账号验证是两件不同的事。

下面是保留源码和自动检查的另一种发布方式。

首次发布需先完成 GitHub 账号连接，创建仓库并上传代码；仓库 Settings → Pages → Build and deployment 的 Source 选择 GitHub Actions。成功后可通过 GitHub Pages 返回的地址访问，通常为 `https://用户名.github.io/仓库名/`。实际地址以 GitHub 部署结果为准。

## 发布包

运行 `python3 tools/build_site.py`，输出到 `_site/`。只收录浏览器需要的 HTML、CSS、JavaScript 和图片，不把本地启动器、测试、说明及绘图来源记录发布到网站。构建时重新生成脚本、样式的内容版本号，并验证页面、样式和静态资源的相对路径。

所有游戏资源使用相对地址，兼容仓库子路径；开场、地图、人物、战斗、背包和技能观赏均包含在发布包内。`_site/` 是生成目录，已加入 .gitignore。

## 存档

花卉收藏和故事进度存放在访问者自己的浏览器中。github.io 与本机 localhost 是不同站点，本地试玩存档不会自动迁移到线上；不同设备的存档也不会自动同步。

## 更新

修改源码后提交并推送到 main。Actions 检查通过后自动部署，无需逐张上传素材。可在仓库 Actions 页查看构建和发布结果，完成后再访问 Pages 地址验证。
