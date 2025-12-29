// Performance Audit Script for JeanTrail
const fs = require('fs');
const path = require('path');

function analyzeBundleSize() {
  const distPath = path.join(__dirname, '../dist');
  if (!fs.existsSync(distPath)) {
    console.log('❌ No dist folder found. Run "npm run build" first.');
    return;
  }

  const stats = {};
  let totalSize = 0;

  function calculateSize(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        calculateSize(filePath);
      } else {
        const fileSize = stat.size;
        const relativePath = path.relative(distPath, filePath);
        stats[relativePath] = fileSize;
        totalSize += fileSize;
      }
    });
  }

  calculateSize(distPath);

  console.log('📊 Bundle Size Analysis:');
  console.log('========================');
  console.log(`Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  
  // Sort files by size
  const sortedFiles = Object.entries(stats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  console.log('\n📁 Largest files:');
  sortedFiles.forEach(([file, size]) => {
    console.log(`  ${(size / 1024).toFixed(2)} KB - ${file}`);
  });

  // Performance targets
  const targets = {
    total: 50 * 1024 * 1024, // 50MB
    js: 5 * 1024 * 1024,     // 5MB
    css: 1 * 1024 * 1024,    // 1MB
    images: 10 * 1024 * 1024 // 10MB
  };

  console.log('\n🎯 Performance Targets:');
  console.log(`Total: ${(totalSize / 1024 / 1024).toFixed(2)} MB (target: <${targets.total / 1024 / 1024} MB)`);
  
  const jsSize = Object.entries(stats)
    .filter(([file]) => file.endsWith('.js'))
    .reduce((sum, [, size]) => sum + size, 0);
  
  console.log(`JS: ${(jsSize / 1024 / 1024).toFixed(2)} MB (target: <${targets.js / 1024 / 1024} MB)`);
  
  const cssSize = Object.entries(stats)
    .filter(([file]) => file.endsWith('.css'))
    .reduce((sum, [, size]) => sum + size, 0);
  
  console.log(`CSS: ${(cssSize / 1024).toFixed(2)} KB (target: <${targets.css / 1024} KB)`);

  // Recommendations
  console.log('\n💡 Recommendations:');
  if (totalSize > targets.total) {
    console.log('⚠️  Bundle size exceeds target. Consider code splitting and lazy loading.');
  }
  if (jsSize > targets.js) {
    console.log('⚠️  JavaScript bundle is large. Consider tree shaking and minification.');
  }
  if (cssSize > targets.css) {
    console.log('⚠️  CSS bundle is large. Consider CSS purging and optimization.');
  }

  return { totalSize, stats };
}

function analyzeSourceCode() {
  const srcPath = path.join(__dirname, '../src');
  
  function countFiles(dir, extension) {
    if (!fs.existsSync(dir)) return 0;
    
    let count = 0;
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        count += countFiles(filePath, extension);
      } else if (file.endsWith(extension)) {
        count++;
      }
    });
    
    return count;
  }

  const tsFiles = countFiles(srcPath, '.ts');
  const tsxFiles = countFiles(srcPath, '.tsx');
  const jsFiles = countFiles(srcPath, '.js');
  const jsxFiles = countFiles(srcPath, '.jsx');
  const cssFiles = countFiles(srcPath, '.css');

  console.log('\n📝 Source Code Analysis:');
  console.log('========================');
  console.log(`TypeScript files: ${tsFiles}`);
  console.log(`TSX files: ${tsxFiles}`);
  console.log(`JavaScript files: ${jsFiles}`);
  console.log(`JSX files: ${jsxFiles}`);
  console.log(`CSS files: ${cssFiles}`);
  console.log(`Total source files: ${tsFiles + tsxFiles + jsFiles + jsxFiles + cssFiles}`);

  // Performance targets for source code
  const totalSourceFiles = tsFiles + tsxFiles + jsFiles + jsxFiles;
  if (totalSourceFiles > 100) {
    console.log('💡 Consider splitting into smaller modules for better maintainability.');
  }
}

function analyzeDependencies() {
  const packageJsonPath = path.join(__dirname, '../package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json not found.');
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};

  console.log('\n📦 Dependencies Analysis:');
  console.log('========================');
  console.log(`Production dependencies: ${Object.keys(dependencies).length}`);
  console.log(`Development dependencies: ${Object.keys(devDependencies).length}`);

  // Check for potential issues
  const largeDeps = ['@tanstack/react-query', 'framer-motion', 'recharts'];
  const heavyDeps = Object.keys(dependencies).filter(dep => 
    largeDeps.some(heavy => dep.includes(heavy))
  );

  if (heavyDeps.length > 0) {
    console.log('⚠️  Heavy dependencies detected:');
    heavyDeps.forEach(dep => {
      console.log(`  - ${dep}`);
    });
    console.log('💡 Consider lazy loading or lighter alternatives.');
  }

  // Check for duplicate functionality
  const routerLibs = Object.keys(dependencies).filter(dep => 
    dep.includes('router') || dep.includes('navigation')
  );
  
  if (routerLibs.length > 1) {
    console.log('⚠️  Multiple routing libraries detected. Consider consolidating.');
  }
}

function analyzePerformanceMetrics() {
  console.log('\n⚡ Performance Metrics:');
  console.log('======================');
  
  // Check for performance optimizations
  const viteConfigPath = path.join(__dirname, '../vite.config.ts');
  
  if (fs.existsSync(viteConfigPath)) {
    const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    const hasCodeSplitting = viteConfig.includes('manualChunks') || viteConfig.includes('splitVendorChunkPlugin');
    const hasTreeShaking = viteConfig.includes('treeshake');
    const hasMinification = viteConfig.includes('minify');
    
    console.log(`Code splitting: ${hasCodeSplitting ? '✅' : '❌'}`);
    console.log(`Tree shaking: ${hasTreeShaking ? '✅' : '❌'}`);
    console.log(`Minification: ${hasMinification ? '✅' : '❌'}`);
  }

  // Check for lazy loading indicators
  const srcPath = path.join(__dirname, '../src');
  
  function checkLazyLoading(dir) {
    if (!fs.existsSync(dir)) return false;
    
    const files = fs.readdirSync(dir);
    let hasLazy = false;
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        hasLazy = hasLazy || checkLazyLoading(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('lazy(') || content.includes('React.lazy')) {
          hasLazy = true;
        }
      }
    });
    
    return hasLazy;
  }

  const hasLazyLoading = checkLazyLoading(srcPath);
  console.log(`Lazy loading: ${hasLazyLoading ? '✅' : '❌'}`);
}

function generateReport() {
  console.log('\n📋 Performance Audit Report');
  console.log('===========================');
  console.log(`Generated at: ${new Date().toISOString()}`);
  
  analyzeBundleSize();
  analyzeSourceCode();
  analyzeDependencies();
  analyzePerformanceMetrics();
  
  console.log('\n✅ Performance audit completed!');
  console.log('💡 Review the recommendations above to optimize performance.');
}

// Run the audit
if (require.main === module) {
  generateReport();
}

module.exports = {
  analyzeBundleSize,
  analyzeSourceCode,
  analyzeDependencies,
  analyzePerformanceMetrics,
  generateReport
};