// api/s3-delete.ts
import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3";

export const config = { runtime: "edge" };

/**
 * Minimal shim so TS accepts `process.env` in Edge runtime without @types/node.
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

function env(name: keyof NonNullable<typeof process>["env"]): string {
  const v = (process as any)?.env?.[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

// Use path-style addressing (good for dotted buckets + HTTPS)
const s3 = new S3Client({
  region: env("S3_REGION"),
  credentials: {
    accessKeyId: env("S3_ACCESS_KEY_ID"),
    secretAccessKey: env("S3_SECRET_ACCESS_KEY"),
  },
  forcePathStyle: true,
});

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const bucket = env("S3_BUCKET");

    // Accept either a single key or multiple keys
    let keys: string[] = [];
    if (typeof body?.key === "string") {
      keys = [body.key];
    } else if (Array.isArray(body?.keys)) {
      keys = body.keys.filter((k: unknown) => typeof k === "string");
    }

    if (keys.length === 0) {
      return new Response(JSON.stringify({ message: "No key(s) provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Single delete
    if (keys.length === 1) {
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: keys[0] }));
      return new Response(JSON.stringify({ deleted: keys }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Batch delete
    const res = await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: keys.map((Key) => ({ Key })) },
      })
    );

    return new Response(
      JSON.stringify({
        deleted: (res.Deleted ?? []).map((d) => d.Key),
        errors: res.Errors ?? [],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("s3-delete error:", e?.message || e);
    return new Response(
      JSON.stringify({
        message: "Failed to delete object(s)",
        detail: e?.message || String(e),
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
