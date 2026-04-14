import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export async function GET(_: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://barometer.dpsgonline.de';
    const url = baseUrl + '/live/' + code;

    const svg = await QRCode.toString(url, {
      type: 'svg',
      margin: 1,
      width: 200,
      color: { dark: '#003056', light: '#00000000' },
    });

    return new NextResponse(svg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err) {
    return NextResponse.json({ error: 'QR-Code Fehler' }, { status: 500 });
  }
}
