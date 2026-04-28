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
const BUILD_STAMP = new Date().toISOString();

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
const B2_BUCKET_NAME = process.env.B2_BUCKET_NAME;

console.log("🔧 B2 Config:", { 
    hasKeyId: !!B2_KEY_ID, 
    hasAppKey: !!B2_APPLICATION_KEY, 
    bucketId: B2_BUCKET_ID,
    bucketName: B2_BUCKET_NAME 
});

let b2AuthToken = null;
let b2ApiUrl = null;
let b2DownloadUrl = null;
let b2AccountId = null;
let b2ResolvedBucketName = null;

const REQUIRED_ENV = ['B2_KEY_ID', 'B2_APPLICATION_KEY', 'B2_BUCKET_ID', 'B2_BUCKET_NAME'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
    throw new Error(`[B2 CONFIG] Faltan variables requeridas: ${missingEnv.join(', ')}`);
}

function normalizeB2BucketUrl(rawUrl) {
    try {
        const u = new URL(rawUrl);
        const parts = u.pathname.split('/');
        // Expected: /file/<bucketName>/<filePath...>
        if (parts.length >= 4 && parts[1] === 'file') {
            const currentBucket = parts[2];
            const targetBucket = b2ResolvedBucketName || B2_BUCKET_NAME;
            if (currentBucket && currentBucket !== targetBucket) {
                parts[2] = targetBucket;
                u.pathname = parts.join('/');
                console.warn(`[B2 URL FIX] Bucket corregido: ${currentBucket} -> ${targetBucket}`);
            }
        }
        return u.toString();
    } catch {
        return rawUrl;
    }
}

async function getB2Auth() {
    if (b2AuthToken && b2ApiUrl && b2DownloadUrl && b2AccountId) {
        return { apiUrl: b2ApiUrl, token: b2AuthToken, downloadUrl: b2DownloadUrl, accountId: b2AccountId };
    }
    const credentials = Buffer.from(`${B2_KEY_ID}:${B2_APPLICATION_KEY}`).toString('base64');
    const res = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
        headers: { 'Authorization': `Basic ${credentials}` }
    });
    const data = await res.json();
    b2AuthToken = data.authorizationToken;
    b2ApiUrl = data.apiUrl;
    b2DownloadUrl = data.downloadUrl;
    b2AccountId = data.accountId;
    return { apiUrl: b2ApiUrl, token: b2AuthToken, downloadUrl: b2DownloadUrl, accountId: b2AccountId };
}

async function getEffectiveBucketName() {
    if (b2ResolvedBucketName) return b2ResolvedBucketName;

    try {
        const { apiUrl, token, accountId } = await getB2Auth();
        const res = await fetch(`${apiUrl}/b2api/v2/b2_list_buckets`, {
            method: 'POST',
            headers: { 'Authorization': token, 'Content-Type': 'application/json' },
            body: JSON.stringify({ accountId })
        });

        if (!res.ok) throw new Error(`b2_list_buckets ${res.status}`);
        const data = await res.json();
        const buckets = Array.isArray(data?.buckets) ? data.buckets : [];
        const matched = buckets.find((b) => b.bucketId === B2_BUCKET_ID);
        b2ResolvedBucketName = matched?.bucketName || B2_BUCKET_NAME;

        if (matched?.bucketName && matched.bucketName !== B2_BUCKET_NAME) {
            console.warn(`[B2 CONFIG] bucketName env (${B2_BUCKET_NAME}) no coincide con bucketId (${matched.bucketName}). Se usará ${matched.bucketName}.`);
        }
    } catch (e) {
        console.warn(`[B2 CONFIG] No se pudo resolver bucket por ID, usando env (${B2_BUCKET_NAME}): ${e.message}`);
        b2ResolvedBucketName = B2_BUCKET_NAME;
    }

    return b2ResolvedBucketName;
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
    port: PORT,
    bucketName: b2ResolvedBucketName || B2_BUCKET_NAME,
    bucketNameEnv: B2_BUCKET_NAME,
    buildStamp: BUILD_STAMP
}));

app.get('/api/config-check', (req, res) => res.json({
    status: 'ok',
    bucketName: b2ResolvedBucketName || B2_BUCKET_NAME,
    bucketNameEnv: B2_BUCKET_NAME,
    bucketIdSuffix: String(B2_BUCKET_ID).slice(-6),
    hasKeyId: !!B2_KEY_ID,
    hasAppKey: !!B2_APPLICATION_KEY,
    buildStamp: BUILD_STAMP
}));

