const fs = require('fs');
const path = require('path');

function cp(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function cpDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const f of fs.readdirSync(srcDir)) {
    const s = path.join(srcDir, f);
    const d = path.join(destDir, f);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) cpDir(s, d);
    else cp(s, d);
  }
}

try {
  cp('node_modules/bootstrap/dist/css/bootstrap.min.css', 'public/vendor/bootstrap.min.css');
  cp('node_modules/bootstrap/dist/js/bootstrap.bundle.min.js', 'public/vendor/bootstrap.bundle.min.js');
  cp('node_modules/jquery/dist/jquery.min.js', 'public/vendor/jquery.min.js');
  cp('node_modules/sweetalert2/dist/sweetalert2.all.min.js', 'public/vendor/sweetalert2.all.min.js');
  cp('node_modules/@fortawesome/fontawesome-free/css/all.min.css', 'public/vendor/fontawesome/css/all.min.css');
  cpDir('node_modules/@fortawesome/fontawesome-free/webfonts', 'public/vendor/fontawesome/webfonts');
  // Chart.js
  cp('node_modules/chart.js/dist/chart.umd.js', 'public/js/chart.min.js');
  console.log('Vendor assets copied.');
} catch (e) {
  console.warn('Vendor copy failed:', e.message);
}
