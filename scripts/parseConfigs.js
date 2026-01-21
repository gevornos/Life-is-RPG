const fs = require('fs');
const path = require('path');

// Простой CSV парсер
function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      const value = values[index]?.trim();
      // Пытаемся преобразовать в число
      obj[header.trim()] = isNaN(value) ? value : Number(value);
    });
    return obj;
  });
}

// Пути
const configsDir = path.join(__dirname, '..', 'configs');
const outputDir = path.join(__dirname, '..', 'constants', 'generated');

// Создаем директорию для generated файлов
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Парсим xp-rewards.csv
console.log('Parsing xp-rewards.csv...');
const xpRewardsCSV = fs.readFileSync(path.join(configsDir, 'xp-rewards.csv'), 'utf8');
const xpRewardsData = parseCSV(xpRewardsCSV);
fs.writeFileSync(
  path.join(outputDir, 'xp-rewards.json'),
  JSON.stringify(xpRewardsData, null, 2)
);
console.log('✓ Generated xp-rewards.json');

// Парсим level-progression.csv
console.log('Parsing level-progression.csv...');
const levelProgressionCSV = fs.readFileSync(path.join(configsDir, 'level-progression.csv'), 'utf8');
const levelProgressionData = parseCSV(levelProgressionCSV);
fs.writeFileSync(
  path.join(outputDir, 'level-progression.json'),
  JSON.stringify(levelProgressionData, null, 2)
);
console.log('✓ Generated level-progression.json');

console.log('\n✅ All configs parsed successfully!');
