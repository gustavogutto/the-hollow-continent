/* Image loading + kit-sheet cell cropping. Kit sheets are NxN grids of cutouts;
 * we crop cells into offscreen canvases once at load time. */
import type { SpriteRef } from "../types";

export const URLS = {
  player: "/manus-storage/hollow_player_94b59b65.png",
  bonfire: "/manus-storage/hollow_bonfire_efe4592d.png",
  elara: "/manus-storage/hollow_elara_05ce412c.png",
  gromm: "/manus-storage/hollow_gromm_3c26a2d2.png",
  kardorim: "/manus-storage/hollow_kardorim_e9bc405c.png",
  warden: "/manus-storage/hollow_warden_d6d4b096.png",
  skeleton: "/manus-storage/hollow_skeleton_abf9379b.png",
  beasts: "/manus-storage/hollow_kit_beasts_bcafc41d.png",
  skels: "/manus-storage/hollow_kit_skels_e7ca2af2.png",
  props: "/manus-storage/hollow_props_a24d92fe.png",
  icons: "/manus-storage/hollow_icons_0c869833.png",
  tileAsh: "/manus-storage/hollow_tile_ash_1c12ccd4.png",
  tileCrypt: "/manus-storage/hollow_tile_crypt_81e6aec5.png",
  menuBg: "/manus-storage/hollow_menu_bg_b494cbb4.png",
  bossBg: "/manus-storage/hollow_boss_bg_39adf290.png",
  walkSE: "/manus-storage/hollow_walk_se_3ef6953c.png",
  walkSW: "/manus-storage/hollow_walk_sw_1ab84a10.png",
  walkNE: "/manus-storage/hollow_walk_ne_d904e229.png",
  walkNW: "/manus-storage/hollow_walk_nw_9d27ca4f.png",
  // mob walk sheets (6-frame horizontal strips, SE/SW only; NE/NW fall back)
  kardorimWalkSE: "/manus-storage/hollow_kardorim_walk_se_0378fb2c.png",
  kardorimWalkSW: "/manus-storage/hollow_kardorim_walk_sw_cf58650d.png",
  wardenWalkSE: "/manus-storage/hollow_warden_walk_se_79c2452e.png",
  wardenWalkSW: "/manus-storage/hollow_warden_walk_sw_a9caee8c.png",
  skelMeleeWalkSE: "/manus-storage/hollow_skel_melee_walk_se_0ed23ef5.png",
  skelMeleeWalkSW: "/manus-storage/hollow_skel_melee_walk_sw_2ae612ec.png",
  skelArcherWalkSE: "/manus-storage/hollow_skel_archer_walk_se_e1a596ec.png",
  skelArcherWalkSW: "/manus-storage/hollow_skel_archer_walk_sw_1fef1f9c.png",
  beastWalkSE: "/manus-storage/hollow_beast_walk_se_43e20789.png",
  beastWalkSW: "/manus-storage/hollow_beast_walk_sw_02722a66.png",
  // species-specific locomotion strips (6-frame, SE/SW)
  toadHopSE: "/manus-storage/hollow_toad_hop_se_final_1467b0c7.png",
  toadHopSW: "/manus-storage/hollow_toad_hop_sw_final_86c8c46a.png",
  flyFlapSE: "/manus-storage/hollow_fly_flap_se_final_7c704c44.png",
  flyFlapSW: "/manus-storage/hollow_fly_flap_sw_final_812d1488.png",
  gargFlapSE: "/manus-storage/hollow_garg_flap_se_final_230865aa.png",
  gargFlapSW: "/manus-storage/hollow_garg_flap_sw_final_5673d3c8.png",
  // dedicated mob walk strips (mob-art audit fix)
  frailWalkSE: "/manus-storage/hollow_frail_walk_se_final_02d39c1a.png",
  frailWalkSW: "/manus-storage/hollow_frail_walk_sw_final_d5c70856.png",
  drownedWalkSE: "/manus-storage/hollow_drowned_walk_se_final_6143a0d5.png",
  drownedWalkSW: "/manus-storage/hollow_drowned_walk_sw_final_8ce01452.png",
  sunkarcherWalkSE: "/manus-storage/hollow_sunkarcher_walk_se_final_59ecaa43.png",
  sunkarcherWalkSW: "/manus-storage/hollow_sunkarcher_walk_sw_final_f57450af.png",
  priestWalkSE: "/manus-storage/hollow_priest_walk_se_final_78fe4cd1.png",
  priestWalkSW: "/manus-storage/hollow_priest_walk_sw_final_be9122f2.png",
  // attack sheets (6-frame horizontal strips)
  knightAttackSE: "/manus-storage/hollow_attack_se_38f0bdc1.png",
  knightAttackSW: "/manus-storage/hollow_attack_sw_ec052356.png",
  skelAttackSE: "/manus-storage/hollow_skel_attack_se_a7070970.png",
  skelAttackSW: "/manus-storage/hollow_skel_attack_sw_final_d3b81f2c.png",
  beastAttackSE: "/manus-storage/hollow_beast_attack_se_a1d6b299.png",
  beastAttackSW: "/manus-storage/hollow_beast_attack_sw_final_918ee39b.png",
  // species attack strips (6-frame, SE/SW) — processed *_final versions
  toadAttackSE: "/manus-storage/hollow_toad_attack_se_final_c0923bab.png",
  toadAttackSW: "/manus-storage/hollow_toad_attack_sw_final_0ca10fa5.png",
  boarAttackSE: "/manus-storage/hollow_boar_attack_se_v2_37f7ceef.png",
  boarAttackSW: "/manus-storage/hollow_boar_attack_sw_v2_fc63c82d.png",
  gargAttackSE: "/manus-storage/hollow_garg_attack_se_final_f9ebb9d3.png",
  gargAttackSW: "/manus-storage/hollow_garg_attack_sw_final_3227a1cc.png",
  frailAttackSE: "/manus-storage/hollow_frail_attack_se_final_46471e44.png",
  frailAttackSW: "/manus-storage/hollow_frail_attack_sw_final_e835669e.png",
  drownedAttackSE: "/manus-storage/hollow_drowned_attack_se_final_4b255c35.png",
  drownedAttackSW: "/manus-storage/hollow_drowned_attack_sw_final_9889b695.png",
  sunkarcherAttackSE: "/manus-storage/hollow_sunkarcher_attack_se_final_e23101fc.png",
  sunkarcherAttackSW: "/manus-storage/hollow_sunkarcher_attack_sw_final_2630ff89.png",
  priestAttackSE: "/manus-storage/hollow_priest_attack_se_final_1d10b546.png",
  priestAttackSW: "/manus-storage/hollow_priest_attack_sw_final_3fc25e1b.png",
  // idle breathing strips (6-frame, SE/SW)
  frailIdleSE: "/manus-storage/hollow_frail_idle_se_final_a279da99.png",
  frailIdleSW: "/manus-storage/hollow_frail_idle_sw_final_48412c92.png",
  drownedIdleSE: "/manus-storage/hollow_drowned_idle_se_final_59e4c5de.png",
  drownedIdleSW: "/manus-storage/hollow_drowned_idle_sw_final_857b171e.png",
  // new mobs: ash mage + hollow archer
  mageWalkSE: "/manus-storage/hollow_mage_walk_se_final_cdd636db.png",
  mageWalkSW: "/manus-storage/hollow_mage_walk_sw_final_904f789f.png",
  mageAttackSE: "/manus-storage/hollow_mage_attack_se_final_75fefe9f.png",
  mageAttackSW: "/manus-storage/hollow_mage_attack_sw_final_61807914.png",
  archerWalkSE: "/manus-storage/hollow_archer_walk_se_final_61d6966e.png",
  archerWalkSW: "/manus-storage/hollow_archer_walk_sw_final_e2f384e9.png",
  archerAttackSE: "/manus-storage/hollow_archer_attack_se_final_6459bdcf.png",
  archerAttackSW: "/manus-storage/hollow_archer_attack_sw_final_01775404.png",
  mageIdle: "/manus-storage/hollow_mage_idle_final_1bc02b68.png",
  archerIdle: "/manus-storage/hollow_archer_idle_final_34f15aa0.png",
  // playable classes: Ashbound Scholar (mage) + Hollow Ranger (archer)
  // p10 — uniform regenerated sets (single-session, consistent character refs + facing-checked)
  pcMageIdle: "/manus-storage/p10_mage_idle_final_fa8ec538.png",
  pcMageWalkSE: "/manus-storage/p10_mage_walk_se_final_b1b6e03e.png",
  pcMageWalkSW: "/manus-storage/p10_mage_walk_sw_final_5efbc1f5.png",
  pcMageWalkNE: "/manus-storage/p10_mage_walk_ne_final_4d5d00e9.png",
  pcMageWalkNW: "/manus-storage/p10_mage_walk_nw_final_92837b4a.png",
  pcMageAttackSE: "/manus-storage/p10_mage_attack_se_final_af29aa19.png",
  pcMageAttackSW: "/manus-storage/p10_mage_attack_sw_final_feedf11d.png",
  pcArcherIdle: "/manus-storage/p10_archer_idle_final_d9610923.png",
  pcArcherWalkSE: "/manus-storage/p10_archer_walk_se_final_02b13745.png",
  pcArcherWalkSW: "/manus-storage/p10_archer_walk_sw_final_2c9b9809.png",
  pcArcherWalkNE: "/manus-storage/p10_archer_walk_ne_final_85772602.png",
  pcArcherWalkNW: "/manus-storage/p10_archer_walk_nw_final_f9550b9a.png",
  pcArcherAttackSE: "/manus-storage/p10_archer_attack_se_final_7769607a.png",
  pcArcherAttackSW: "/manus-storage/p10_archer_attack_sw_final_28bf20c6.png",
  // zone 2 — The Sunken Reach
  tileSunken: "/manus-storage/hollow_tile_sunken_6f996750.png",
  sunkenMobs: "/manus-storage/hollow_kit_sunken_aade1197.png",
  // expansion mob kit sheets (3x3 grids) + boss statics
  cinderMobs: "/manus-storage/kit_cinder_c48c8727.png",
  marshMobs: "/manus-storage/kit_marsh2_62d52528.png",
  peaksMobs: "/manus-storage/kit_peaks_05d3e9d4.png",
  bossVulkas: "/manus-storage/boss_vulkas_4ac9d6fa.png",
  bossMorvane: "/manus-storage/boss_morvane_444489eb.png",
  bossAurelion: "/manus-storage/boss_aurelion_9e537026.png",
  drownedSentinel: "/manus-storage/hollow_sentinel_33786f0e.png",
  sunkenBg: "/manus-storage/hollow_sunken_bg_fd8473eb.png",
  // v6 directional strips — archetypes (golem, serpent, spider) + bosses (vulkas, morvane, aurelion)
  golemWalkSE: "/manus-storage/v6_golem_walk_se_final_a3faaf3b.png",
  golemWalkSW: "/manus-storage/v6_golem_walk_sw_final_15c1a8db.png",
  golemAttackSE: "/manus-storage/v6_golem_attack_se_final_6d9895d1.png",
  golemAttackSW: "/manus-storage/v6_golem_attack_sw_final_4df82104.png",
  serpentWalkSE: "/manus-storage/v6_serpent_walk_se_final_f988ac36.png",
  serpentWalkSW: "/manus-storage/v6_serpent_walk_sw_final_abb097be.png",
  serpentAttackSE: "/manus-storage/v6_serpent_attack_se_final_a9126454.png",
  serpentAttackSW: "/manus-storage/v6_serpent_attack_sw_final_a4352482.png",
  spiderWalkSE: "/manus-storage/v6_spider_walk_se_final_4b183937.png",
  spiderWalkSW: "/manus-storage/v6_spider_walk_sw_final_4233d2e4.png",
  spiderAttackSE: "/manus-storage/v6_spider_attack_se_final_0c90afc9.png",
  spiderAttackSW: "/manus-storage/v6_spider_attack_sw_final_6f077830.png",
  vulkasWalkSE: "/manus-storage/v6_vulkas_walk_se_final_27a6f437.png",
  vulkasWalkSW: "/manus-storage/v6_vulkas_walk_sw_final_a3ef3b11.png",
  vulkasAttackSE: "/manus-storage/v6_vulkas_attack_se_final_0786b546.png",
  vulkasAttackSW: "/manus-storage/v6_vulkas_attack_sw_final_3142ca19.png",
  morvaneWalkSE: "/manus-storage/v6_morvane_walk_se_final_826038a1.png",
  morvaneWalkSW: "/manus-storage/v6_morvane_walk_sw_final_530647b1.png",
  morvaneAttackSE: "/manus-storage/v6_morvane_attack_se_final_518b85f9.png",
  morvaneAttackSW: "/manus-storage/v6_morvane_attack_sw_final_691a4b82.png",
  aurelionWalkSE: "/manus-storage/v6_aurelion_walk_se_final_48231c05.png",
  aurelionWalkSW: "/manus-storage/v6_aurelion_walk_sw_final_1719f72d.png",
  aurelionAttackSE: "/manus-storage/v6_aurelion_attack_se_final_6b32d790.png",
  aurelionAttackSW: "/manus-storage/p11d_aurelion_attack_sw_final_04cd469d.png",
  // v7 boss backfill — kardorim/warden attack + drowned sentinel walk & attack
  kardorimAttackSE: "/manus-storage/v7_kardorim_attack_se_final_9497c2a0.png",
  kardorimAttackSW: "/manus-storage/v7_kardorim_attack_sw_final_d89f326b.png",
  wardenAttackSE: "/manus-storage/v7_warden_attack_se_final_ce9cca83.png",
  wardenAttackSW: "/manus-storage/v7_warden_attack_sw_final_d64e8258.png",
  sentinelWalkSE: "/manus-storage/v7_sentinel_walk_se_final_10139120.png",
  sentinelWalkSW: "/manus-storage/v7_sentinel_walk_sw_final_cfa56ace.png",
  sentinelAttackSE: "/manus-storage/v7_sentinel_attack_se_final_b8997b55.png",
  sentinelAttackSW: "/manus-storage/v7_sentinel_attack_sw_final_61fddf59.png",
  // v8 — player rear-view attack strips (true 4-dir attacks for mage/archer)
  pcMageAttackNE: "/manus-storage/p10_mage_attack_ne_final_80abf422.png",
  pcMageAttackNW: "/manus-storage/p10_mage_attack_nw_final_f9f7da22.png",
  pcArcherAttackNE: "/manus-storage/p10_archer_attack_ne_final_5eaebbdf.png",
  pcArcherAttackNW: "/manus-storage/p10_archer_attack_nw_final_e647ef33.png",
  // v8 — creature attack strips for the 12 previously lunge-only mobs
  corpseflyAttackSE: "/manus-storage/v8_corpsefly_attack_se_final_66a5f2d1.png",
  corpseflyAttackSW: "/manus-storage/v8_corpsefly_attack_sw_final_01b88cc2.png",
  dandelionAttackSE: "/manus-storage/v8_dandelion_attack_se_final_14d036b8.png",
  dandelionAttackSW: "/manus-storage/v8_dandelion_attack_sw_final_55bbe9ce.png",
  ashspiritAttackSE: "/manus-storage/v8_ashspirit_attack_se_final_24075091.png",
  ashspiritAttackSW: "/manus-storage/v8_ashspirit_attack_sw_final_1ab980d0.png",
  wflameAttackSE: "/manus-storage/v8_wflame_attack_se_final_56cbe22f.png",
  wflameAttackSW: "/manus-storage/v8_wflame_attack_sw_final_760ae573.png",
  brinewraithAttackSE: "/manus-storage/v8_brinewraith_attack_se_final_9de83218.png",
  brinewraithAttackSW: "/manus-storage/v8_brinewraith_attack_sw_final_c9acbea1.png",
  corpsefishAttackSE: "/manus-storage/p11d_corpsefish_attack_se_final_2508a6c3.png",
  corpsefishAttackSW: "/manus-storage/v8_corpsefish_attack_sw_final_1c85533f.png",
  tidecrabAttackSE: "/manus-storage/v8_tidecrab_attack_se_final_45ea3b0f.png",
  tidecrabAttackSW: "/manus-storage/v8_tidecrab_attack_sw_final_74f99c1f.png",
  morayAttackSE: "/manus-storage/v8_moray_attack_se_final_74f6b2ab.png",
  morayAttackSW: "/manus-storage/v8_moray_attack_sw_final_3feb8c82.png",
  ratkingAttackSE: "/manus-storage/v8_ratking_attack_se_final_60465652.png",
  ratkingAttackSW: "/manus-storage/v8_ratking_attack_sw_final_028e9146.png",
  wstatueAttackSE: "/manus-storage/p11_wstatue_attack_se_final_052dfdb5.png",
  wstatueAttackSW: "/manus-storage/p11_wstatue_attack_sw_final_2176e013.png",
  lurkerAttackSE: "/manus-storage/v8_lurker_attack_se_final_43312092.png",
  lurkerAttackSW: "/manus-storage/v8_lurker_attack_sw_final_b8a4e322.png",
  windreaperAttackSE: "/manus-storage/v8_windreaper_attack_se_final_1ccb98ad.png",
  windreaperAttackSW: "/manus-storage/v8_windreaper_attack_sw_final_12e314e6.png",
  // p11 — dedicated flight/drift strips for hovering fliers (previously code-bob only)
  ashspiritFlySE: "/manus-storage/p11d_ashspirit_fly_se_final_0b940e3c.png",
  ashspiritFlySW: "/manus-storage/p11d_ashspirit_fly_sw_final_605b5843.png",
  wflameFlySE: "/manus-storage/p11d_wflame_fly_se_final_0e4b384c.png",
  wflameFlySW: "/manus-storage/p11d_wflame_fly_sw_final_a042be8d.png",
  brinewraithFlySE: "/manus-storage/p11d_brinewraith_fly_se_final_a2176b18.png",
  brinewraithFlySW: "/manus-storage/p11d_brinewraith_fly_sw_final_84764ca3.png",
  windreaperFlySE: "/manus-storage/p11d_windreaper_fly_se_final_55c06923.png",
  windreaperFlySW: "/manus-storage/p11d_windreaper_fly_sw_final_a21ce8d0.png",
  dandelionFlySE: "/manus-storage/p11d_dandelion_fly_se_final_15ade94a.png",
  dandelionFlySW: "/manus-storage/p11d_dandelion_fly_sw_final_003a55d5.png",
  morayFlySE: "/manus-storage/p11d_moray_fly_se_final_2afd0f0d.png",
  morayFlySW: "/manus-storage/p11d_moray_fly_sw_final_d02ffe3b.png",
};

