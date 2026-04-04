import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ffmpegPath = path.resolve('node_modules/ffmpeg-static/ffmpeg.exe');
const padsDir = path.resolve('public/pads');
const tempDir = path.resolve('public/pads_temp');

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

const files = fs.readdirSync(padsDir).filter(f => f.endsWith('.mp3'));

console.log(`\n🎵 Comprimiendo ${files.length} pads...\n`);

let totalBefore = 0;
let totalAfter = 0;

for (const file of files) {
    const inputPath = path.join(padsDir, file);
    const outputPath = path.join(tempDir, file);
    const sizeBefore = fs.statSync(inputPath).size;
    totalBefore += sizeBefore;

    console.log(`⏳ ${file} (${(sizeBefore / 1024 / 1024).toFixed(2)} MB)...`);
    try {
        // -map 0:a   → solo audio, ELIMINA la imagen de portada embebida (~1.1MB por archivo)
        // -ab 32k    → 32kbps es suficiente para pads atmosféricos de fondo
        // -ar 44100  → sample rate estándar
        // -y         → sobreescribir
        execSync(
            `"${ffmpegPath}" -i "${inputPath}" -map 0:a -ab 32k -ar 44100 -y "${outputPath}"`,
            { stdio: 'pipe' }  // silencioso
        );

        const sizeAfter = fs.statSync(outputPath).size;
        totalAfter += sizeAfter;

        // Reemplazar original
        fs.unlinkSync(inputPath);
        fs.renameSync(outputPath, inputPath);

        const reduction = (((sizeBefore - sizeAfter) / sizeBefore) * 100).toFixed(1);
        console.log(`   ✅ ${(sizeAfter / 1024 / 1024).toFixed(2)} MB  (-${reduction}%)\n`);
    } catch (err) {
        console.error(`   ❌ Error en ${file}:`, err.message);
    }
}

// Limpiar carpeta temporal
if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
}

console.log('═══════════════════════════════════');
console.log(`📦 Total antes : ${(totalBefore / 1024 / 1024).toFixed(2)} MB`);
console.log(`📦 Total después: ${(totalAfter / 1024 / 1024).toFixed(2)} MB`);
console.log(`🚀 Reducción   : ${(((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1)}%`);
console.log('═══════════════════════════════════');
console.log('✅ ¡Todos los pads comprimidos!');
