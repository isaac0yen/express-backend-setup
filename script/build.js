const fs = require('fs');
const path = require('path');

async function buildFiles() {
  const files = ['package.json', '.env'];
  const folders = ['src/templates', 'public']; // Add public folder to be copied

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
    let destFolder;

    // Handle different folder mappings
    if (folder === 'public') {
      destFolder = path.join('dist', 'public'); // Keep public as public
    } else {
      destFolder = path.join('dist', folder.replace('src/', '')); // Map src/templates to dist/templates
    }

    if (fs.existsSync(sourceFolder)) {
      fs.mkdirSync(destFolder, { recursive: true });

      // Copy all files and subdirectories recursively
      function copyRecursive(src, dest) {
        const items = fs.readdirSync(src);

        items.forEach((item) => {
          const srcPath = path.join(src, item);
          const destPath = path.join(dest, item);

          if (fs.lstatSync(srcPath).isDirectory()) {
            fs.mkdirSync(destPath, { recursive: true });
            copyRecursive(srcPath, destPath);
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
        });
      }

      copyRecursive(sourceFolder, destFolder);
    }
  }
}

buildFiles().catch(console.error);