/** Attack-animation archetype. Player uses SE/SW; mobs SE only (mirrored use ok). */
export type { AttackKey } from "../types";
import type { AttackKey } from "../types";
const ATTACK_URLS: Record<AttackKey, { se: string; sw: string; ne?: string; nw?: string }> = {
  knight: { se: URLS.knightAttackSE, sw: URLS.knightAttackSW },
  skel: { se: URLS.skelAttackSE, sw: URLS.skelAttackSW },
  kardorim: { se: URLS.kardorimAttackSE, sw: URLS.kardorimAttackSW },
  warden: { se: URLS.wardenAttackSE, sw: URLS.wardenAttackSW },
  sentinel: { se: URLS.sentinelAttackSE, sw: URLS.sentinelAttackSW },
  beast: { se: URLS.beastAttackSE, sw: URLS.beastAttackSW },
  toad: { se: URLS.toadAttackSE, sw: URLS.toadAttackSW },
  boar: { se: URLS.boarAttackSE, sw: URLS.boarAttackSW },
  garg: { se: URLS.gargAttackSE, sw: URLS.gargAttackSW },
  frail: { se: URLS.frailAttackSE, sw: URLS.frailAttackSW },
  drowned: { se: URLS.drownedAttackSE, sw: URLS.drownedAttackSW },
  sunkarcher: { se: URLS.sunkarcherAttackSE, sw: URLS.sunkarcherAttackSW },
  priest: { se: URLS.priestAttackSE, sw: URLS.priestAttackSW },
  mage: { se: URLS.mageAttackSE, sw: URLS.mageAttackSW },
  archer: { se: URLS.archerAttackSE, sw: URLS.archerAttackSW },
  pc_mage: { se: URLS.pcMageAttackSE, sw: URLS.pcMageAttackSW, ne: URLS.pcMageAttackNE, nw: URLS.pcMageAttackNW },
  pc_archer: { se: URLS.pcArcherAttackSE, sw: URLS.pcArcherAttackSW, ne: URLS.pcArcherAttackNE, nw: URLS.pcArcherAttackNW },
  golem: { se: URLS.golemAttackSE, sw: URLS.golemAttackSW },
  serpent: { se: URLS.serpentAttackSE, sw: URLS.serpentAttackSW },
  spider: { se: URLS.spiderAttackSE, sw: URLS.spiderAttackSW },
  vulkas: { se: URLS.vulkasAttackSE, sw: URLS.vulkasAttackSW },
  morvane: { se: URLS.morvaneAttackSE, sw: URLS.morvaneAttackSW },
  aurelion: { se: URLS.aurelionAttackSE, sw: URLS.aurelionAttackSW },
  corpsefly: { se: URLS.corpseflyAttackSE, sw: URLS.corpseflyAttackSW },
  dandelion: { se: URLS.dandelionAttackSE, sw: URLS.dandelionAttackSW },
  ashspirit: { se: URLS.ashspiritAttackSE, sw: URLS.ashspiritAttackSW },
  wflame: { se: URLS.wflameAttackSE, sw: URLS.wflameAttackSW },
  brinewraith: { se: URLS.brinewraithAttackSE, sw: URLS.brinewraithAttackSW },
  corpsefish: { se: URLS.corpsefishAttackSE, sw: URLS.corpsefishAttackSW },
  tidecrab: { se: URLS.tidecrabAttackSE, sw: URLS.tidecrabAttackSW },
  moray: { se: URLS.morayAttackSE, sw: URLS.morayAttackSW },
  ratking: { se: URLS.ratkingAttackSE, sw: URLS.ratkingAttackSW },
  wstatue: { se: URLS.wstatueAttackSE, sw: URLS.wstatueAttackSW },
  lurker: { se: URLS.lurkerAttackSE, sw: URLS.lurkerAttackSW },
  windreaper: { se: URLS.windreaperAttackSE, sw: URLS.windreaperAttackSW },
};

