// Every tunable number of the game lives here. See docs/GAME_DESIGN.md §Balance.
export const BALANCE = {
  // Corruption value of each pickup (adds to wallet AND to permanent corruption).
  pickups: { coin: 1, money_bag: 10, question_block: 3, mafia_bribe: 60, theft: 6 },   // theft: a metro busker's / flower seller's takings
  score: {
    coin: 100, money_bag: 1000, question_block: 300,
    honestLevelBonus: 5000,   // per level finished with zero pickups on a clean run
    timeBonusPerSec: 10,      // remaining seconds × this at level end
    levelClear: 1000,
  },

  // heat = clamp(corruption·perCorruption + failedBribes·perFailedBribe + traps·perTrap, 0, max)
  heat: { perCorruption: 0.6, perFailedBribe: 3, perTrap: 8, max: 100 },
  tiers: [
    { id: 0, key: 'clean', min: 0, max: 0 },
    { id: 1, key: 'suspicious', min: 1, max: 24 },
    { id: 2, key: 'investigated', min: 25, max: 54 },
    { id: 3, key: 'wanted', min: 55, max: 79 },
    { id: 4, key: 'raid', min: 80, max: 100 },
  ],

  player: {
    speed: 390, accel: 2400, drag: 2100, gravity: 1470,
    jump: -735, jumpCut: -225, terminal: 1125,
    coyoteMs: 90, jumpBufferMs: 110,
    greedSpeedMax: 0.22, greedJumpMax: 0.11, greedWalletRef: 50, // penalty grows with wallet
    invulnSec: 2.0, stunSec: 1.2, knockback: 330,
    hitbox: { w: 42, h: 78, ox: 27, oy: 12 }, // inside the 96x96 frame, feet at y=90
  },

  bribe: {
    cop:        { odds: 1.00, cost: 1 },
    journalist: { odds: 0.22, cost: 3 },
    journalist_f: { odds: 0.10, cost: 3 },   // the female reporter is much harder to buy
    voter:      { odds: 0.18, cost: 2 },
    detective:  { odds: 0.22, cost: 5 },
    oldlady:    { odds: 0.45, cost: 2 },   // a pension top-up
    kid:        { odds: 0.70, cost: 1 },   // pocket money
    oppmp:      { odds: 0.30, cost: 4 },
    seatedmp:   { odds: 0.60, cost: 2 },
    bandit:     { odds: 0.80, cost: 3 },
    gopnik:     { odds: 0.85, cost: 1 },   // "for a beer"
    citizen:    { odds: 0.35, cost: 2 },
    dog:        { odds: 0.00, cost: 1 },
    dogwalker:  { odds: 0.50, cost: 1 },
    passenger:  { odds: 0.55, cost: 1 },   // "for the fare"
    worker:     { odds: 0.40, cost: 2 },   // metro staff
    mcop:       { odds: 0.80, cost: 3 },
    gopboss:    { odds: 1.00, cost: 8 },
    assistant:  { odds: 1.00, cost: 1 },
    animator:   { odds: 1.00, cost: 6 },   // a photo with the mascot: pay and he dances off
    ratboss:    { odds: 1.00, cost: 3 },
    speaker:    { odds: 0.50, cost: 25 },  // the corrupt way past the final boss
    guard:      { odds: 1.00, costBase: 5, costPerHeat: 0.25 }, // cost = 5 + ceil(heat/4)
    failOddsMult: 0.75,      // odds × this per failed attempt on the same enemy
    enragedSec: 3, enragedSpeedMult: 1.3,
    cashSpeed: 570, cashGravity: 675,
  },

  enemies: {
    journalist: { speed: 105, los: 330, losTier1: 390, losHeight: 90, flashCooldownSec: 3.0, flashWindupSec: 0.45 },
    detective:  { speedBase: 165, speedPerHeat: 0.9, chaseRange: 840, warrantBaseSec: 3.6, warrantPerHeat: 0.012, warrantMinSec: 1.8,
                  warrantMin: 135, warrantMax: 630, warrantSpeed: 450, emergeSec: 0.8 },
    cop:        { speed: 90 },
    voter:      { speed: 120, hostileTier: 2, throwEverySec: 2.4, jarSpeed: 390, jarGravity: 750, range: 540 },
    guest:      { drinkPenaltySec: 10, dropEverySec: 6, dropRange: 300 },
    guard:      { speed: 0 },
    oldlady:    { speed: 60, strikeRange: 78, windupSec: 0.5, strikeEverySec: 1.6, aggroRange: 360 },
    kid:        { speed: 150, throwEverySec: 2.2, throwRange: 480, nutSpeed: 420, startNuts: 2 },
    rat:        { speed: 120, chaseRange: 300 },
    oppmp:      { speed: 100, throwEverySec: 2.6, throwRange: 520, chocoSpeed: 440 },
    seatedmp:   { throwEverySec: 3.4, throwRange: 620, nutSpeed: 380 },
    assistant:  { speed: 70 },
    bandit:     { speed: 110, aggroRange: 420, punchEverySec: 1.1, friendlyHeat: 25, friendlyWallet: 15 },
    citizen:    { speed: 70, throwRange: 480, throwEverySec: 2.4, eggSpeed: 420, hostileTier: 2 },
    dog:        { speed: 230, chaseRange: 360 },
    // Kyiv metro: passengers are hostile from hostileHeat on; an honest MP is mostly ignored
    passenger:  { speed: 85, speedOld: 55, hostileHeat: 12, aggroRange: 380, shoveEverySec: 1.4,
                  autographChance: 0.1, moneyChance: 0.08, autographScore: 250 },
    mcop:       { speed: 95, chaseRange: 460, grabEverySec: 1.3 },
  },

  // World 3: the mafia fight (after refusing the offer) ends with a knock-out after this many hits;
  // taxi and train cost bribes (a clean politician pays with his official salary).
  // frontCaseHeat: from this heat NABU finds you at the front (the case waits for the end of the war)
  // salaryMaxTier: up to this heat tier the MP salary covers the taxi and the ticket when the wallet is short
  world3: { salaryMaxTier: 1, frontCaseHeat: 25, mafiaKnockoutHits: 3, taxiPrice: 3, ticketPrice: 5, salary: 5, trainBreakdownHeat: 55,
             breakdownFromHeat: 35, breakdownSpan: 55, breakdownMax: 0.92 },

  // Reputation: the politician's health. Hits cost reputation (by source); at 0 a life is lost and it
  // refills on respawn. It slowly recovers after a quiet spell. Karma: a corrupt reputation is more
  // fragile (damage x (1 + heat/100 * corruptDamage)) and recovers slower.
  reputation: {
    max: 100, regenPerSec: 3, regenDelaySec: 4, regenCap: 70, checkpointBonus: 30, corruptDamage: 0.6, corruptRegen: 0.6,
    damage: {
      default: 9, hit: 9, flash: 7,
      cop: 7, journalist: 7, detective: 10, warrant: 12, voter: 8, jar: 8,
      oldlady: 8, kid: 5, chestnut: 5, rat: 4, oppmp: 8, chocolate: 7, seatedmp: 7, assistant: 4,
      passenger: 7, mcop: 12,
      bandit: 12, gopnik: 7, bottle: 5, citizen: 7, egg: 6, dog: 9, dogwalker: 4,
      hook: 27, debris: 27, shockwave: 6, papers: 4, note: 5,
      animator: 11, ratboss: 8, speaker: 9, gopboss: 9, mafia: 0, mafioso: 0,
    },
  },

  // Chestnuts: the honest weapon. Free ammo from shaken trees and park ground; stuns, never corrupts.
  // 'Kapital' books (bunker) are heavier and stun longer. Bosses take damage instead of stunning.
  nuts: {
    start: 0, max: 30,
    chestnutStunSec: 2.2, bookStunSec: 3.4,
    speed: 600, gravity: 900, lift: -210, cooldownMs: 260,
    chestnutDamage: 1, bookDamage: 2,
    treeDrops: [3, 4], treeShakes: 3, treeCooldownSec: 1.2, treeRange: 110,
    kidPickupRange: 260,
  },

  // Conscience: the inner judge. Bribes and bad deeds raise it; at 100 it paralyses you (remorse).
  // Alcohol silences it, at a price: slower legs and wobbly throws. An honest run never needs a drink.
  conscience: {
    max: 100, decayPerSec: 0.5,
    gain: { theft: 45, coin: 5, question_block: 8, money_bag: 25, trap: 10, bribe_ok: 12, bribe_fail: 6,
            stun_civilian: 6, stun_press: 3 },
    freezeSec: 2.6, afterFreeze: 65, freezeCooldownSec: 8, warnAt: 75,
  },
  alcohol: {
    whiskey: { conscience: 45, drunkSec: 18, speedMult: 0.82, spread: 0.25, sway: 0.008, price: 3 },
    vodka:   { conscience: 80, drunkSec: 28, speedMult: 0.66, spread: 0.45, sway: 0.016, stumbleEverySec: 2.2 },
    shopRange: 110,
  },

  bosses: {
    animator: { hp: 8, speed: 150, dashSpeed: 520, dashEverySec: 3.2, jumpEverySec: 5.5, bribeCost: 6, bribeOdds: 1.0 },
    ratboss:  { hp: 6, speed: 110, noteEverySec: 2.0, noteSpeed: 330, jumpEverySec: 4.0 },
    mafia:    { hp: 18, speed: 110, stompEverySec: 3.2, shockSpeed: 380 },
    gopboss:  { hp: 8, speed: 140, throwEverySec: 2.6 },
    speaker:  { hp: 14, speed: 120, slamEverySec: 3.6, paperEverySec: 2.4, shockSpeed: 420, chargeSpeed: 430,
                bribeCost: 25, bribeOdds: 0.5, phase2At: 0.5 },
    invulnMs: 450,
  },

  spawn: {
    journalistPressureSec: { 2: 25, 3: 18, 4: 14 },
    journalistCap:         { 1: 1, 2: 2, 3: 3, 4: 4 },
    detectivePressureSec:  { 3: 30, 4: 22 },
    detectiveCap:          { 2: 1, 3: 2, 4: 3 },
    trapCoinRatio: 0.05, trapMaxPerLevel: 3, trapMinLevelIndex: 1, trapEmergeDelaySec: 1.5,
    partyRaidSec: 20, partyRaidTier: 3, subwayQuietSec: 60,
    checkpointAmbushTier: 4,
    offscreenMargin: 120,
  },

  // per 3-tile bridge segment: 2.6 s clean, ~1.6 s at 20 corruption, 0.75 s from ~37 (run, don't stop)
  // luckyChance: per attempt, the contractor happened to use real rebar: bridges hold at least luckyMin s
  collapse: { luckyChance: 0.15, luckyMin: 1.3, base: 2.6, perCorruption: 0.05, min: 0.75, segment: 3, shakeAmp: 3, fallSpeed: 630,
              weakPlatformTier: 2 },

  hook: { swayDeg: 6, swayMs: 1600, dropSpeed: 780, holdMs: 350, retractSpeed: 240, triggerH: 300 },

  lives: { start: 3, max: 6, extraEveryScore: 30000, kitInBlockChance: 0.15 },   // + a hidden first-aid kit in every level
  finale: { escapeMaxHeat: 55 },
};

export function tierFor(heat) {
  for (const t of BALANCE.tiers) if (heat >= t.min && heat <= t.max) return t;
  return BALANCE.tiers[BALANCE.tiers.length - 1];
}

export function collapseSeconds(corruption) {
  const c = BALANCE.collapse;
  return Math.max(c.min, c.base - corruption * c.perCorruption);
}

export function guardCost(heat) {
  const g = BALANCE.bribe.guard;
  return g.costBase + Math.ceil(heat * g.costPerHeat);
}
