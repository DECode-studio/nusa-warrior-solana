ALTER TABLE "cards"
ADD COLUMN "strikeAttackBonus" INTEGER NOT NULL DEFAULT 0;

UPDATE "cards"
SET "attackMod" = 200,
    "strikeAttackBonus" = 100
WHERE "slug" = 'kempul';

UPDATE "cards"
SET "affinityBonusDef" = 0
WHERE "slug" = 'gambang';
