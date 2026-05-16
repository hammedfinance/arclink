type DynamicIdentityInput = {
  user?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    username?: string | null;
    alias?: string;
    userId?: string;
    verifiedCredentials?: Array<{
      email?: string;
      address?: string;
      publicIdentifier?: string;
    }>;
  };
  walletAddress?: string | null;
};

export function getDynamicEmail(user?: DynamicIdentityInput["user"]): string {
  const directEmail = user?.email?.trim().toLowerCase();

  if (directEmail) {
    return directEmail;
  }

  const credentialEmail = user?.verifiedCredentials
    ?.find((credential) => credential.email?.trim())
    ?.email?.trim()
    .toLowerCase();

  return credentialEmail ?? "";
}

export function getDynamicFullName(user?: DynamicIdentityInput["user"]): string {
  const name = [user?.firstName, user?.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");

  return name || user?.username?.trim() || user?.alias?.trim() || "";
}

export function getDynamicWalletAddress({
  user,
  walletAddress,
}: DynamicIdentityInput): string {
  const directAddress = walletAddress?.trim();

  if (directAddress) {
    return directAddress;
  }

  const credentialAddress = user?.verifiedCredentials?.find(
    (credential) => credential.address?.trim() || credential.publicIdentifier?.trim()
  );

  return (
    credentialAddress?.address?.trim() ??
    credentialAddress?.publicIdentifier?.trim() ??
    ""
  );
}

export function getDynamicFallbackEmail({
  user,
  walletAddress,
}: DynamicIdentityInput): string {
  const email = getDynamicEmail(user);

  if (email) {
    return email;
  }

  const identifier =
    user?.userId?.trim() || getDynamicWalletAddress({ user, walletAddress });

  if (!identifier) {
    return "";
  }

  return `${identifier.toLowerCase()}@dynamic.arclink.local`;
}
