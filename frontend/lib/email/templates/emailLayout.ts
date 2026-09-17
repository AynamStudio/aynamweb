/**
 * Shared AYNAM email layout — table-based, inline-styled.
 * Mirrors backend/lib/email/templates/emailLayout.ts but kept independent so
 * the frontend can send contact emails without importing backend code.
 *
 * Brand: bg #F5F5F2 · card #FFFFFF · ink #0A0A0A · muted #666 ·
 * hairline rgba(0,0,0,0.12) · ~640px centred.
 */

export const esc = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const escMulti = (value: string): string =>
  esc(value).replace(/\r\n|\r|\n/g, "<br>");

const FONT = "Helvetica, Arial, sans-serif";

export type DetailRow = { label: string; value: string; multiline?: boolean };

export function detailRows(rows: DetailRow[]): string {
  return rows
    .map(
      (r) => `
      <tr>
        <td style="padding:14px 0 6px; border-top:1px solid rgba(0,0,0,0.08); font-family:${FONT}; font-size:11px; letter-spacing:1.6px; text-transform:uppercase; color:#666; vertical-align:top;">
          ${esc(r.label)}
        </td>
      </tr>
      <tr>
        <td style="padding:0 0 14px; font-family:${FONT}; font-size:14px; line-height:22px; color:#0A0A0A; word-break:break-word;">
          ${r.multiline ? escMulti(r.value) : esc(r.value)}
        </td>
      </tr>`
    )
    .join("");
}

export function solidButton(href: string, label: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" align="left">
      <tr>
        <td style="background:#0A0A0A; padding:13px 32px;">
          <a href="${esc(href)}" style="font-family:${FONT}; font-size:11px; letter-spacing:2px; text-transform:uppercase; color:#FFF; text-decoration:none;">${esc(label)}</a>
        </td>
      </tr>
    </table>`;
}

export type LayoutOptions = {
  bannerUrl?: string;
  preheader: string;
  eyebrow: string;
  titleLines: string[];
  support?: string;
  body: string;
  siteUrl: string;
};

export function emailLayout(o: LayoutOptions): string {
  const banner = o.bannerUrl
    ? `
        <tr>
          <td style="background:#000; font-size:0; line-height:0;" bgcolor="#000">
            <img src="${esc(o.bannerUrl)}" alt="AYNAM — Software for a smarter tomorrow." width="640" style="display:block; width:100%; max-width:640px; height:auto; border:0;" />
          </td>
        </tr>`
    : `
        <tr>
          <td style="background:#000; padding:34px 40px;" bgcolor="#000">
            <span style="font-family:${FONT}; font-size:18px; font-weight:700; letter-spacing:6px; color:#FFF;">AYNAM</span>
            <br />
            <span style="font-family:${FONT}; font-size:11px; letter-spacing:1.6px; color:rgba(255,255,255,0.55);">Software for a smarter tomorrow.</span>
          </td>
        </tr>`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${esc(o.preheader)}</title>
<style>
  @media (max-width: 640px) {
    .aynam-shell { width:100% !important; }
    .aynam-pad { padding-left:20px !important; padding-right:20px !important; }
    .aynam-h1 { font-size:28px !important; line-height:34px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background:#F5F5F2;">
  <div style="display:none; font-size:1px; color:#F5F5F2; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">${esc(o.preheader)}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#F5F5F2;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" width="640"><tr><td><![endif]-->
        <table role="presentation" cellpadding="0" cellspacing="0" class="aynam-shell" width="640" style="width:640px; max-width:640px; margin:0 auto;">
          <tr>
            <td style="background:#FFF; border:1px solid rgba(0,0,0,0.12);">
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                ${banner}
                <tr>
                  <td class="aynam-pad" style="padding:44px 48px 8px;">
                    <span style="font-family:${FONT}; font-size:11px; letter-spacing:2.4px; text-transform:uppercase; color:#666;">${esc(o.eyebrow)}</span>
                    <h1 class="aynam-h1" style="margin:18px 0 0; font-family:${FONT}; font-size:36px; line-height:42px; font-weight:700; color:#0A0A0A;">
                      ${o.titleLines.map((l) => esc(l)).join("<br />")}
                    </h1>
                    ${o.support ? `<p style="margin:18px 0 0; font-family:${FONT}; font-size:15px; line-height:24px; color:#666;">${esc(o.support)}</p>` : ""}
                  </td>
                </tr>
                <tr>
                  <td class="aynam-pad" style="padding:28px 48px 44px;">
                    ${o.body}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 20px 8px;">
              <span style="font-family:${FONT}; font-size:12px; font-weight:700; letter-spacing:3px; color:#0A0A0A;">AYNAM</span>
              <br />
              <span style="font-family:${FONT}; font-size:11px; line-height:18px; color:#666;">Independent software studio.<br />Software for a smarter tomorrow.</span>
              <br />
              <span style="font-family:${FONT}; font-size:11px; line-height:18px; color:#999;">© ${new Date().getFullYear()} AYNAM. All rights reserved.<br /><a href="${esc(o.siteUrl || "https://aynam.in")}" style="color:#666; text-decoration:underline;">${esc((o.siteUrl || "https://aynam.in").replace(/^https?:\/\//, ""))}</a></span>
            </td>
          </tr>
        </table>
        <!--[if mso]></td></tr></table><![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const para = (text: string): string =>
  `<p style="margin:0 0 16px; font-family:${FONT}; font-size:15px; line-height:24px; color:#0A0A0A;">${esc(text)}</p>`;

export const sectionLabel = (text: string): string =>
  `<p style="margin:28px 0 4px; font-family:${FONT}; font-size:11px; letter-spacing:2.4px; text-transform:uppercase; color:#666;">${esc(text)}</p>`;
