const fs = require('fs');
const path = require('path');

async function buildFiles() {
  const files = ['package.json', '.env'];
  const folders = []; // Ensure this path is correct

  for (const file of files) {
    if (file === 'package.json') {
      const packageJson = JSON.parse(fs.readFileSync(file, 'utf8'));
      packageJson.type = 'commonjs';

      if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
      }

      // Write modified package.json to dist
      fs.writeFileSync(
        path.join('dist', 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );
    } else {
      // Handle other files here
      const content = fs.readFileSync(file, 'utf8');
      fs.writeFileSync(path.join('dist', file), content);
    }
  }

  for (const folder of folders) {
    const sourceFolder = path.join(__dirname, '..', folder);
    const destFolder = path.join('dist', folder.replace('src/', '')); // Correctly map src/templates to dist/templates

    if (fs.existsSync(sourceFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });

      fs.readdirSync(sourceFolder).forEach((file) => {
        const sourceFile = path.join(sourceFolder, file);
        const destFile = path.join(destFolder, file);

        if (fs.lstatSync(sourceFile).isFile()) {
          fs.copyFileSync(sourceFile, destFile);
        }
      });
    }
  }
}

buildFiles().catch(console.error).finally(() => console.log('Finished!'));
