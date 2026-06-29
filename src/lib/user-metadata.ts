type UserMetadata = Record<string, unknown> | null | undefined;

export function getMetadataPhone(metadata: UserMetadata) {
  if (!metadata) return null;

  const possibleKeys = [
    "phone",
    "phone_number",
    "phoneNumber",
    "mobile",
    "mobile_phone",
  ];

  for (const key of possibleKeys) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}
