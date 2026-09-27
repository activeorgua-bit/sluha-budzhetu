import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config/constants.js';
import { GameState } from '../core/GameState.js';
import { Save } from '../core/Save.js';
import { STORY } from '../config/levels.js';
import { t, textStyle } from '../core/i18n.js';
import { audio } from '../core/Audio.js';
import { BALANCE } from '../config/balance.js';

/**
 * The finale after the railway station. First the moral choice: West (leave) or East (the front).
 *   East -> heat below frontCaseHeat (or clean): front_serve; otherwise front_case (NABU at the front).
 *   West:
 *   the train breaks down in the fields with a chance growing with heat (0 up to heat 35, ~36 % at 55,
 *        ~73 % at 75, at most 92 %) -> 50% NABU (train_nabu) / 50% a Shahed hits your compartment (train_karma)
 *   otherwise -> the train reaches Europe -> choose a country (interactive):
 *        clean run -> honest (holiday, then re-election, whatever the country)
 *        Austria   -> 85% austria_happy / 15% austria_mafia (50/50 if you took the mafia's money)
 *        elsewhere -> 65% extradited / 35% abroad_happy
 * Every ending closes with the same ironic moral: corruption always has consequences.
 * data: { phase: 'start' | 'choose' | 'result', forced?: ending }
 */
const COLORS = {
  honest: '#7ddf7d', front_serve: '#7ddf7d', front_case: '#f2c14e', austria_happy: '#f2c14e', abroad_happy: '#f2c14e', escape: '#f2c14e',
  austria_mafia: '#ff6b6b', extradited: '#ff6b6b', train_nabu: '#ff6b6b', train_karma: '#ff6b6b',
  arrest: '#ff6b6b', gameover: '#ff6b6b',
};
const COUNTRIES = ['austria', 'poland', 'spain', 'portugal'];

export class FinaleScene extends Phaser.Scene {
  constructor() { super('Finale'); }

  init(data) {
    this.forced = data.forced;
    this.phase = data.phase || 'start';
  }

  create() {
    this.cameras.main.setBackgroundColor('#05060a');
    if (this.phase === 'start') return this.start();
    if (this.phase === 'choose') return this.choose();
    return this.result();
  }

  play(cards, title, next) {
    this.scene.start('Story', { cards, title, next });
  }

  start() {
    if (this.forced) return this.finish(this.forced);
    if (GameState.ending) return this.finish(GameState.ending);           // arrest / game over set elsewhere
    // the moral choice: the train West (leave the country) or the train East (to the front)
    if (this.textures.exists('story_front_enlist')) {
      this.add.image(GAME_W / 2, GAME_H / 2, 'story_front_enlist').setAlpha(0.3).setDisplaySize(GAME_W, GAME_H);
    }
    this.scene.launch('Choice', {
      titleKey: 'choice_moral_title', textKey: 'choice_moral_text', from: 'Finale',
      options: [{ labelKey: 'choice_moral_west', value: 'west' }, { labelKey: 'choice_moral_east', value: 'east' }],
      onPick: (v) => { GameState.moralChoice = v; if (v === 'east') this.front(); else this.west(); },
    });
    this.scene.bringToTop('Choice');
    this.scene.pause();
  }

  /** To the front: a decent politician serves; a corrupt one is found by NABU — the case waits for the war to end. */
  front() {
    const clean = GameState.cleanRun || GameState.heat < BALANCE.world3.frontCaseHeat;
    this.finish(clean ? 'front_serve' : 'front_case');
  }

  west() {
    const rng = Math.random();
    // the more heat, the likelier the train never reaches the border (never certain: a slim chance)
    const w = BALANCE.world3;
    const pBreak = GameState.cleanRun ? 0 : Phaser.Math.Clamp((GameState.heat - w.breakdownFromHeat) / w.breakdownSpan, 0, w.breakdownMax);
    if (Math.random() < pBreak) {
      return this.finish(rng < 0.5 ? 'train_nabu' : 'train_karma');
    }
    this.play(STORY.europe, t('cut_europe'), { scene: 'Finale', data: { phase: 'choose' } });
  }

