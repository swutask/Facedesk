// api/s3-upload.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const config = { runtime: "edge" };

/**
 * Minimal shim so TS accepts `process.env` in Edge runtime without @types/node.
 * Vercel injects envs at runtime; this just quiets the type checker.
 */
declare const process:
  | undefined
  | {
      env: {
        S3_REGION?: string;
        S3_ACCESS_KEY_ID?: string;
        S3_SECRET_ACCESS_KEY?: string;
        S3_BUCKET?: string;
      };
    };

/** Safe env reader with helpful errors */
function env(name: keyof NonNullable<typeof process>["env"]): string {
  const v = (process as any)?.env?.[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

// 👇 Important for dotted buckets + HTTPS: use path-style to avoid TLS mismatch
const s3 = new S3Client({
  region: env("S3_REGION"),
  credentials: {
    accessKeyId: env("S3_ACCESS_KEY_ID"),
    secretAccessKey: env("S3_SECRET_ACCESS_KEY"),
  },
  forcePathStyle: true,
});

const ALLOWED = new Set(["image/jpeg", "image/png", "video/mp4"]);
const MAX_MB = 20;

type FileMeta = { filename: string; filetype: string; size?: number };

function sanitizeBase(name: string) {
  const base = name.replace(/\.[^/.]+$/, "");
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}
function extOf(name: string) {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
    });
  }

  try {
    const body = await req.json().catch(() => ({}));

    // Support both single and batch payloads
    const files: FileMeta[] = Array.isArray(body?.files)
      ? body.files
      : body?.filename && body?.filetype
      ? [{ filename: body.filename, filetype: body.filetype, size: body.size }]
      : [];

    if (files.length === 0) {
      return new Response(JSON.stringify({ message: "No files provided" }), {
        status: 400,
      });
    }

    const bucket = env("S3_BUCKET");
    const region = env("S3_REGION");

    const results: Array<{
      uploadUrl: string;
      fileUrl: string;
      key: string;
      filetype: string;
    }> = [];

    for (const f of files) {
      const { filename, filetype, size } = f || {};

      if (!filename || !filetype) {
        return new Response(
          JSON.stringify({ message: "filename and filetype required" }),
          { status: 400 }
        );
      }
      if (!ALLOWED.has(filetype)) {
        return new Response(
          JSON.stringify({ message: "Only JPEG, PNG, and MP4 are allowed" }),
          { status: 400 }
        );
      }
      if (typeof size === "number" && size > MAX_MB * 1024 * 1024) {
        return new Response(
          JSON.stringify({ message: `File must be less than ${MAX_MB}MB` }),
          { status: 400 }
        );
      }

      const base = sanitizeBase(filename);
      const ext = extOf(filename);
      const uid = crypto.randomUUID();
      const key = `rooms/${base}-${uid}${ext}`;

      const cmd = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        ContentType: filetype,
      });

      // Presign PUT (path-style due to forcePathStyle: true)
      const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn: 300 });

      // Public URL (path-style; safe for dotted buckets)
      const encodedKey = encodeURIComponent(key).replace(/%2F/g, "/");
      const fileUrl = `https://s3.${region}.amazonaws.com/${bucket}/${encodedKey}`;

      results.push({ uploadUrl, fileUrl, key, filetype });
    }

    // Back-compat for single file
    const payload = Array.isArray(body?.files) ? { files: results } : results[0];

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("signer error:", e?.message || e);
    return new Response(
      JSON.stringify({
        message: "Failed to generate signed URL",
        detail: e?.message || String(e),
      }),
      { status: 500 }
    );
  }
}
