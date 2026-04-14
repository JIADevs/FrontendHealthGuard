const { networkInterfaces } = require('os');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

function getHostIP() {
    const interfaces = networkInterfaces();
    const candidates = [];
    
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                // Skip common virtual interfaces
                if (name.toLowerCase().includes('docker') || 
                    name.toLowerCase().includes('vboxnet') || 
                    name.toLowerCase().includes('vmware') || 
                    name.toLowerCase().includes('vethernet')) {
                    continue;
                }
                candidates.push({ name, address: iface.address });
            }
        }
    }
    
    // Prioritize Wi-Fi or Ethernet
    const priority = candidates.find(c => 
        c.name.toLowerCase().includes('wi-fi') || 
        c.name.toLowerCase().includes('wlan') || 
        c.name.toLowerCase().includes('eth') || 
        c.name.toLowerCase().includes('en0')
    );
    
    return priority ? priority.address : (candidates.length > 0 ? candidates[0].address : 'localhost');
}

const hostIP = getHostIP();
console.log(`\x1b[32m[Auto-IP] IP detectada para la red: ${hostIP}\x1b[0m`);

// Guardar en .env para que docker-compose lo vea incluso si se corre manualmente después
const envContent = `HOST_IP=${hostIP}\n`;
fs.writeFileSync(path.join(__dirname, '.env'), envContent);
console.log(`\x1b[34m[Auto-IP] Archivo .env actualizado con HOST_IP=${hostIP}\x1b[0m`);

const args = process.argv.slice(2);
const hasClear = args.includes('--clear');
const filteredArgs = args.filter(a => a !== '--clear');

const dockerArgs = ['up', '--build', ...filteredArgs];

// Si se pasó --clear, forzamos la recreación de contenedores
if (hasClear) {
    console.log(`\x1b[33m[Auto-IP] Limpieza de caché solicitada. Forzando recreación...\x1b[0m`);
    dockerArgs.push('--force-recreate');
}

console.log(`\x1b[33m[Auto-IP] Ejecutando: docker-compose ${dockerArgs.join(' ')}\x1b[0m`);

const env = { ...process.env, HOST_IP: hostIP };

// Spawn docker-compose
const dc = spawn('docker-compose', dockerArgs, {
    stdio: 'inherit',
    env: env,
    shell: true
});

dc.on('exit', (code) => {
    process.exit(code || 0);
});
