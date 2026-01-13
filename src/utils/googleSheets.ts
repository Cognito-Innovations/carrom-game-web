const WEB_APP_URL = import.meta.env.VITE_SHEETS_WEBHOOK_URL;
const SECRET = import.meta.env.VITE_SHEETS_SECRET;

export const appendWinnerToSheet = async (data: {
  email: string;
  score: number;
  timestamp: string;
}) => {
  if (!WEB_APP_URL || !SECRET) {
    console.warn('Sheets webhook not configured');
    return;
  }

  try {
    const requestTimestamp = Date.now().toString();

    const payload = JSON.stringify({
      ...data,
      requestTimestamp,
    });

    const signature = await sha256(payload + SECRET);

    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        payload,
        signature,
      }),
    });

    const text = await response.text();
    console.log('Sheets response:', text);
  } catch (error) {
    console.error('Failed to call sheets:', error);
  }
};

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}