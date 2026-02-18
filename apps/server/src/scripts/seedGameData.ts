import mongoose from 'mongoose';
import { Dynasty } from '../modules/dynasty/dynasty.model.js';
import { Faction } from '../modules/faction/faction.model.js';
import { RankDefinition } from '../modules/rank/rank.model.js';
import { Skill } from '../modules/skill/skill.model.js';
import { BattleTemplate } from '../modules/battle/battleTemplate.model.js';
import { Item } from '../modules/item/item.model.js';
import { General } from '../modules/general/general.model.js';
// Phase 3
import { Territory } from '../modules/world/territory.model.js';
import { AiFaction } from '../modules/ai/ai-faction.model.js';
import { EnemyGeneral } from '../modules/enemy-general/enemy-general.model.js';
import { Campaign } from '../modules/campaign/campaign.model.js';
import { DynastyState } from '../modules/dynasty-state/dynasty-state.model.js';
// Phase 4
import { CourtState } from '../modules/politics/court.model.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27018/rise_of_the_general';

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  // 1. Dynasty
  console.log('Seeding dynasty...');
  const dynasty = await Dynasty.findOneAndUpdate(
    { name: 'Three Kingdoms' },
    {
      $setOnInsert: {
        name: 'Three Kingdoms',
        startYear: 220,
        endYear: 280,
        isActive: true,
        timeline: 'historical',
      },
    },
    { upsert: true, new: true },
  );
  console.log(`  Dynasty: ${dynasty.name}`);

  // 2. Factions
  console.log('Seeding factions...');
  const factionsData = [
    {
      name: 'Wei',
      leaderName: 'Cao Cao',
      baseBonus: { strength: 3, defense: 1, strategy: 2, speed: 1, leadership: 1 },
    },
    {
      name: 'Shu',
      leaderName: 'Liu Bei',
      baseBonus: { strength: 1, defense: 2, strategy: 1, speed: 2, leadership: 3 },
    },
    {
      name: 'Wu',
      leaderName: 'Sun Quan',
      baseBonus: { strength: 2, defense: 2, strategy: 3, speed: 1, leadership: 0 },
    },
  ];

  for (const f of factionsData) {
    await Faction.findOneAndUpdate(
      { name: f.name },
      { $setOnInsert: { ...f, dynastyId: dynasty._id } },
      { upsert: true },
    );
    console.log(`  Faction: ${f.name}`);
  }

  // 3. Skills
  console.log('Seeding skills...');
  const skillsData = [
    { name: 'Basic Strike', type: 'active' as const, effects: { strengthBonus: 5 }, unlockTier: 1 },
    { name: 'Shield Wall', type: 'passive' as const, effects: { defenseBonus: 8 }, unlockTier: 2 },
    {
      name: 'Tactical Retreat',
      type: 'active' as const,
      effects: { defenseBonus: 5, moraleBoost: 3 },
      unlockTier: 3,
    },
    { name: 'War Drums', type: 'passive' as const, effects: { moraleBoost: 10 }, unlockTier: 4 },
    {
      name: "General's Command",
      type: 'active' as const,
      effects: { strengthBonus: 10, moraleBoost: 8 },
      unlockTier: 5,
    },
  ];

  const skills: Record<string, mongoose.Types.ObjectId> = {};
  for (const s of skillsData) {
    const skill = await Skill.findOneAndUpdate(
      { name: s.name },
      { $setOnInsert: s },
      { upsert: true, new: true },
    );
    skills[s.name] = skill._id as mongoose.Types.ObjectId;
    console.log(`  Skill: ${s.name}`);
  }

  // 4. Ranks (first pass: create without nextRankId)
  console.log('Seeding ranks...');
  const ranksData = [
    {
      title: 'Recruit',
      tier: 1,
      requiredMerit: 0,
      requiredLeadership: 0,
      maxTroopCommand: 5,
      unlockSkills: [skills['Basic Strike']],
    },
    {
      title: 'Footman',
      tier: 2,
      requiredMerit: 50,
      requiredLeadership: 5,
      maxTroopCommand: 10,
      unlockSkills: [skills['Basic Strike'], skills['Shield Wall']],
    },
    {
      title: '5-Man Leader',
      tier: 3,
      requiredMerit: 150,
      requiredLeadership: 12,
      maxTroopCommand: 50,
      unlockSkills: [skills['Basic Strike'], skills['Shield Wall'], skills['Tactical Retreat']],
    },
    {
      title: '10-Man Leader',
      tier: 4,
      requiredMerit: 400,
      requiredLeadership: 20,
      maxTroopCommand: 100,
      unlockSkills: [
        skills['Basic Strike'],
        skills['Shield Wall'],
        skills['Tactical Retreat'],
        skills['War Drums'],
      ],
    },
    {
      title: '100-Man Commander',
      tier: 5,
      requiredMerit: 1000,
      requiredLeadership: 35,
      maxTroopCommand: 500,
      unlockSkills: [
        skills['Basic Strike'],
        skills['Shield Wall'],
        skills['Tactical Retreat'],
        skills['War Drums'],
        skills["General's Command"],
      ],
    },
    {
      title: '1000-Man Commander',
      tier: 6,
      requiredMerit: 2500,
      requiredLeadership: 55,
      maxTroopCommand: 1000,
      unlockSkills: [
        skills['Basic Strike'],
        skills['Shield Wall'],
        skills['Tactical Retreat'],
        skills['War Drums'],
        skills["General's Command"],
      ],
    },
    {
      title: 'General',
      tier: 7,
      requiredMerit: 5000,
      requiredLeadership: 80,
      maxTroopCommand: 10000,
      unlockSkills: [
        skills['Basic Strike'],
        skills['Shield Wall'],
        skills['Tactical Retreat'],
        skills['War Drums'],
        skills["General's Command"],
      ],
    },
  ];

  const rankDocs: mongoose.Document[] = [];
  for (const r of ranksData) {
    const rank = await RankDefinition.findOneAndUpdate(
      { title: r.title },
      { $setOnInsert: { ...r, nextRankId: null } },
      { upsert: true, new: true },
    );
    rankDocs.push(rank);
    console.log(`  Rank: ${r.title}`);
  }

  // Second pass: chain nextRankId
  console.log('Chaining rank progression...');
  for (let i = 0; i < rankDocs.length - 1; i++) {
    await RankDefinition.findByIdAndUpdate(rankDocs[i]._id, {
      nextRankId: rankDocs[i + 1]._id,
    });
  }
  // Last rank has no next
  await RankDefinition.findByIdAndUpdate(rankDocs[rankDocs.length - 1]._id, {
    nextRankId: null,
  });

  // 5. Battle Templates
  console.log('Seeding battle templates...');
  const templatesData = [
    { name: 'Village Skirmish', difficulty: 1, enemyPower: 30, meritReward: 15, expReward: 30 },
    { name: 'Bandit Raid', difficulty: 2, enemyPower: 55, meritReward: 30, expReward: 60 },
    { name: 'Border Conflict', difficulty: 3, enemyPower: 90, meritReward: 60, expReward: 100 },
    { name: 'Fortress Siege', difficulty: 4, enemyPower: 150, meritReward: 100, expReward: 180 },
    { name: 'Grand Campaign', difficulty: 5, enemyPower: 250, meritReward: 200, expReward: 350 },
  ];

  for (const t of templatesData) {
    await BattleTemplate.findOneAndUpdate({ name: t.name }, { $setOnInsert: t }, { upsert: true });
    console.log(`  Template: ${t.name}`);
  }

  // 6. Items
  console.log('Seeding items...');
  const itemsData = [
    {
      name: 'Iron Sword',
      type: 'weapon' as const,
      rarity: 'common' as const,
      statBonus: { strength: 3 },
    },
    {
      name: 'Wooden Shield',
      type: 'armor' as const,
      rarity: 'common' as const,
      statBonus: { defense: 3 },
    },
    {
      name: 'Bronze Spear',
      type: 'weapon' as const,
      rarity: 'common' as const,
      statBonus: { strength: 4 },
    },
    {
      name: 'Leather Armor',
      type: 'armor' as const,
      rarity: 'common' as const,
      statBonus: { defense: 4 },
    },
    {
      name: 'Steel Blade',
      type: 'weapon' as const,
      rarity: 'rare' as const,
      statBonus: { strength: 7, strategy: 2 },
    },
    {
      name: 'Chain Mail',
      type: 'armor' as const,
      rarity: 'rare' as const,
      statBonus: { defense: 7, strategy: 2 },
    },
    {
      name: 'War Halberd',
      type: 'weapon' as const,
      rarity: 'rare' as const,
      statBonus: { strength: 8, leadership: 3 },
    },
    {
      name: 'Dragon Scale Armor',
      type: 'armor' as const,
      rarity: 'epic' as const,
      statBonus: { defense: 12, strategy: 5 },
    },
    {
      name: 'Sky Piercer',
      type: 'weapon' as const,
      rarity: 'epic' as const,
      statBonus: { strength: 15, leadership: 5 },
    },
    {
      name: 'Heavenly Robes',
      type: 'armor' as const,
      rarity: 'epic' as const,
      statBonus: { defense: 10, strategy: 8, leadership: 5 },
    },
  ];

  for (const item of itemsData) {
    await Item.findOneAndUpdate({ name: item.name }, { $setOnInsert: item }, { upsert: true });
    console.log(`  Item: ${item.name}`);
  }

  // 7. Generals
  console.log('Seeding generals...');
  const factionWei = await Faction.findOne({ name: 'Wei' });
  const factionShu = await Faction.findOne({ name: 'Shu' });
  const factionWu = await Faction.findOne({ name: 'Wu' });

  const generalsData = [
    // === WEI (Cao Cao's forces) ===
    {
      name: 'Xiahou Dun',
      title: 'The One-Eyed Warrior',
      factionId: factionWei!._id,
      rarity: 'uncommon' as const,
      requiredRankTier: 2,
      requiredRelationship: 20,
      stats: { strength: 30, defense: 25, strategy: 15, speed: 20, leadership: 20 },
      battleBonus: { powerMultiplier: 1.08 },
    },
    {
      name: 'Xu Chu',
      title: 'The Tiger Fool',
      factionId: factionWei!._id,
      rarity: 'uncommon' as const,
      requiredRankTier: 2,
      requiredRelationship: 25,
      stats: { strength: 35, defense: 30, strategy: 8, speed: 15, leadership: 10 },
      battleBonus: { powerMultiplier: 1.1 },
    },
    {
      name: 'Cao Ren',
      title: 'Defender of Fan Castle',
      factionId: factionWei!._id,
      rarity: 'rare' as const,
      requiredRankTier: 4,
      requiredRelationship: 50,
      stats: { strength: 22, defense: 40, strategy: 25, speed: 18, leadership: 30 },
      battleBonus: { powerMultiplier: 1.15 },
    },
    {
      name: 'Zhang Liao',
      title: 'Terror of Hefei',
      factionId: factionWei!._id,
      rarity: 'rare' as const,
      requiredRankTier: 4,
      requiredRelationship: 60,
      stats: { strength: 35, defense: 28, strategy: 30, speed: 28, leadership: 35 },
      battleBonus: { powerMultiplier: 1.18 },
    },
    {
      name: 'Sima Yi',
      title: 'The Hidden Dragon',
      factionId: factionWei!._id,
      rarity: 'legendary' as const,
      requiredRankTier: 6,
      requiredRelationship: 100,
      stats: { strength: 15, defense: 25, strategy: 50, speed: 20, leadership: 45 },
      battleBonus: { powerMultiplier: 1.3 },
    },

    // === SHU (Liu Bei's forces) ===
    {
      name: 'Zhao Yun',
      title: 'The Dragon of Changban',
      factionId: factionShu!._id,
      rarity: 'uncommon' as const,
      requiredRankTier: 2,
      requiredRelationship: 15,
      stats: { strength: 30, defense: 28, strategy: 20, speed: 30, leadership: 22 },
      battleBonus: { powerMultiplier: 1.1 },
    },
    {
      name: 'Huang Zhong',
      title: 'The Veteran Archer',
      factionId: factionShu!._id,
      rarity: 'uncommon' as const,
      requiredRankTier: 3,
      requiredRelationship: 30,
      stats: { strength: 32, defense: 20, strategy: 18, speed: 15, leadership: 18 },
      battleBonus: { powerMultiplier: 1.08 },
    },
    {
      name: 'Ma Chao',
      title: 'The Splendid Stallion',
      factionId: factionShu!._id,
      rarity: 'rare' as const,
      requiredRankTier: 4,
      requiredRelationship: 55,
      stats: { strength: 38, defense: 22, strategy: 15, speed: 35, leadership: 25 },
      battleBonus: { powerMultiplier: 1.15 },
    },
    {
      name: 'Zhang Fei',
      title: 'The Unbreakable',
      factionId: factionShu!._id,
      rarity: 'rare' as const,
      requiredRankTier: 5,
      requiredRelationship: 70,
      stats: { strength: 42, defense: 30, strategy: 10, speed: 25, leadership: 28 },
      battleBonus: { powerMultiplier: 1.2 },
    },
    {
      name: 'Guan Yu',
      title: 'God of War',
      factionId: factionShu!._id,
      rarity: 'legendary' as const,
      requiredRankTier: 6,
      requiredRelationship: 100,
      stats: { strength: 45, defense: 35, strategy: 25, speed: 22, leadership: 40 },
      battleBonus: { powerMultiplier: 1.3 },
    },

    // === WU (Sun Quan's forces) ===
    {
      name: 'Taishi Ci',
      title: 'The Duellist',
      factionId: factionWu!._id,
      rarity: 'uncommon' as const,
      requiredRankTier: 2,
      requiredRelationship: 20,
      stats: { strength: 32, defense: 22, strategy: 15, speed: 28, leadership: 15 },
      battleBonus: { powerMultiplier: 1.08 },
    },
    {
      name: 'Gan Ning',
      title: 'The Pirate King',
      factionId: factionWu!._id,
      rarity: 'uncommon' as const,
      requiredRankTier: 3,
      requiredRelationship: 30,
      stats: { strength: 35, defense: 18, strategy: 12, speed: 32, leadership: 18 },
      battleBonus: { powerMultiplier: 1.1 },
    },
    {
      name: 'Lu Meng',
      title: 'The Scholar General',
      factionId: factionWu!._id,
      rarity: 'rare' as const,
      requiredRankTier: 4,
      requiredRelationship: 55,
      stats: { strength: 25, defense: 28, strategy: 38, speed: 22, leadership: 32 },
      battleBonus: { powerMultiplier: 1.15 },
    },
    {
      name: 'Lu Xun',
      title: 'The Young Strategist',
      factionId: factionWu!._id,
      rarity: 'rare' as const,
      requiredRankTier: 5,
      requiredRelationship: 65,
      stats: { strength: 18, defense: 25, strategy: 42, speed: 25, leadership: 35 },
      battleBonus: { powerMultiplier: 1.18 },
    },
    {
      name: 'Zhou Yu',
      title: 'The Red Cliffs Commander',
      factionId: factionWu!._id,
      rarity: 'legendary' as const,
      requiredRankTier: 6,
      requiredRelationship: 100,
      stats: { strength: 20, defense: 28, strategy: 48, speed: 25, leadership: 42 },
      battleBonus: { powerMultiplier: 1.3 },
    },
  ];

  for (const g of generalsData) {
    await General.findOneAndUpdate({ name: g.name }, { $setOnInsert: g }, { upsert: true });
    console.log(`  General: ${g.name} (${g.rarity})`);
  }

  // ── Phase 3 ──────────────────────────────────────────────────────────────

  // Resolve faction docs needed for ownership assignments
  const factionWei2 = await Faction.findOne({ name: 'Wei' });
  const factionShu2 = await Faction.findOne({ name: 'Shu' });
  const factionWu2 = await Faction.findOne({ name: 'Wu' });

  if (!factionWei2 || !factionShu2 || !factionWu2) {
    throw new Error('Factions not found — ensure Phase 1 seed ran first');
  }

  // 9. Territories (18 territories across 3 regions)
  console.log('Seeding territories...');
  const territoriesData = [
    // North — Wei stronghold
    {
      name: 'Luoyang',
      region: 'north' as const,
      ownerFactionId: factionWei2._id,
      strategicValue: 20,
      defenseRating: 30,
    },
    {
      name: 'Ye',
      region: 'north' as const,
      ownerFactionId: factionWei2._id,
      strategicValue: 15,
      defenseRating: 20,
    },
    {
      name: "Chang'an",
      region: 'north' as const,
      ownerFactionId: factionWei2._id,
      strategicValue: 18,
      defenseRating: 25,
    },
    {
      name: 'Bingzhou',
      region: 'north' as const,
      ownerFactionId: factionWei2._id,
      strategicValue: 10,
      defenseRating: 15,
    },
    {
      name: 'Liangzhou',
      region: 'north' as const,
      ownerFactionId: factionWei2._id,
      strategicValue: 8,
      defenseRating: 12,
    },
    {
      name: 'Youzhou',
      region: 'north' as const,
      ownerFactionId: factionWei2._id,
      strategicValue: 12,
      defenseRating: 18,
    },
    // Central — contested
    {
      name: 'Jing Province',
      region: 'central' as const,
      ownerFactionId: factionShu2._id,
      strategicValue: 20,
      defenseRating: 20,
    },
    {
      name: 'Runan',
      region: 'central' as const,
      ownerFactionId: factionWei2._id,
      strategicValue: 12,
      defenseRating: 15,
    },
    {
      name: 'Nanyang',
      region: 'central' as const,
      ownerFactionId: factionShu2._id,
      strategicValue: 10,
      defenseRating: 12,
    },
    {
      name: 'Xuzhou',
      region: 'central' as const,
      ownerFactionId: factionWei2._id,
      strategicValue: 14,
      defenseRating: 20,
    },
    {
      name: 'Yangzhou',
      region: 'central' as const,
      ownerFactionId: factionWu2._id,
      strategicValue: 15,
      defenseRating: 18,
    },
    {
      name: 'Jianye',
      region: 'central' as const,
      ownerFactionId: factionWu2._id,
      strategicValue: 18,
      defenseRating: 22,
    },
    // South — Shu + Wu
    {
      name: 'Yizhou',
      region: 'south' as const,
      ownerFactionId: factionShu2._id,
      strategicValue: 20,
      defenseRating: 25,
    },
    {
      name: 'Hanzhong',
      region: 'south' as const,
      ownerFactionId: factionShu2._id,
      strategicValue: 15,
      defenseRating: 18,
    },
    {
      name: 'Jiangxia',
      region: 'south' as const,
      ownerFactionId: factionWu2._id,
      strategicValue: 12,
      defenseRating: 15,
    },
    {
      name: 'Guilin',
      region: 'south' as const,
      ownerFactionId: factionWu2._id,
      strategicValue: 8,
      defenseRating: 10,
    },
    {
      name: 'Nanhai',
      region: 'south' as const,
      ownerFactionId: factionWu2._id,
      strategicValue: 10,
      defenseRating: 12,
    },
    {
      name: 'Jianning',
      region: 'south' as const,
      ownerFactionId: factionShu2._id,
      strategicValue: 6,
      defenseRating: 8,
    },
  ];

  const territoryMap: Record<string, mongoose.Types.ObjectId> = {};
  for (const t of territoriesData) {
    const doc = await Territory.findOneAndUpdate(
      { name: t.name },
      {
        $set: {
          strategicValue: t.strategicValue,
          defenseRating: t.defenseRating,
          ownerFactionId: t.ownerFactionId,
        },
        $setOnInsert: { region: t.region, connectedTerritoryIds: [] },
      },
      { upsert: true, new: true },
    );
    territoryMap[t.name] = doc._id as mongoose.Types.ObjectId;
    console.log(`  Territory: ${t.name} (${t.region})`);
  }

  // Wire up connections (adjacency graph)
  const connections: [string, string][] = [
    ['Luoyang', 'Ye'],
    ['Luoyang', "Chang'an"],
    ['Luoyang', 'Runan'],
    ['Ye', 'Bingzhou'],
    ['Ye', 'Youzhou'],
    ['Ye', 'Xuzhou'],
    ["Chang'an", 'Liangzhou'],
    ["Chang'an", 'Hanzhong'],
    ['Bingzhou', 'Youzhou'],
    ['Runan', 'Nanyang'],
    ['Runan', 'Xuzhou'],
    ['Xuzhou', 'Yangzhou'],
    ['Jing Province', 'Nanyang'],
    ['Jing Province', 'Jianye'],
    ['Jing Province', 'Jiangxia'],
    ['Jing Province', 'Hanzhong'],
    ['Yangzhou', 'Jianye'],
    ['Jianye', 'Jiangxia'],
    ['Yizhou', 'Hanzhong'],
    ['Yizhou', 'Jianning'],
    ['Jiangxia', 'Guilin'],
    ['Guilin', 'Nanhai'],
    ['Guilin', 'Jianning'],
  ];

  for (const [a, b] of connections) {
    const idA = territoryMap[a];
    const idB = territoryMap[b];
    if (!idA || !idB) continue;
    await Territory.findByIdAndUpdate(idA, { $addToSet: { connectedTerritoryIds: idB } });
    await Territory.findByIdAndUpdate(idB, { $addToSet: { connectedTerritoryIds: idA } });
  }
  console.log('  Territory connections wired.');

  // 10. AI faction configs
  console.log('Seeding AI faction configs...');
  const aiFactionData = [
    {
      factionId: factionWei2._id,
      aggression: 70,
      expansionRate: 3,
      preferredRegions: ['north', 'central'],
    },
    {
      factionId: factionShu2._id,
      aggression: 55,
      expansionRate: 4,
      preferredRegions: ['central', 'south'],
    },
    {
      factionId: factionWu2._id,
      aggression: 50,
      expansionRate: 5,
      preferredRegions: ['south', 'central'],
    },
  ];
  for (const ai of aiFactionData) {
    await AiFaction.findOneAndUpdate(
      { factionId: ai.factionId },
      { $setOnInsert: ai },
      { upsert: true },
    );
    console.log(`  AI config for faction: ${ai.factionId}`);
  }

  // 11. Enemy generals (3 per faction, 9 total)
  console.log('Seeding enemy generals...');
  const enemyGeneralsData = [
    // Wei generals
    {
      name: 'Xu Zhu (enemy)',
      factionId: factionWei2._id,
      territoryId: territoryMap['Luoyang'],
      level: 5,
      powerMultiplier: 1.4,
      canRetreat: false,
    },
    {
      name: 'Zhang Liao (enemy)',
      factionId: factionWei2._id,
      territoryId: territoryMap['Ye'],
      level: 4,
      powerMultiplier: 1.3,
      canRetreat: true,
    },
    {
      name: 'Xiahou Dun (enemy)',
      factionId: factionWei2._id,
      territoryId: territoryMap["Chang'an"],
      level: 3,
      powerMultiplier: 1.2,
      canRetreat: false,
    },
    // Shu generals
    {
      name: 'Wei Yan (enemy)',
      factionId: factionShu2._id,
      territoryId: territoryMap['Yizhou'],
      level: 4,
      powerMultiplier: 1.3,
      canRetreat: false,
    },
    {
      name: 'Ma Chao (enemy)',
      factionId: factionShu2._id,
      territoryId: territoryMap['Hanzhong'],
      level: 3,
      powerMultiplier: 1.2,
      canRetreat: true,
    },
    {
      name: 'Pang Tong (enemy)',
      factionId: factionShu2._id,
      territoryId: territoryMap['Jing Province'],
      level: 5,
      powerMultiplier: 1.5,
      canRetreat: true,
    },
    // Wu generals
    {
      name: 'Lu Meng (enemy)',
      factionId: factionWu2._id,
      territoryId: territoryMap['Jianye'],
      level: 5,
      powerMultiplier: 1.4,
      canRetreat: false,
    },
    {
      name: 'Gan Ning (enemy)',
      factionId: factionWu2._id,
      territoryId: territoryMap['Jiangxia'],
      level: 3,
      powerMultiplier: 1.2,
      canRetreat: false,
    },
    {
      name: 'Taishi Ci (enemy)',
      factionId: factionWu2._id,
      territoryId: territoryMap['Yangzhou'],
      level: 4,
      powerMultiplier: 1.3,
      canRetreat: true,
    },
  ];
  for (const eg of enemyGeneralsData) {
    await EnemyGeneral.findOneAndUpdate(
      { name: eg.name },
      { $set: { ...eg, alive: true } },
      { upsert: true },
    );
    console.log(`  Enemy general: ${eg.name}`);
  }

  // 12. Campaigns (3 tiers)
  console.log('Seeding campaigns...');
  const campaignsData = [
    {
      name: 'The Northern March',
      dynastyId: dynasty._id,
      startingTerritoryId: territoryMap['Runan'],
      victoryConditions: { territoriesRequired: 3, generalsDefeated: 1 },
    },
    {
      name: 'Conquest of the Central Plains',
      dynastyId: dynasty._id,
      startingTerritoryId: territoryMap['Jing Province'],
      victoryConditions: { territoriesRequired: 5, generalsDefeated: 2 },
    },
    {
      name: 'The Final Unification',
      dynastyId: dynasty._id,
      startingTerritoryId: territoryMap['Luoyang'],
      victoryConditions: { territoriesRequired: 10, generalsDefeated: 5 },
    },
  ];
  for (const c of campaignsData) {
    await Campaign.findOneAndUpdate({ name: c.name }, { $setOnInsert: c }, { upsert: true });
    console.log(`  Campaign: ${c.name}`);
  }

  // 13. Dynasty state
  console.log('Seeding dynasty state...');
  await DynastyState.findOneAndUpdate(
    { dynastyId: dynasty._id },
    {
      $setOnInsert: {
        dynastyId: dynasty._id,
        stability: 100,
        corruption: 0,
        activeFactionIds: [factionWei2._id, factionShu2._id, factionWu2._id],
      },
    },
    { upsert: true },
  );
  console.log(`  Dynasty state seeded for: ${dynasty.name}`);

  // 14. Court state (Phase 4)
  console.log('Seeding court state...');
  await CourtState.findOneAndUpdate(
    { dynastyId: dynasty._id },
    {
      $setOnInsert: {
        dynastyId: dynasty._id,
        stability: 75,
        legitimacy: 75,
        morale: 75,
        corruption: 10,
        lastActionType: null,
      },
    },
    { upsert: true },
  );
  console.log(`  Court state seeded for: ${dynasty.name}`);

  console.log('\nSeed complete!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
