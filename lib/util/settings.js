import fs from 'fs';

export default (() => JSON.parse(
  // provide a path to a settings file, or use a default one
  fs.readFileSync(process.argv[2] || 'settings.json'),
  'utf8',
))();
