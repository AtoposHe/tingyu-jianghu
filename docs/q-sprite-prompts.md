# 国风 Q 版绘图提示词与素材

工具：内置 image_gen，所有调用请求 transparent_background=true。最终采用约三头身的国风 Q 版。先前自然比例草案未接入项目，用户原图保留为配色、发饰与角色识别参考。

## 最终采用的 PNG

原有八张战斗姿态均位于 assets/q/，为 1254 × 1254、带真实透明通道的 PNG。新增跑步图集 hero-run-sheet.png 为 1774 × 887，四列两行共八帧，提示词见 run-provenance.json，接入说明见 docs/run-animation.md。

| 文件 | 姿态 | 参考 |
| --- | --- | --- |
| hero-idle.png | 少侠待机、双拳防守 | 用户原画 |
| hero-windup.png | 少侠蓄势、收势 | Q版少侠待机 |
| hero-attack.png | 少侠直拳命中 | Q版少侠待机 |
| hero-hit.png | 少侠受击 | Q版少侠待机 |
| trainer-idle.png | 武师待机 | Q版少侠画风 |
| trainer-punch.png | 武师普通拳击 | Q版武师待机 |
| trainer-palm.png | 武师推山掌 | Q版武师待机 |
| trainer-hit.png | 武师受击 | Q版武师待机 |

图片从生成目录完整复制进项目。assets/q/provenance.json 记录源路径。tools/inspect-sprites.cjs 仅读取透明通道并生成 sprite-data.js，不改变图片像素。

## 基础少侠提示词

Use case: stylized-concept. Asset type: CHIBI Chinese wuxia 2D game idle sprite, transparent PNG. Use Chinese NATIONAL-STYLE Q-VERSION (国风Q版), NOT realistic adult proportions. Interpret the reference young male hero as a charming 3-heads-tall CHIBI young-adult martial artist: large expressive head, compact readable body, short sturdy legs and visible small hands. Keep recognizable long dark half-up hair with a small gold-jade crown, teal-blue outer tunic over ivory inner robe, a few gold cloud/bamboo details, jade belt pendant and short red tassel, dark boots. Simplify garment complexity: knee-length split robe panels with clear trousers, short sleeves that do not hide hands. Clean refined hand-painted Chinese mobile RPG art, soft watercolor/gongbi touches, clear confident brown ink outline, subtle cel shading. Three-quarter view facing RIGHT, standing in light boxing guard, both closed fists fully visible, two complete arms and two boots. Full body inside a square canvas, transparent padding, no weapon, no environment, ground, shadow, glow, vignette, text or checkerboard.

## 基础武师提示词

New transparent character; use the Q-version hero as STYLE reference only. Create Lu Qingshan, a middle-aged martial arts instructor, in the same Chinese Q-version chibi style and head/body ratio. Big expressive head, compact 3-heads-tall body, short clear limbs. Strong eyebrows, short dark beard, black topknot with red ribbon. Ochre training robe with gold cloud trim, ivory shirt, dark trousers, leather wrist guards, red sash, cloth boots, bronze buckle. Face RIGHT in three-quarter view, both closed fists in natural boxing guard, both complete hands and both legs clearly visible. No weapon. Match the refined ink edges, soft shading and readable garment shapes. Full body, genuine alpha transparency, no labels, glow, gradients, scenery, floor, particles or shadow.

## 动作帧共同提示词

Use case: identity-preserve. Produce ONE CHIBI 2D wuxia game pose frame of the EXACT SAME character in the supplied Q-version reference. Preserve the same oversized expressive head, compact three-heads-tall body, face, hairstyle, costume colors and every identifying costume detail. Identical hand-painted Chinese national-style Q-version mobile RPG rendering; clean outlines and soft colored shading, not realistic anatomy proportions. Face RIGHT in three-quarter view. Full body, BOTH complete attached arms and hands, BOTH legs and boots clearly visible. Hair, robe and both hands entirely inside frame. Square canvas like the reference, boots baseline close to 94% image height, consistent camera and character head size. Genuine transparent PNG alpha outside the character. No scenery, no floor, no drop shadow, no glowing backdrop, no gradients, no checkerboard, no text, no FX or particles, no additional character, no blood. Keep accessories attached, don't crop the head or boots.

共同提示词后按图片加入以下动作要求：

- 少侠蓄势：WINDUP BEFORE PUNCH. Front fist drawn BACK close to waist, other fist raised at chest. Torso rotated slightly back, knees bent, weight poised on rear foot. Preserve crown, jade pendant, bamboo front panel and red tassel.
- 少侠出拳：One full arm extends horizontally RIGHT in a closed-fist straight punch, other visible fist guards waist. Forward foot planted, torso leaning forward, sleeves pulled back so wrists and hands remain visible. No swords.
- 少侠受击：RECOILING FROM A HIT COMING FROM THE RIGHT. Body leaning BACK toward left, eyes partly shut in a non-graphic wince, both hands guarding chest and abdomen. Rear foot slides left, hair and robe sweep forward.
- 武师出拳：STRAIGHT PUNCH. Front arm extends right in a closed-fist strike at chest height, other fist guarding waist. Wide planted stance, front knee bent. Preserve beard, red ribbon, ochre robe, bronze buckle and sash.
- 武师掌法：MOUNTAIN-PUSH PALM STRIKE. Front arm extends RIGHT with an upright OPEN PALM, five readable fingers together pointing up. Other open hand near chest, deep grounded stance. Clearly different from fist punch. NO magic effects; game adds those.
- 武师受击：RECEIVING A HIT FROM THE RIGHT. Torso rocks backward left, eyes closed and brow furrowed in a sparring wince. Both hands braced in front of ribs, both boots visible.

## 接入与限制

sprites.js 按动作进度选择关键姿态，sprite-data.js 对齐脚底。Canvas 绘制位移、拳风、气浪和飘字；伤害仍在 combat-rules.js 的命中时刻结算。

这是关键姿态切换加位移，尚非连续逐帧动画；不同帧之间有少量衣纹或发丝变化。PNG 未拆分为换装图层；游戏现在只保留国风 Q 版，旧的样式与换装试作入口已移除。