const handleDownload = async (req, res) => {
    try {
        let { url } = req.query;
        if (!url || url === 'undefined' || url === 'null') {
            return res.status(400).json({ error: 'URL inválida' });
        }
        url = normalizeB2BucketUrl(url.trim());
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
    let tempPreviewPath = '';

    const isImageFile = (file) => file.mimetype?.startsWith('image/') || /\.(png|jpe?g|gif|webp)$/i.test(file.originalname || '');
    const isApkFile = (file) => file.mimetype === 'application/vnd.android.package-archive' || /\.apk$/i.test(file.originalname || '');
    const isPdfFile = (file) => file.mimetype === 'application/pdf' || /\.pdf$/i.test(file.originalname || '');
    const isWavFile = (file) => file.mimetype === 'audio/wav' || file.mimetype === 'audio/x-wav' || /\.wav$/i.test(file.originalname || '');
    const isMp3File = (file) => file.mimetype === 'audio/mpeg' || file.mimetype === 'audio/mp3' || /\.mp3$/i.test(file.originalname || '');
    const sha1 = (buffer) => crypto.createHash('sha1').update(buffer).digest('hex');
    const inferContentType = (file) => {
        if (isImageFile(file)) return file.mimetype || 'image/jpeg';
        if (isApkFile(file)) return 'application/vnd.android.package-archive';
        if (isPdfFile(file)) return 'application/pdf';
        if (isWavFile(file)) return 'audio/wav';
        if (isMp3File(file)) return 'audio/mpeg';
        return 'application/octet-stream';
    };
    const buildPublicUrl = async (fileName) => {
        const { downloadUrl } = await getB2Auth();
        return `${downloadUrl}/file/${B2_BUCKET_NAME}/${encodeURI(fileName)}`;
    };
    const uploadBufferToB2 = async ({ uploadNode, fileName, buffer, contentType }) => {
        const response = await fetch(uploadNode.uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': uploadNode.authorizationToken,
                'X-Bz-File-Name': encodeURIComponent(fileName),
                'Content-Type': contentType,
                'X-Bz-Content-Sha1': sha1(buffer),
                'Content-Length': buffer.length
            },
            body: buffer
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(`B2 Upload Error: ${data.message || data.code || response.status}`);
        return data;
    };

    try {
        const file = req.file;
        const b2Filename = String(req.body.fileName || '').trim();
        const generatePreview = req.body.generatePreview === 'true';

        if (!file || !b2Filename) {
            return res.status(400).json({ error: 'Falta archivo o fileName.' });
        }

        const uploadNode = await getUploadNode();
        const tmpId = crypto.randomBytes(8).toString('hex');
        const tmpDir = os.tmpdir();
        tempInputPath = path.join(tmpDir, `in_${tmpId}`);
        tempPreviewPath = path.join(tmpDir, `preview_${tmpId}`);

        // Main upload buffer (strict: keep original format, no transcode)
        let mainBuffer = file.buffer;
        const knownNonAudio = isImageFile(file) || isApkFile(file) || isPdfFile(file);
        const knownAudio = isMp3File(file) || isWavFile(file);
        if (!knownNonAudio && !knownAudio) {
            return res.status(400).json({ error: 'Formato no permitido. Solo WAV, MP3, imagen, APK o PDF.' });
        }

        const mainUpload = await uploadBufferToB2({
            uploadNode,
            fileName: b2Filename,
            buffer: mainBuffer,
            contentType: inferContentType(file)
        });
        const url = await buildPublicUrl(b2Filename);

        let mp3Url = null;
        let previewUrl = null;

        // 20-second preview for audio assets (same source format)
        const canPreview = !isImageFile(file) && !isApkFile(file) && !isPdfFile(file);
        if (generatePreview && canPreview) {
            fs.writeFileSync(tempInputPath, file.buffer);
            const previewExt = isWavFile(file) ? 'wav' : 'mp3';
            const previewOutputPath = `${tempPreviewPath}.${previewExt}`;
            await new Promise((resolve, reject) => {
                const cmd = ffmpeg().input(tempInputPath).setStartTime(20).setDuration(20);
                if (isWavFile(file)) {
                    cmd.audioCodec('pcm_s16le');
                } else {
                    cmd.audioCodec('libmp3lame').audioBitrate('64k');
                }
                cmd.output(previewOutputPath).on('end', resolve).on('error', reject).run();
            });
            const previewBuffer = fs.readFileSync(previewOutputPath);
            const previewFilename = b2Filename.replace(/\.(mp3|wav)$/i, `_preview.${previewExt}`);
            await uploadBufferToB2({
                uploadNode,
                fileName: previewFilename,
                buffer: previewBuffer,
                contentType: isWavFile(file) ? 'audio/wav' : 'audio/mpeg'
            });
            previewUrl = await buildPublicUrl(previewFilename);
        }

        res.json({
            success: true,
            url,
            previewUrl,
            mp3Url,
            fileId: mainUpload.fileId
        });
    } catch (error) {
        console.error('[UPLOAD] Error:', error);
        res.status(500).json({ error: error.message || 'Error interno subiendo archivo.' });
    } finally {
        [tempInputPath, `${tempPreviewPath}.mp3`, `${tempPreviewPath}.wav`].forEach((p) => {
            if (p && fs.existsSync(p)) fs.unlinkSync(p);
        });
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