  choose() {
    if (this.textures.exists('story_europe')) {
      this.add.image(GAME_W / 2, GAME_H / 2, 'story_europe').setAlpha(0.35).setDisplaySize(GAME_W, GAME_H);
    }
    this.scene.launch('Choice', {
      titleKey: 'choice_country_title', textKey: 'choice_country_text', from: 'Finale',
      options: COUNTRIES.map((c) => ({ labelKey: `country_${c}`, value: c })),
      onPick: (country) => {
        GameState.country = country;
        const r = Math.random();
        let ending;
        if (GameState.cleanRun) ending = 'honest';
        // Austria is quiet, unless you owe the mafia: then they find you there half the time
        else if (country === 'austria') ending = r < (GameState.mafiaChoice === 'yes' ? 0.5 : 0.85) ? 'austria_happy' : 'austria_mafia';
        else ending = r < 0.65 ? 'extradited' : 'abroad_happy';
        this.finish(ending);
      },
    });
    this.scene.bringToTop('Choice');
    this.scene.pause();
  }

  finish(ending) {
    GameState.ending = ending;
    if (ending === 'honest') audio.playVictoryHonest();
    else if (/happy|escape/.test(ending)) audio.playVictoryCorrupt();
    this.play([...(STORY[ending] || STORY.gameover), ...STORY.epilogue], t('ending_' + ending), { scene: 'Finale', data: { phase: 'result' } });
  }

  result() {
    const ending = GameState.ending || 'gameover';
    const res = {
      ending, score: GameState.score, corruption: GameState.corruption, heat: GameState.heat,
      time: Object.values(GameState.levelStats).reduce((a, s) => a + (s.time || 0), 0),
    };
    const isBest = Save.recordResult(res);
    if (this.textures.exists('story_epilogue')) {
      this.add.image(GAME_W / 2, GAME_H / 2, 'story_epilogue').setDisplaySize(GAME_W, GAME_H).setAlpha(0.22);
    }
    const color = COLORS[ending] || '#ffffff';
    this.add.text(GAME_W / 2, 90, t('ending_' + ending), textStyle(22, color, { stroke: '#000', strokeThickness: 6, align: 'center', wordWrap: { width: 900 } })).setOrigin(0.5);
    const tex = this.textures.get('chars');
    const dead = /karma|mafia|gameover/.test(ending);
    let frame = /nabu|arrest|extradited|front_case/.test(ending) ? 'detective_idle' : (GameState.jacketless ? 'mpshirt_idle' : 'politician_idle');
    const deadFrame = GameState.jacketless ? 'mpshirt_dead_top' : 'politician_dead_top';
    if (!tex.has(frame)) frame = 'politician_idle';
    // feet on y=252, well above the score lines at 290; a dead politician lies "wasted", top-down like old GTA
    if (dead && this.textures.get('props').has(deadFrame)) this.add.image(GAME_W / 2, 256, 'props', deadFrame).setOrigin(0.5, 1).setScale(1.2);
    else this.add.image(GAME_W / 2, 252, 'chars', frame).setOrigin(0.5, 1).setScale(1.4);
    const lines = [
      `${t('result_score')}: ${GameState.score}`,
      `${t('result_corruption')}: ${GameState.corruption}   ${t('hud_heat')}: ${GameState.heat}%`,
      isBest ? '★ NEW BEST ★' : '',
    ];
    this.add.text(GAME_W / 2, 290, lines.join('\n'), textStyle(10, '#fff', { align: 'center', lineSpacing: 8 })).setOrigin(0.5);
    // the moral: for every ending, honest or not
    const moralKey = ending === 'honest' ? 'end_moral_honest' : (ending === 'front_serve' ? 'end_moral_front' : 'end_moral');
    this.add.text(GAME_W / 2, 390, t(moralKey), textStyle(9, '#f2c14e', { align: 'center', wordWrap: { width: 820 }, lineSpacing: 8, fontStyle: 'italic' })).setOrigin(0.5);
    this.add.text(GAME_W / 2, 480, t('play_again'), textStyle(10, '#9fd1ff')).setOrigin(0.5);
    const back = () => this.scene.start('Menu');
    this.time.delayedCall(800, () => {
      this.input.keyboard.on('keydown-ENTER', back);
      this.input.keyboard.on('keydown-SPACE', back);
      this.input.on('pointerdown', back);
    });
  }
}
