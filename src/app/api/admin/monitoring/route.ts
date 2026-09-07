import { NextResponse } from "next/server";
import { requireSuperuser } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireSuperuser();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const timestamp = new Date().toISOString();

  // 1. Check Hugging Face Backend API
  const hfStart = Date.now();
  const backendUrl = process.env.API_BASE_URL || "http://localhost:7860";
  let hfData = {
    status: "offline",
    latencyMs: 0,
    statusCode: 0,
    url: backendUrl,
    hardware: "2 vCPU · 16 GB RAM",
    runtime: "Docker · Python",
    region: "us-east-1",
    regionFlagUrl: "https://flagcdn.com/w20/us.png",
    keepAlive: "Active",
    error: null as string | null,
  };

  try {
    const hfRes = await fetch(backendUrl, {
      method: "GET",
      cache: "no-store",
      headers: { "User-Agent": "Dramova-Monitoring/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    hfData.latencyMs = Date.now() - hfStart;
    hfData.statusCode = hfRes.status;
    hfData.status = hfRes.ok || hfRes.status === 200 || hfRes.status === 404 ? "online" : "degraded";
    const ct = hfRes.headers.get("x-hf-runtime") || hfRes.headers.get("server") || "";
    if (ct) hfData.runtime = ct.replace(/\s*\d+(\.\d+)*/g, "").replace(/\s{2,}/g, " ").trim().slice(0, 30) || "Docker · Python";
  } catch (err: unknown) {
    hfData.latencyMs = Date.now() - hfStart;
    hfData.status = "offline";
    hfData.error = err instanceof Error ? err.message : String(err);
  }

  // 2. Check Supabase (Database & Services)
  const sbStart = Date.now();
  const REGION_MAP: Record<string, { flag: string; code: string; cc: string }> = {
    "ap-southeast-1": { flag: "🇸🇬", code: "ap-southeast-1", cc: "sg" },
    "ap-northeast-1": { flag: "🇯🇵", code: "ap-northeast-1", cc: "jp" },
    "us-east-1": { flag: "🇺🇸", code: "us-east-1", cc: "us" },
    "eu-central-1": { flag: "🇩🇪", code: "eu-central-1", cc: "de" },
    "eu-west-1": { flag: "🇮🇪", code: "eu-west-1", cc: "ie" },
  };
  const rawRegion = process.env.SUPABASE_REGION || process.env.NEXT_PUBLIC_SUPABASE_REGION || "ap-southeast-1";
  const regionInfo = REGION_MAP[rawRegion] || REGION_MAP["ap-southeast-1"];
  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  const DB_QUOTA_BYTES = Number(process.env.SUPABASE_DB_QUOTA_MB || 500) * 1024 * 1024;
  const DB_QUOTA_LABEL = formatBytes(DB_QUOTA_BYTES);
  const STORAGE_QUOTA_BYTES = Number(process.env.SUPABASE_STORAGE_QUOTA_MB || 1024) * 1024 * 1024;
  const STORAGE_QUOTA_LABEL = formatBytes(STORAGE_QUOTA_BYTES);
  let supabaseData = {
    status: "healthy",
    latencyMs: 0,
    dbSize: "N/A",
    dbSizeBytes: 0,
    dbQuotaBytes: DB_QUOTA_BYTES,
    dbQuota: DB_QUOTA_LABEL,
    tablesCount: 0,
    storageUsedBytes: 0,
    storageUsed: "0 KB",
    storageQuota: STORAGE_QUOTA_LABEL,
    storageQuotaBytes: STORAGE_QUOTA_BYTES,
    database: "PostgreSQL",
    hardware: "Shared · 2 vCPU · Auto-scale",
    region: regionInfo.code,
    regionFlag: regionInfo.flag,
    regionFlagUrl: `https://flagcdn.com/w20/${regionInfo.cc}.png`,
    error: null as string | null,
  };

  try {
    const adminClient = createAdminClient();
    const { count: usersCount, error: countErr } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true });
    if (countErr) throw countErr;
    supabaseData.latencyMs = Date.now() - sbStart;
    supabaseData.tablesCount = 6;
    try {
      const { data: storageList } = await adminClient.storage.from("avatars").list("", { limit: 100 });
      if (storageList) {
        supabaseData.storageUsedBytes = storageList.length * 80000;
        supabaseData.storageUsed = formatBytes(supabaseData.storageUsedBytes);
      }
    } catch {}
    let dbSizeResolved = false;
    try {
      const { data: connData } = await adminClient.rpc("get_db_stats").single();
      if (connData && typeof connData === "object") {
        const stats = connData as Record<string, unknown>;
        if (stats.db_size_bytes) {
          supabaseData.dbSizeBytes = Number(stats.db_size_bytes);
          supabaseData.dbSize = formatBytes(supabaseData.dbSizeBytes);
          dbSizeResolved = true;
        } else if (stats.db_size) {
          supabaseData.dbSize = String(stats.db_size);
          const m = String(stats.db_size).match(/([\d.]+)\s*MB/i);
          if (m) supabaseData.dbSizeBytes = Math.round(parseFloat(m[1]) * 1024 * 1024);
          else {
            const k = String(stats.db_size).match(/([\d.]+)\s*KB/i);
            if (k) supabaseData.dbSizeBytes = Math.round(parseFloat(k[1]) * 1024);
          }
          dbSizeResolved = true;
        }
      }
    } catch {}
    if (!dbSizeResolved) {
      try {
        const tables = ["profiles", "watch_history", "watch_rooms", "watch_room_participants", "user_activity", "admin_audit_logs"] as const;
        let totalBytes = 0;
        for (const tbl of tables) {
          const { data, error } = await adminClient.from(tbl).select("*").limit(50);
          if (!error && data) {
            const sampleBytes = new TextEncoder().encode(JSON.stringify(data)).length;
            const avgRow = data.length ? sampleBytes / data.length : 1024;
            const { count } = await adminClient.from(tbl).select("*", { count: "exact", head: true });
            totalBytes += Math.round((count || data.length) * avgRow);
          }
        }
        totalBytes += supabaseData.storageUsedBytes;
        totalBytes = Math.max(totalBytes, 1024 * 80);
        supabaseData.dbSizeBytes = totalBytes;
        supabaseData.dbSize = formatBytes(totalBytes);
      } catch {
        supabaseData.dbSize = formatBytes(supabaseData.dbSizeBytes || 0);
      }
    }
    supabaseData.dbSize = `${supabaseData.dbSize} / ${supabaseData.dbQuota}`;
  } catch (err: unknown) {
    supabaseData.latencyMs = Date.now() - sbStart;
    supabaseData.status = "degraded";
    supabaseData.error = err instanceof Error ? err.message : String(err);
    if (supabaseData.dbSize === "N/A") supabaseData.dbSize = `0 KB / ${supabaseData.dbQuota}`;
  }

  // 3. Check Vercel API
  const vercelToken = process.env.VERCEL_API_TOKEN;
  const vercelProjectId = process.env.VERCEL_PROJECT_ID;

  const vercelRegion = "iad1";
  const vercelRegionLabel = "iad1 · Washington D.C.";
  let vercelData: {
    status: string;
    hasToken: boolean;
    latencyMs: number;
    latestDeployment?: {
      id: string;
      url: string;
      state: string;
      createdAt: number;
      target: string;
    } | null;
    project?: {
      name: string;
      framework: string;
    } | null;
    edgeCaching: string;
    hardware: string;
    runtime: string;
    region: string;
    regionFlagUrl: string;
  } = {
    status: "healthy",
    hasToken: Boolean(vercelToken && vercelProjectId),
    latencyMs: 0,
    latestDeployment: null,
    project: null,
    edgeCaching: "Active",
    hardware: "Serverless · 1024 MB RAM",
    runtime: "Node.js",
    region: vercelRegionLabel,
    regionFlagUrl: "https://flagcdn.com/w20/us.png",
  };

  if (vercelToken && vercelProjectId) {
    const vercelStart = Date.now();
    try {
      const vRes = await fetch(
        `https://api.vercel.com/v6/deployments?projectId=${vercelProjectId}&limit=1`,
        {
          headers: {
            Authorization: `Bearer ${vercelToken}`,
          },
          signal: AbortSignal.timeout(5000),
        }
      );
      vercelData.latencyMs = Date.now() - vercelStart;

      if (vRes.ok) {
        const json = await vRes.json();
        const dep = json.deployments?.[0];
        if (dep) {
          vercelData.latestDeployment = {
            id: dep.uid,
            url: dep.url,
            state: dep.state,
            createdAt: dep.created,
            target: dep.target || "production",
          };
          vercelData.status = dep.state === "READY" ? "healthy" : dep.state.toLowerCase();


        }
      }
    } catch {
      vercelData.latencyMs = Date.now() - vercelStart;
    }
  }

  // 4. Memory & Runtime Stats (Node.js)
  const memoryUsage = process.memoryUsage();
  const runtimeStats = {
    uptimeSec: Math.floor(process.uptime()),
    nodeVersion: process.version,
    memoryRssMb: (memoryUsage.rss / 1024 / 1024).toFixed(1),
    memoryHeapUsedMb: (memoryUsage.heapUsed / 1024 / 1024).toFixed(1),
    memoryHeapTotalMb: (memoryUsage.heapTotal / 1024 / 1024).toFixed(1),
    platform: process.platform,
  };

  return NextResponse.json({
    timestamp,
    services: {
      huggingFace: hfData,
      supabase: supabaseData,
      vercel: vercelData,
    },
    runtime: runtimeStats,
  });
}
