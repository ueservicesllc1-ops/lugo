import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import os from 'os';

ffmpeg.setFfmpegPath(ffmpegStatic);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distPath = path.join(__dirname, 'dist');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Length', 'Content-Range', 'Accept-Ranges'],
    credentials: true
}));
app.use(express.json({ limit: '5gb' }));
app.use(express.urlencoded({ limit: '5gb', extended: true }));

const B2_KEY_ID = process.env.B2_KEY_ID;
const B2_APPLICATION_KEY = process.env.B2_APPLICATION_KEY;
const B2_BUCKET_ID = process.env.B2_BUCKET_ID;
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME || 'mixercur';

console.log("🔧 B2 Config:", { 
    hasKeyId: !!B2_KEY_ID, 
    hasAppKey: !!B2_APPLICATION_KEY, 
    bucketId: B2_BUCKET_ID,
    bucketName: B2_BUCKET_NAME 
});

let b2AuthToken = null;
let b2ApiUrl = null;

async function getB2Auth() {
    if (b2AuthToken && b2ApiUrl) return { apiUrl: b2ApiUrl, token: b2AuthToken };
    const credentials = Buffer.from(`${B2_KEY_ID}:${B2_APPLICATION_KEY}`).toString('base64');
    const res = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
        headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    b2AuthToken = data.authorizationToken;
    b2ApiUrl = data.apiUrl;
    return { apiUrl: b2ApiUrl, token: b2AuthToken };
}

async function getUploadNode() {
    const { apiUrl, token } = await getB2Auth();
    const res = await fetch(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
        method: 'POST',
        headers: { 'Authorization': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketId: B2_BUCKET_ID })
    });
    if (!res.ok) {
        b2AuthToken = null;
        throw new Error('Upload URL fail');
    }
    return res.json();
}

app.get('/api/health', (req, res) => res.json({
    status: 'ok',
    service: 'B2 Proxy (PayPal Era)',
    distExists: fs.existsSync(distPath),
    port: PORT
}));