/** Get one frame of a 6-frame attack strip. True NE/NW strips are used when present; otherwise NE/NW fall back to SE/SW. */
export function getAttackFrame(
  key: AttackKey,
  dir: WalkDir,
  frame: number,
): CanvasImageSource | undefined {
  const urls = ATTACK_URLS[key];
  const url =
    dir === "ne" && urls.ne ? urls.ne :
    dir === "nw" && urls.nw ? urls.nw :
    dir === "se" || dir === "ne" ? urls.se : urls.sw;
  const cacheKey = `${url}#atk#${frame}`;
  if (cells.has(cacheKey)) return cells.get(cacheKey);
  const img = getImage(url);
  if (!img) return undefined;
  const cw = Math.floor(img.naturalWidth / WALK_FRAMES);
  const ch = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  canvas.getContext("2d")!.drawImage(img, (frame % WALK_FRAMES) * cw, 0, cw, ch, 0, 0, cw, ch);
  cells.set(cacheKey, canvas);
  return canvas;
}

/** Walk-animation archetype for mobs. "hover" floats (no sheet). */
export type { WalkKey } from "../types";
import type { WalkKey } from "../types";

const MOB_WALK_URLS: Record<Exclude<WalkKey, "hover">, { se: string; sw: string; ne?: string; nw?: string }> = {
  kardorim: { se: URLS.kardorimWalkSE, sw: URLS.kardorimWalkSW },
  warden: { se: URLS.wardenWalkSE, sw: URLS.wardenWalkSW },
  sentinel: { se: URLS.sentinelWalkSE, sw: URLS.sentinelWalkSW },
  skel_melee: { se: URLS.skelMeleeWalkSE, sw: URLS.skelMeleeWalkSW },
  skel_archer: { se: URLS.skelArcherWalkSE, sw: URLS.skelArcherWalkSW },
  beast: { se: URLS.beastWalkSE, sw: URLS.beastWalkSW },
  toad: { se: URLS.toadHopSE, sw: URLS.toadHopSW },
  fly: { se: URLS.flyFlapSE, sw: URLS.flyFlapSW },
  gargoyle: { se: URLS.gargFlapSE, sw: URLS.gargFlapSW },
  frail: { se: URLS.frailWalkSE, sw: URLS.frailWalkSW },
  drowned: { se: URLS.drownedWalkSE, sw: URLS.drownedWalkSW },
  sunkarcher: { se: URLS.sunkarcherWalkSE, sw: URLS.sunkarcherWalkSW },
  priest: { se: URLS.priestWalkSE, sw: URLS.priestWalkSW },
  mage: { se: URLS.mageWalkSE, sw: URLS.mageWalkSW },
  archer: { se: URLS.archerWalkSE, sw: URLS.archerWalkSW },
  pc_mage: { se: URLS.pcMageWalkSE, sw: URLS.pcMageWalkSW, ne: URLS.pcMageWalkNE, nw: URLS.pcMageWalkNW },
  pc_archer: { se: URLS.pcArcherWalkSE, sw: URLS.pcArcherWalkSW, ne: URLS.pcArcherWalkNE, nw: URLS.pcArcherWalkNW },
  golem: { se: URLS.golemWalkSE, sw: URLS.golemWalkSW },
  serpent: { se: URLS.serpentWalkSE, sw: URLS.serpentWalkSW },
  spider: { se: URLS.spiderWalkSE, sw: URLS.spiderWalkSW },
  vulkas: { se: URLS.vulkasWalkSE, sw: URLS.vulkasWalkSW },
  morvane: { se: URLS.morvaneWalkSE, sw: URLS.morvaneWalkSW },
  aurelion: { se: URLS.aurelionWalkSE, sw: URLS.aurelionWalkSW },
  // p11 flight strips — fliers that previously hovered with a static sprite
  ashspirit: { se: URLS.ashspiritFlySE, sw: URLS.ashspiritFlySW },
  wflame: { se: URLS.wflameFlySE, sw: URLS.wflameFlySW },
  brinewraith: { se: URLS.brinewraithFlySE, sw: URLS.brinewraithFlySW },
  windreaper: { se: URLS.windreaperFlySE, sw: URLS.windreaperFlySW },
  dandelion: { se: URLS.dandelionFlySE, sw: URLS.dandelionFlySW },
  moray: { se: URLS.morayFlySE, sw: URLS.morayFlySW },
};

