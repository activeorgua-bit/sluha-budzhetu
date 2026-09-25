"""One-off: apply the 1.5x world scale (32 px -> 48 px tiles) to the game code. Kept for the record."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def sub(path, pairs):
    p = ROOT / path
    s = p.read_text(encoding='utf-8')
    o = s
    for a, b in pairs:
        if a not in s:
            print('  !! not found in', path, ':', a[:70])
            continue
        s = s.replace(a, b)
    p.write_text(s, encoding='utf-8')
    print('edited', path, s != o)


sub('src/config/constants.js', [
    ("export const TILE = 32;", "export const TILE = 48;\nexport const S = TILE / 32;     // world scale relative to the original 32 px grid"),
    ("export const FRAME = 64;        // character frame height", "export const FRAME = 96;        // character frame height"),
    ("export const BASELINE = 60;     // feet row inside a character frame (origin y = 60/64)",
     "export const BASELINE = 90;     // feet row inside a character frame (origin y = 90/96)"),
    ("export const MAP_ROWS = 18;     // 576 px tall maps (one row below the screen for pits)",
     "export const MAP_ROWS = 18;     // 864 px tall maps; the camera hides the last row"),
])
sub('src/config/balance.js', [
    ("speed: 260, accel: 1600, drag: 1400, gravity: 980,\n    jump: -490, jumpCut: -150, terminal: 750,",
     "speed: 390, accel: 2400, drag: 2100, gravity: 1470,\n    jump: -735, jumpCut: -225, terminal: 1125,"),
    ("invulnSec: 2.0, stunSec: 1.2, knockback: 220,\n    hitbox: { w: 28, h: 52, ox: 18, oy: 8 }, // inside the 64x64 frame, feet at y=60",
     "invulnSec: 2.0, stunSec: 1.2, knockback: 330,\n    hitbox: { w: 42, h: 78, ox: 27, oy: 12 }, // inside the 96x96 frame, feet at y=90"),
    ("cashSpeed: 380, cashGravity: 450,", "cashSpeed: 570, cashGravity: 675,"),
    ("blackPRSpeed: 420,", "blackPRSpeed: 630,"),
    ("journalist: { speed: 70, los: 220, losTier1: 260, losHeight: 60,",
     "journalist: { speed: 105, los: 330, losTier1: 390, losHeight: 90,"),
    ("detective:  { speedBase: 110, speedPerHeat: 0.6, chaseRange: 560,",
     "detective:  { speedBase: 165, speedPerHeat: 0.9, chaseRange: 840,"),
    ("warrantMin: 90, warrantMax: 420, warrantSpeed: 300,", "warrantMin: 135, warrantMax: 630, warrantSpeed: 450,"),
    ("cop:        { speed: 60 },", "cop:        { speed: 90 },"),
    ("voter:      { speed: 80, hostileTier: 2, throwEverySec: 2.4, jarSpeed: 260, jarGravity: 500, range: 360 },",
     "voter:      { speed: 120, hostileTier: 2, throwEverySec: 2.4, jarSpeed: 390, jarGravity: 750, range: 540 },"),
    ("dropEverySec: 6, dropRange: 200 },", "dropEverySec: 6, dropRange: 300 },"),
    ("offscreenMargin: 80,", "offscreenMargin: 120,"),
    ("shakeAmp: 2, fallSpeed: 420,", "shakeAmp: 3, fallSpeed: 630,"),
    ("dropSpeed: 520, holdMs: 350, retractSpeed: 160, triggerH: 200 },",
     "dropSpeed: 780, holdMs: 350, retractSpeed: 240, triggerH: 300 },"),
])
sub('src/main.js', [("tileBias: 32,", "tileBias: 48,")])
sub('src/entities/enemies/Enemy.js', [
    ("this.hb = opts.hitbox || { w: 28, h: 52, oy: 8 };", "this.hb = opts.hitbox || { w: 42, h: 78, oy: 12 };"),
    ("this.baseSpeed = opts.speed || 60;", "this.baseSpeed = opts.speed || 90;"),
    ("this.patrolMin = opts.patrolMin ?? x - 160;\n    this.patrolMax = opts.patrolMax ?? x + 160;",
     "this.patrolMin = opts.patrolMin ?? x - 240;\n    this.patrolMax = opts.patrolMax ?? x + 240;"),
    ("this.label = this.scene.add.text(this.x, this.y - 70,", "this.label = this.scene.add.text(this.x, this.y - 104,"),
    ("this.bubble.setPosition(this.x, this.y - 74);", "this.bubble.setPosition(this.x, this.y - 110);"),
    ("if (this.label) this.label.setPosition(this.x, this.y - 66);", "if (this.label) this.label.setPosition(this.x, this.y - 100);"),
    ("const probeX = this.x + this.dir * (this.hb.w / 2 + 6);\n    const probeY = this.y + 6;",
     "const probeX = this.x + this.dir * (this.hb.w / 2 + 9);\n    const probeY = this.y + 9;"),
    ("this.bubble = this.scene.add.text(this.x, this.y - 74, t(key), textStyle(6,",
     "this.bubble = this.scene.add.text(this.x, this.y - 110, t(key), textStyle(8,"),
])
sub('src/entities/enemies/Detective.js', [
    ("if (Math.abs(dx) > 24) this.body.setVelocityX", "if (Math.abs(dx) > 36) this.body.setVelocityX"),
    ("this.body.setVelocityY(-430);", "this.body.setVelocityY(-650);"),
    ("if (this.onGround && this.ledgeAhead() && Math.abs(dx) > 64) this.body.setVelocityY(-400);",
     "if (this.onGround && this.ledgeAhead() && Math.abs(dx) > 96) this.body.setVelocityY(-600);"),
    ("this.scene.projectiles.throwWarrant(this.x + this.dir * 16, this.y - 40, this.dir);",
     "this.scene.projectiles.throwWarrant(this.x + this.dir * 24, this.y - 60, this.dir);"),
    ("this.body.setVelocityY(-380);", "this.body.setVelocityY(-570);"),
])
sub('src/entities/enemies/Journalist.js', [("Math.abs(dx) < 90)", "Math.abs(dx) < 135)")])
sub('src/core/BribeSystem.js', [
    ("this.scene.projectiles.throwCash(player.x + player.facing * 20, player.y - 40, player.facing);",
     "this.scene.projectiles.throwCash(player.x + player.facing * 30, player.y - 60, player.facing);"),
    ("this.scene.projectiles.throwPR(player.x + player.facing * 20, player.y - 44, player.facing);",
     "this.scene.projectiles.throwPR(player.x + player.facing * 30, player.y - 66, player.facing);"),
])
sub('src/entities/Player.js', [
    ("this.body.setVelocity(dir * p.knockback, -260);", "this.body.setVelocity(dir * p.knockback, -390);"),
    ("this.body.setVelocity(0, -380);", "this.body.setVelocity(0, -570);"),
])
sub('src/entities/items/Pickups.js', [
    ("this.body.setSize(22, 22).setOffset(5, 5);",
     "this.body.setSize(34, 34).setOffset((this.width - 34) / 2, (this.height - 34) / 2);"),
    ("this.body.setVelocity(Phaser.Math.Between(-60, 60), -220);", "this.body.setVelocity(Phaser.Math.Between(-90, 90), -330);"),
    ("this.bob = scene.tweens.add({ targets: this, y: y - 4,", "this.bob = scene.tweens.add({ targets: this, y: y - 6,"),
    ("scene.tweens.add({ targets: this, y: this.y - 24, alpha: 0,", "scene.tweens.add({ targets: this, y: this.y - 36, alpha: 0,"),
    ("scene.tweens.add({ targets: this, y: this.y - 8, duration: 80, yoyo: true });\n    if (scene.textures.get('props').has('metal_block')) this.setFrame('metal_block');",
     "scene.tweens.add({ targets: this, y: this.y - 12, duration: 80, yoyo: true });\n    const used = scene.textures.get('props').has('question_used') ? 'question_used' : 'metal_block';\n    if (scene.textures.get('props').has(used)) this.setFrame(used);"),
    ("const coin = scene.spawnPickup('question_block', this.x, this.y - 40, { falling: true });\n    coin.body.setVelocity(0, -300);",
     "const coin = scene.spawnPickup('question_block', this.x, this.y - 60, { falling: true });\n    coin.body.setVelocity(0, -450);"),
])
sub('src/entities/enemies/Others.js', [
    ("if (!this.saidCalm && this.distanceToPlayer() < 220)", "if (!this.saidCalm && this.distanceToPlayer() < 330)"),
    ("if (Math.abs(dx) > 40) this.body.setVelocityX", "if (Math.abs(dx) > 60) this.body.setVelocityX"),
    ("if (now >= this.nextThrowAt && Math.abs(dx) > 60) {", "if (now >= this.nextThrowAt && Math.abs(dx) > 90) {"),
    ("this.scene.projectiles.throwJar(this.x + this.dir * 14, this.y - 44, this.dir);",
     "this.scene.projectiles.throwJar(this.x + this.dir * 21, this.y - 66, this.dir);"),
    ("this.scene.spawnPickup('money_bag', this.x + this.dir * 48, this.y - 8, { falling: true });",
     "this.scene.spawnPickup('money_bag', this.x + this.dir * 72, this.y - 12, { falling: true });"),
    ("x: this.x + 40 * (this.player.x < this.x ? 1 : -1), duration: 400",
     "x: this.x + 60 * (this.player.x < this.x ? 1 : -1), duration: 400"),
    ("if (this.distanceToPlayer() < 120 && !this.demanded)", "if (this.distanceToPlayer() < 180 && !this.demanded)"),
    ("this.scene.tweens.add({ targets: this, x: this.x + 48, duration: 500 });",
     "this.scene.tweens.add({ targets: this, x: this.x + 72, duration: 500 });"),
])
sub('src/entities/world/Platforms.js', [
    ("this.speed = vertical ? 60 : 80;", "this.speed = vertical ? 90 : 120;"),
    ("this.zone = scene.add.zone(this.x, this.y + this.height, 44, depth * TILE + 40).setOrigin(0.5, 0);",
     "this.zone = scene.add.zone(this.x, this.y + this.height, 66, depth * TILE + 60).setOrigin(0.5, 0);"),
    ("this.body.setSize(40, 40).setOffset((this.width - 40) / 2, this.height - 42);",
     "this.body.setSize(60, 60).setOffset((this.width - 60) / 2, this.height - 63);"),
    ("if (vertical) this.body.setSize(this.width, 18).setOffset(0, this.height - 18);\n    else this.body.setSize(this.width, 14).setOffset(0, this.height - 16);",
     "if (vertical) this.body.setSize(this.width, 27).setOffset(0, this.height - 27);\n    else this.body.setSize(this.width, 21).setOffset(0, this.height - 24);"),
])
sub('src/core/SpawnDirector.js', [
    ("const x = Math.min(this.scene.widthPx - 64,", "const x = Math.min(this.scene.widthPx - 96,"),
    ("const sx = best ? best.col * TILE + TILE / 2 : Math.min(this.scene.widthPx - 64, x + (ahead ? 260 : 120));",
     "const sx = best ? best.col * TILE + TILE / 2 : Math.min(this.scene.widthPx - 96, x + (ahead ? 390 : 180));"),
    ("if (d < bestD && d < 900)", "if (d < bestD && d < 1350)"),
    ("const y = this.groundBelow(x, player.y - 200) ?? player.y;", "const y = this.groundBelow(x, player.y - 300) ?? player.y;"),
    ("const sy = best ? (best.row + 1) * TILE : (this.groundBelow(sx, y - 200) ?? y);",
     "const sy = best ? (best.row + 1) * TILE : (this.groundBelow(sx, y - 300) ?? y);"),
])
sub('src/levels/LevelBuilder.js', [
    ("if (isSpike) out.push({ kind: 'spike', x: x * TILE + 4, y: y * TILE + 12, w: len * TILE - 8, h: TILE - 12 });\n      else out.push({ kind: 'water', x: x * TILE, y: y * TILE + 10, w: len * TILE, h: TILE - 10 });",
     "if (isSpike) out.push({ kind: 'spike', x: x * TILE + 6, y: y * TILE + 18, w: len * TILE - 12, h: TILE - 18 });\n      else out.push({ kind: 'water', x: x * TILE, y: y * TILE + 15, w: len * TILE, h: TILE - 15 });"),
])
sub('src/entities/projectiles/Projectiles.js', [
    ("p.body.setSize(20, 20);", "p.body.setSize(30, 30);"),
    ("p.body.setVelocity(dir * BALANCE.bribe.cashSpeed, -160);", "p.body.setVelocity(dir * BALANCE.bribe.cashSpeed, -240);"),
    ("p.body.setVelocity(dir * BALANCE.enemies.detective.warrantSpeed, -120);\n    p.body.setGravityY(300 - BALANCE.player.gravity);",
     "p.body.setVelocity(dir * BALANCE.enemies.detective.warrantSpeed, -180);\n    p.body.setGravityY(450 - BALANCE.player.gravity);"),
    ("p.body.setVelocity(dir * v.jarSpeed, -240);", "p.body.setVelocity(dir * v.jarSpeed, -360);"),
    ("const r = this.scene.add.rectangle(x, y, 4, 4, color)", "const r = this.scene.add.rectangle(x, y, 6, 6, color)"),
    ("targets: r, x: x + Phaser.Math.Between(-40, 40), y: y + Phaser.Math.Between(-50, 10),",
     "targets: r, x: x + Phaser.Math.Between(-60, 60), y: y + Phaser.Math.Between(-75, 15),"),
])
sub('src/scenes/Level.js', [
    ("if (!spawn) spawn = { x: 64, y: 14 * TILE };", "if (!spawn) spawn = { x: 2 * TILE, y: 14 * TILE };"),
    ("cam.setDeadzone(120, 60);", "cam.setDeadzone(180, 90);"),
    ("Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < 70)",
     "Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y) < 105)"),
])
