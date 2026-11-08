# 江南拾芳与街巷扩建

右上台地为听雨武馆；原“枕河客舍”（guesthouse，坐标 [1000,510,235,230]）更名为“村长家”，老村长站在其南侧门口。左上仍为枕间客舍。铁匠铺恢复“溪南铁铺”名称，移至地图东侧 [1338,454,224,245]，采用新绘制的向左开门建筑图片；其余建筑位置不变。新图片 assets/town/smithy-left.png 使用内置 image_gen 绘制，提示词和来源见 assets/town/smithy-left-provenance.json。

## 花卉收藏

镇内有十二处素馨花、桂花盆景或荷花缸。收集物只有素馨花、桂花瓣、荷花瓣，没有草药、挖矿和伐木。

- 点击花草只会自动走近，绝不会自动收取。
- 在同一高度、距离小于 66 且没有障碍时，按 F 确认，或点击画面上的 F 确认按钮。
- 按 F 后瞬间获得一件花材，无等待、无进度条；完成后显示入包提示。
- 同一处花材 60 秒后再生；收集后花草仍以较淡的颜色保留。
- F 与 E 使用同一大小、同一位置的小提示，同时仅显示一个；人物交谈优先。
- B 打开行囊，B / Esc 或关闭按钮返回地图。物品自动堆叠，点击物品可查看数量和说明。
- 花卉收藏与再生时间写入当前浏览器 localStorage，键名 tingyu-keepsakes-v1。刷新保留；回到村口不清空收藏。浏览器禁止存储时仍可临时收集，背包内会说明无法持久保存。

## 图片与代码

assets/town/ 保存七张当前采用的图片：dojo.png、smithy-left.png、winehouse.png、guesthouse.png、jasmine.png、osmanthus.png、lotus.png。均使用内置 image_gen 生成；提示词与原始路径记录于 provenance.json 及 smithy-left-provenance.json。

gathering.js 管理物品、花草位置、再生和存档；inventory.js / inventory.css 管理背包；game.js 负责走近、F 确认、取消与场景绘制。village-map.js 统一配置新建筑位置和碰撞。

本轮建筑用于场景展示；商店交易、锻造和花材合成尚未加入。

## 验证

tests/gathering.test.cjs 检查数量、重复采集、再生、坏存档、存储不可用及十二处花草的可达性。tests/town-interaction.test.cjs 在 DOM 测试替身中执行实际 game.js 输入／更新逻辑，检查不自动采集、F 即时确认、提示互斥、村长门口寻路与对话、B / Esc 与保存恢复。地图、跑步、人物和战斗规则检查一并通过。

本轮浏览器自动化连接连续超时，未完成最终画面及原生浏览器键盘验证；本地服务已恢复到 http://127.0.0.1:8765/。

老村长图片使用内置 image_gen 绘制，路径为 assets/q/village-chief.png，完整提示词见 assets/q/chief-provenance.json。