/** Idle breathing strips (6-frame, SE/SW) for select mobs. */
export type IdleKey = "frail" | "drowned";
const IDLE_URLS: Record<IdleKey, { se: string; sw: string }> = {
  frail: { se: URLS.frailIdleSE, sw: URLS.frailIdleSW },
  drowned: { se: URLS.drownedIdleSE, sw: URLS.drownedIdleSW },
};

/** Get one frame of a 6-frame idle strip. NE/NW fall back to SE/SW. */
export function getIdleFrame(
  key: IdleKey,
  dir: WalkDir,
  frame: number,
): CanvasImageSource | undefined {
  const urls = IDLE_URLS[key];
  const url = dir === "se" || dir === "ne" ? urls.se : urls.sw;
  const cacheKey = `${url}#idle#${frame}`;
  if (cells.has(cacheKey)) return cells.get(cacheKey);
  const img = getImage(url);
  if (!img) return undefined;
  const cw = Math.floor(img.naturalWidth / WALK_FRAMES);
  const ch = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  canvas.getContext("2d")!.drawImage(img, (frame % WALK_FRAMES) * cw, 0, cw, ch, 0, 0, cw, ch);
  cells.set(cacheKey, canvas);
  return canvas;
}

export type WalkDir = "se" | "sw" | "ne" | "nw";
const WALK_URLS: Record<WalkDir, string> = {
  se: URLS.walkSE,
  sw: URLS.walkSW,
  ne: URLS.walkNE,
  nw: URLS.walkNW,
};
export const WALK_FRAMES = 6;

