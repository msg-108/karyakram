/**
 * Ticket Download Utility
 * Renders a high-resolution PNG ticket pass with embedded QR code and event metadata.
 * Uses dynamic font scaling, multi-line wrapping, and font readiness checks to prevent text overflow.
 */

export interface DownloadTicketParams {
  ticketId: string;
  qrPayload?: string;
  eventTitle: string;
  eventDate?: string;
  eventVenue?: string;
  attendeeName: string;
  tierName: string;
  status: string;
}

/**
 * Draws text with automatic font scaling (from baseFontSize down to minFontSize)
 * and optional multi-line wrapping/ellipsis to guarantee it stays strictly within maxWidth.
 */
function drawResponsiveText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  baseFontSize: number = 22,
  minFontSize: number = 11,
  fontWeight: string = 'bold',
  fontFamily: string = 'Plus Jakarta Sans, sans-serif',
  color: string = '#0F172A',
  align: CanvasTextAlign = 'left'
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = align;

  const fontStack = fontFamily.replace(/["']/g, '');

  // 1. Try finding a font size between baseFontSize and minFontSize that fits on 1 line
  for (let size = baseFontSize; size >= minFontSize; size--) {
    ctx.font = `${fontWeight} ${size}px ${fontStack}`;
    if (ctx.measureText(text).width <= maxWidth) {
      ctx.fillText(text, x, y);
      ctx.restore();
      return;
    }
  }

  // 2. If it still doesn't fit on 1 line at minFontSize, attempt 2-line wrapping
  const words = text.split(' ');
  if (words.length > 1) {
    let line1 = '';
    let line2 = '';
    ctx.font = `${fontWeight} ${minFontSize}px ${fontStack}`;

    for (let i = 0; i < words.length; i++) {
      const test = line1 ? `${line1} ${words[i]}` : words[i];
      if (ctx.measureText(test).width <= maxWidth) {
        line1 = test;
      } else {
        line2 = words.slice(i).join(' ');
        break;
      }
    }

    if (line1 && line2) {
      ctx.fillText(line1, x, y - 10);

      // Truncate line 2 if line 2 is still too long
      let trunc2 = line2;
      while (trunc2.length > 0 && ctx.measureText(trunc2 + '...').width > maxWidth) {
        trunc2 = trunc2.slice(0, -1);
      }
      ctx.fillText(trunc2.length < line2.length ? trunc2 + '...' : line2, x, y + 10);
      ctx.restore();
      return;
    }
  }

  // 3. Fallback: single-line truncation with ellipsis at minFontSize
  ctx.font = `${fontWeight} ${minFontSize}px ${fontStack}`;
  let truncated = text;
  while (truncated.length > 0 && ctx.measureText(truncated + '...').width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  ctx.fillText(truncated + '...', x, y);
  ctx.restore();
}

/**
 * Wraps long event titles into up to 2 lines, scaling/truncating if necessary.
 */
function drawWrappedTitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  startY: number,
  maxWidth: number
): void {
  ctx.save();
  ctx.fillStyle = '#0F172A';
  ctx.textAlign = 'left';

  const baseFontSize = 30;
  ctx.font = `bold ${baseFontSize}px Outfit, sans-serif`;

  // Single line fit check
  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, startY + 15);
    ctx.restore();
    return;
  }

  // Multi-line wrap check
  const words = text.split(' ');
  let line1 = '';
  let line2 = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = line1 ? `${line1} ${words[i]}` : words[i];
    if (ctx.measureText(testLine).width <= maxWidth) {
      line1 = testLine;
    } else {
      line2 = words.slice(i).join(' ');
      break;
    }
  }

  if (!line2) {
    // Single long word fallback
    drawResponsiveText(ctx, text, x, startY + 15, maxWidth, 24, 14, 'bold', 'Outfit, sans-serif');
    ctx.restore();
    return;
  }

  // Draw 2 lines
  ctx.font = `bold 26px Outfit, sans-serif`;
  ctx.fillText(line1, x, startY);
  drawResponsiveText(ctx, line2, x, startY + 32, maxWidth, 26, 14, 'bold', 'Outfit, sans-serif');
  ctx.restore();
}

