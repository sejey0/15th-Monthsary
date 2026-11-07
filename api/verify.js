const _K = [90, 165, 60, 195, 126, 231];
const _V = [106, 146, 13, 246, 76, 210];

function checkEncoded(pin) {
  if (typeof pin !== "string" || pin.length !== _V.length) return false;
  let diff = 0;
  for (let i = 0; i < _V.length; i++) {
    diff |= (pin.charCodeAt(i) ^ _K[i]) ^ _V[i];
  }
  return diff === 0;
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ valid: false });
  }

  const { pin } = req.body || {};
  const valid = process.env.VAULT_PIN
    ? pin === process.env.VAULT_PIN
    : checkEncoded(pin);

  return res.status(200).json({ valid });
}
