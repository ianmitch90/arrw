const fs = require('fs');
const path = require('path');

const UI_COMPONENTS_DIR = path.join(process.cwd(), 'components', 'ui');

function toPascalCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter) => letter.toUpperCase())
    .replace(/\s+/g, '');
}

function shouldRename(filename) {
  // Skip already correctly named files
  if (/^[A-Z][a-zA-Z]*\.tsx?$/.test(filename)) return false;
  return true;
}

function getNewFilename(filename) {
  const ext = path.extname(filename);
  const basename = path.basename(filename, ext);
  return `${toPascalCase(basename)}${ext}`;
}

function findFilesToRename(dir) {
  const filesToRename = [];

  function traverse(currentDir) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Rename directory if needed
        const newDirName = toPascalCase(file);
        if (file !== newDirName) {
          const newDirPath = path.join(path.dirname(fullPath), newDirName);
          filesToRename.push({
            oldPath: fullPath,
            newPath: newDirPath,
          });
        }
        traverse(fullPath);
      } else if (shouldRename(file)) {
        const newFilename = getNewFilename(file);
        if (file !== newFilename) {
          filesToRename.push({
            oldPath: fullPath,
            newPath: path.join(path.dirname(fullPath), newFilename),
          });
        }
      }
    }
  }

  traverse(dir);
  return filesToRename;
}

function updateImports(filePath, renames) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;

  for (const { oldPath, newPath } of renames) {
    const oldImport = path.relative(path.dirname(filePath), oldPath);
    const newImport = path.relative(path.dirname(filePath), newPath);

    // Update both ESM and CommonJS imports
    if (content.includes(oldImport)) {
      content = content
        .replace(
          new RegExp(`from ['"]${oldImport}['"]`, 'g'),
          `from '${newImport}'`
        )
        .replace(
          new RegExp(`require\\(['"]${oldImport}['"]\\)`, 'g'),
          `require('${newImport}')`
        );
      hasChanges = true;
    }
  }

  if (hasChanges) {
    fs.writeFileSync(filePath, content);
  }
}

function renameFiles() {
  console.log('🔍 Finding files to rename...');
  const filesToRename = findFilesToRename(UI_COMPONENTS_DIR);

  if (filesToRename.length === 0) {
    console.log('✨ All files are already correctly named!');
    return;
  }

  console.log('\n📝 Files to rename:');
  filesToRename.forEach(({ oldPath, newPath }) => {
    console.log(`  ${path.relative(UI_COMPONENTS_DIR, oldPath)} → ${path.relative(UI_COMPONENTS_DIR, newPath)}`);
  });

  console.log('\n🔄 Updating imports...');
  const allFiles = getAllFiles(UI_COMPONENTS_DIR);
  allFiles.forEach(file => updateImports(file, filesToRename));

  console.log('\n✨ Renaming files...');
  // Sort by path depth (deepest first) to handle nested renames correctly
  filesToRename
    .sort((a, b) => b.oldPath.split(path.sep).length - a.oldPath.split(path.sep).length)
    .forEach(({ oldPath, newPath }) => {
      fs.renameSync(oldPath, newPath);
      console.log(`  Renamed: ${path.relative(UI_COMPONENTS_DIR, oldPath)} → ${path.relative(UI_COMPONENTS_DIR, newPath)}`);
    });

  console.log('\n✅ All files have been renamed successfully!');
}

function getAllFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (path.extname(item) === '.tsx' || path.extname(item) === '.ts') {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

// Run the script
renameFiles();