/** Get one frame of the 6-frame horizontal walk strip for a direction. */
export function getWalkFrame(dir: WalkDir, frame: number): CanvasImageSource | undefined {
  const url = WALK_URLS[dir];
  const key = `${url}#walk#${frame}`;
  if (cells.has(key)) return cells.get(key);
  const img = getImage(url);
  if (!img) return undefined;
  const cw = Math.floor(img.naturalWidth / WALK_FRAMES);
  const ch = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  canvas.getContext("2d")!.drawImage(img, (frame % WALK_FRAMES) * cw, 0, cw, ch, 0, 0, cw, ch);
  cells.set(key, canvas);
  return canvas;
}

/** Get one frame of a mob walk strip. NE/NW fall back to SE/SW respectively. */
export function getMobWalkFrame(
  key: WalkKey,
  dir: WalkDir,
  frame: number,
): CanvasImageSource | undefined {
  if (key === "hover") return undefined;
  const urls = MOB_WALK_URLS[key];
  // true 4-direction strips when available (player classes); otherwise NE/NW fall back to SE/SW
  const url =
    dir === "ne" ? (urls.ne ?? urls.se)
    : dir === "nw" ? (urls.nw ?? urls.sw)
    : dir === "se" ? urls.se
    : urls.sw;
  const cacheKey = `${url}#mobwalk#${frame}`;
  if (cells.has(cacheKey)) return cells.get(cacheKey);
  const img = getImage(url);
  if (!img) return undefined;
  const cw = Math.floor(img.naturalWidth / WALK_FRAMES);
  const ch = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  canvas.getContext("2d")!.drawImage(img, (frame % WALK_FRAMES) * cw, 0, cw, ch, 0, 0, cw, ch);
  cells.set(cacheKey, canvas);
  return canvas;
}