const handleDownload = async (req, res) => {
    try {
        let { url } = req.query;
        if (!url || url === 'undefined' || url === 'null') {
            return res.status(400).json({ error: 'URL inválida' });
        }
        url = url.trim();
        console.log(`[PROXY] Descargando audio desde: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`[PROXY] B2 devolvió error ${response.status} para: ${url}`);
            throw new Error(`B2 Error ${response.status}`);
        }

        res.set({
            'Content-Type': response.headers.get('content-type') || 'audio/mpeg',
            'Access-Control-Allow-Origin': '*'
        });

        if (response.body && response.body.pipe) {
            response.body.pipe(res);
        } else if (response.body) {
            Readable.fromWeb(response.body).pipe(res);
        } else {
            throw new Error("Cuerpo de respuesta vacío");
        }
    } catch (error) {
        console.error("🚨 Error detallado en proxy download:", error.message);
        if (!res.headersSent) {
            res.status(500).json({ error: "Fallo al obtener el audio.", details: error.message });
        }
    }
};

app.get('/api/download', handleDownload);
app.get('/download', handleDownload);

app.post('/api/upload', upload.single('audioFile'), async (req, res) => {
    let tempInputPath = '';
    let tempOutputPath = '';
    let tempPreviewPath = '';
    try {
        const file = req.file;
        const b2Filename = req.body.fileName;
        const generatePreview = req.body.generatePreview === 'true';

        if (!file || !b2Filename) return res.status(400).json({ error: 'Falta archivo' });

        const uploadNode = await getUploadNode();
        const tempId = crypto.randomBytes(8).toString('hex');
        const tmpDir = os.tmpdir();
        tempInputPath = path.join(tmpDir, `in_${tempId}`);
        tempOutputPath = path.join(tmpDir, `out_${tempId}.mp3`);
        tempPreviewPath = path.join(tmpDir, `prev_${tempId}.mp3`);

        const isMp3 = file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3' || file.originalname.toLowerCase().endsWith('.mp3');
        const isImage = file.mimetype?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(file.originalname);
        const isApk = file.mimetype === 'application/vnd.android.package-archive' || file.originalname.toLowerCase().endsWith('.apk');
        const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
        const isWav = file.mimetype === 'audio/wav' || file.mimetype === 'audio/x-wav' || file.originalname.toLowerCase().endsWith('.wav');

        let dataBuffer = file.buffer;

        if (!(isMp3 || isWav || isImage || isApk || isPdf)) {
            console.log("🔄 Transcodificando a MP3...");
            fs.writeFileSync(tempInputPath, file.buffer);
            await new Promise((resolve, reject) => {
                ffmpeg().input(tempInputPath).audioCodec('libmp3lame').audioBitrate('128k').output(tempOutputPath).on('end', resolve).on('error', reject).run();
            });
            dataBuffer = fs.readFileSync(tempOutputPath);
        }

        const sha1 = crypto.createHash('sha1').update(dataBuffer).digest('hex');
        let contentType = 'audio/mpeg';
        if (isImage) contentType = file.mimetype || 'image/jpeg';
        else if (isApk) contentType = 'application/vnd.android.package-archive';
        else if (isPdf) contentType = 'application/pdf';
        else if (isWav) contentType = 'audio/wav';

        const b2Response = await fetch(uploadNode.uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': uploadNode.authorizationToken,
                'X-Bz-File-Name': encodeURIComponent(b2Filename),
                'Content-Type': contentType,
                'X-Bz-Content-Sha1': sha1,
                'Content-Length': dataBuffer.length
            },
            body: dataBuffer
        });
        const b2Data = await b2Response.json();
        if (!b2Response.ok) throw new Error(`B2 Upload Error: ${b2Data.message || b2Data.code}`);

        const finalUrl = `https://f005.backblazeb2.com/file/${B2_BUCKET_NAME}/${encodeURI(b2Filename)}`;

        let previewUrl = null;
        if (generatePreview && !isImage) {
            try {
                if (!fs.existsSync(tempInputPath)) fs.writeFileSync(tempInputPath, file.buffer);
                await new Promise((resolve, reject) => {
                    ffmpeg().input(tempInputPath).setStartTime(20).setDuration(20).audioCodec('libmp3lame').audioBitrate('64k').output(tempPreviewPath).on('end', resolve).on('error', reject).run();
                });
                const previewBuffer = fs.readFileSync(tempPreviewPath);
                const previewSha1 = crypto.createHash('sha1').update(previewBuffer).digest('hex');
                const previewFilename = b2Filename.replace('.mp3', '_preview.mp3');

                const pB2Resp = await fetch(uploadNode.uploadUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': uploadNode.authorizationToken,
                        'X-Bz-File-Name': encodeURIComponent(previewFilename),
                        'Content-Type': 'audio/mpeg',
                        'X-Bz-Content-Sha1': previewSha1,
                        'Content-Length': previewBuffer.length
                    },
                    body: previewBuffer
                });
                if (pB2Resp.ok) previewUrl = `https://f005.backblazeb2.com/file/${B2_BUCKET_NAME}/${encodeURI(previewFilename)}`;
            } catch (prevErr) { console.warn("⚠️ Preview fail:", prevErr.message); }
        }

        res.json({ success: true, url: finalUrl, previewUrl, fileId: b2Data.fileId });
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ error: error.message });
    } finally {
        if (tempInputPath && fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
        if (tempOutputPath && fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
        if (tempPreviewPath && fs.existsSync(tempPreviewPath)) fs.unlinkSync(tempPreviewPath);
    }
});

app.post('/api/delete-file', async (req, res) => {
    try {
        const { fileId, fileName } = req.body;
        const { apiUrl, token } = await getB2Auth();
        const b2Response = await fetch(`${apiUrl}/b2api/v2/b2_delete_file_version`, {
            method: 'POST',
            headers: { 'Authorization': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId, fileName })
        });
        if (!b2Response.ok) throw new Error('B2 delete fail');
        res.json({ success: true });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/list-files', async (req, res) => {
    try {
        const { apiUrl, token } = await getB2Auth();
        const b2Response = await fetch(`${apiUrl}/b2api/v2/b2_list_file_names`, {
            method: 'POST',
            headers: { 'Authorization': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucketId: B2_BUCKET_ID, maxFileCount: 1000 })
        });
        const data = await b2Response.json();
        res.json(data.files);
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// SPA & Static
if (fs.existsSync(distPath)) app.use(express.static(distPath));

app.use((req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).send("Frontend not found");
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Proxy B2 listo en puerto ${PORT} (Soporte PayPal)`);
});
