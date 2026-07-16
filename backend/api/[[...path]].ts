export const config = { runtime: 'nodejs' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function handler(_req: any, res: any) {
  res.status(200).json({ status: 'ok-from-raw' });
}
