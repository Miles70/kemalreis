const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

export async function getHomeCampaign() {
  const response = await fetch(`${apiBaseUrl}/api/campaign`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Campaign could not be loaded.");
  }

  return data;
}