export const downloadTicketPass = async ({
  ticketId,
  eventTitle,
  eventDate = 'Upcoming Event',
  eventVenue = 'Main Venue',
  attendeeName,
  tierName,
  status,
}: DownloadTicketParams): Promise<void> => {
  // Ensure web fonts are completely loaded before measuring text on Canvas
  if (typeof document !== 'undefined' && 'fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue if font loading state check fails
    }
  }

  const canvas = document.createElement('canvas');
  const width = 1200;
  const height = 650;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Background Canvas Base
  ctx.fillStyle = '#FAFAFA';
  ctx.fillRect(0, 0, width, height);

  // Outer Card Shell
  ctx.fillStyle = '#F3F4F6';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(40, 40, width - 80, height - 80, 24);
  ctx.fill();
  ctx.stroke();

  // 2. Top Crimson Brand Header Banner
  const headerGradient = ctx.createLinearGradient(40, 40, width - 40, 40);
  headerGradient.addColorStop(0, '#C41E3A');
  headerGradient.addColorStop(1, '#791F1F');

  ctx.fillStyle = headerGradient;
  ctx.beginPath();
  ctx.roundRect(40, 40, width - 80, 110, [24, 24, 0, 0]);
  ctx.fill();

  // Header Brand Text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 28px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('KaryaKram', 70, 95);

  drawResponsiveText(
    ctx,
    'OFFICIAL DIGITAL EVENT PASS',
    width - 70,
    95,
    360,
    16,
    12,
    'bold',
    '"Plus Jakarta Sans", sans-serif',
    '#F0DBA3',
    'right'
  );

  // Divider Line separating left content and right QR section
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(800, 150);
  ctx.lineTo(800, height - 40);
  ctx.stroke();

  // 3. Left Side Event & Attendee Info
  const leftX = 80;
  const leftMaxWidth = 680;

  // Event Title (Wrapped & Scaled)
  drawWrappedTitle(ctx, eventTitle, leftX, 185, leftMaxWidth);

  // Date & Time
  drawResponsiveText(ctx, 'DATE & TIME:', leftX, 260, leftMaxWidth, 15, 12, 'bold', '"Plus Jakarta Sans", sans-serif', '#C41E3A');
  drawResponsiveText(ctx, eventDate, leftX, 288, leftMaxWidth, 20, 14, 'bold', '"Plus Jakarta Sans", sans-serif', '#0F172A');

  // Location / Venue
  drawResponsiveText(ctx, 'LOCATION / VENUE:', leftX, 332, leftMaxWidth, 15, 12, 'bold', '"Plus Jakarta Sans", sans-serif', '#C41E3A');
  drawResponsiveText(ctx, eventVenue, leftX, 360, leftMaxWidth, 20, 14, 'bold', '"Plus Jakarta Sans", sans-serif', '#0F172A');

  // Attendee & Ticket Tier Box
  const boxX = 80;
  const boxY = 405;
  const boxW = 680;
  const boxH = 140;

  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 16);
  ctx.fill();
  ctx.stroke();

  // Column 1: Pass Holder (max width 300px)
  drawResponsiveText(ctx, 'PASS HOLDER', boxX + 30, boxY + 40, 300, 14, 12, 'bold', '"Plus Jakarta Sans", sans-serif', '#475569');
  drawResponsiveText(ctx, attendeeName, boxX + 30, boxY + 82, 300, 22, 14, 'bold', '"Plus Jakarta Sans", sans-serif', '#0F172A');

  // Column 2: Ticket Tier (max width 280px - scales font dynamically so names like "EARLY BIRD GENERAL ADMISSION" fit cleanly)
  drawResponsiveText(ctx, 'TICKET TIER', boxX + 360, boxY + 40, 280, 14, 12, 'bold', '"Plus Jakarta Sans", sans-serif', '#475569');
  drawResponsiveText(ctx, tierName.toUpperCase(), boxX + 360, boxY + 82, 280, 22, 13, 'bold', '"Plus Jakarta Sans", sans-serif', '#C41E3A');

  // 4. Right Side QR Code Section
  const rightCenterX = 980;

  const renderQRCodeAndDownload = (imgElement?: HTMLImageElement) => {
    if (imgElement) {
      ctx.drawImage(imgElement, 860, 175, 240, 240);
    }

    // Status Badge under QR
    const isConfirmed = status === 'CONFIRMED' || status === 'VALID';
    ctx.fillStyle = isConfirmed ? '#ECFDF5' : '#FFF7ED';
    ctx.strokeStyle = isConfirmed ? '#6EE7B7' : '#FDBA74';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(860, 435, 240, 44, 12);
    ctx.fill();
    ctx.stroke();

    drawResponsiveText(
      ctx,
      `STATUS: ${status.toUpperCase()}`,
      rightCenterX,
      462,
      220,
      15,
      12,
      'bold',
      '"Plus Jakarta Sans", sans-serif',
      isConfirmed ? '#065F46' : '#9A3412',
      'center'
    );

    // Ticket ID text (centered under status badge)
    drawResponsiveText(
      ctx,
      `ID: ${ticketId}`,
      rightCenterX,
      515,
      250,
      13,
      10,
      'bold',
      'monospace',
      '#475569',
      'center'
    );

    // Trigger Download
    triggerDownload(canvas, `Karyakram_Ticket_${ticketId.slice(0, 8)}.png`);
  };

  // Find QR SVG DOM element
  const qrSvg = document.querySelector(`svg[data-ticket-id="${ticketId}"]`) || document.querySelector('svg');
  if (qrSvg) {
    const svgData = new XMLSerializer().serializeToString(qrSvg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const URL = window.URL || window.webkitURL || window;
    const blobURL = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      renderQRCodeAndDownload(img);
      URL.revokeObjectURL(blobURL);
    };
    img.onerror = () => {
      renderQRCodeAndDownload();
    };
    img.src = blobURL;
  } else {
    renderQRCodeAndDownload();
  }
};

const triggerDownload = (canvas: HTMLCanvasElement, filename: string) => {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