const images = new Map<string, HTMLImageElement>();
const cells = new Map<string, HTMLCanvasElement>();

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(img); // tolerate failures; draws will just skip
    img.src = url;
  });
}

export async function loadAssets(): Promise<void> {
  const entries = Object.values(URLS);
  const loaded = await Promise.all(entries.map(loadImage));
  entries.forEach((url, i) => images.set(url, loaded[i]));
}

export function getImage(url: string): HTMLImageElement | undefined {
  const img = images.get(url);
  return img && img.complete && img.naturalWidth > 0 ? img : undefined;
}

/** Trim transparent margins of a cropped cell for tighter sprites. */
function cropCell(img: HTMLImageElement, grid: number, cell: number): HTMLCanvasElement {
  const cw = Math.floor(img.naturalWidth / grid);
  const ch = Math.floor(img.naturalHeight / grid);
  const cx = (cell % grid) * cw;
  const cy = Math.floor(cell / grid) * ch;
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
  // trim transparent bounds
  try {
    const data = ctx.getImageData(0, 0, cw, ch);
    let minX = cw, minY = ch, maxX = 0, maxY = 0;
    for (let y = 0; y < ch; y++) {
      for (let x = 0; x < cw; x++) {
        if (data.data[(y * cw + x) * 4 + 3] > 12) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX > minX && maxY > minY) {
      const tw = maxX - minX + 1;
      const th = maxY - minY + 1;
      const trimmed = document.createElement("canvas");
      trimmed.width = tw;
      trimmed.height = th;
      trimmed.getContext("2d")!.drawImage(canvas, minX, minY, tw, th, 0, 0, tw, th);
      return trimmed;
    }
  } catch {
    /* canvas tainted — return untrimmed */
  }
  return canvas;
}

export function getSprite(ref: SpriteRef): CanvasImageSource | undefined {
  if (ref.grid == null || ref.cell == null) return getImage(ref.url);
  const key = `${ref.url}#${ref.grid}#${ref.cell}`;
  if (cells.has(key)) return cells.get(key);
  const img = getImage(ref.url);
  if (!img) return undefined;
  const c = cropCell(img, ref.grid, ref.cell);
  cells.set(key, c);
  return c;
}

/** Icon crop from the 4x4 UI kit. */
export function getIcon(index: number): CanvasImageSource | undefined {
  return getSprite({ url: URLS.icons, grid: 4, cell: index });
}

/** Export icon cell as data URL for React <img> usage. */
const iconUrlCache = new Map<number, string>();
export function iconDataUrl(index: number): string | undefined {
  if (iconUrlCache.has(index)) return iconUrlCache.get(index);
  const c = getSprite({ url: URLS.icons, grid: 4, cell: index });
  if (!c || !(c instanceof HTMLCanvasElement)) return undefined;
  try {
    const url = c.toDataURL();
    iconUrlCache.set(index, url);
    return url;
  } catch {
    return undefined;
  }
}
