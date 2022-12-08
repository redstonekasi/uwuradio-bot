import { spawn } from "child_process";

export default async function probeDuration(url: string): Promise<number> {  
  const res: Promise<string> = new Promise((resolve, reject) => {
    const proc = spawn("ffprobe", [
      "-i", url,
      "-show_entries", "format=duration",
      "-v", "quiet",
      "-of", "csv=p=0",
    ], { windowsHide: true });

    const chunks: Buffer[] = [];
    proc.stdout.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    proc.stdout.on("error", (err) => reject(err));
    proc.stdout.on("end", () => resolve(Buffer.concat(chunks).toString('utf8')));
  });

  return JSON.parse(await res)
}
