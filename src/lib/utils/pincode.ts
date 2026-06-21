// India Post pincode lookup — free, no API key
export type PincodeResult = { pincode: string; city: string; state: string; district: string };

export async function lookupPincode(pincode: string): Promise<PincodeResult | null> {
  if (!/^\d{6}$/.test(pincode)) return null;
  try {
    const r = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
    const j = await r.json();
    const po = j?.[0]?.PostOffice?.[0];
    if (!po) return null;
    return { pincode, city: po.Block || po.Name, state: po.State, district: po.District };
  } catch {
    return null;
  }
}
