type LoginDestinationResult = {
  ok: true;
  nextStep: "home" | "setup-password";
};

const DEFAULT_LOGIN_DESTINATION = "/home";
const PASSWORD_SETUP_DESTINATION = "/setup-password";

export function getSafeReturnTo(value: string | null | undefined): string | null {
  const returnTo = value?.trim();

  if (!returnTo) return null;
  if (!returnTo.startsWith("/") || returnTo.startsWith("//")) return null;
  if (
    Array.from(returnTo).some((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint <= 31 || codePoint === 127;
    })
  ) {
    return null;
  }

  const pathname = returnTo.split(/[?#]/, 1)[0];
  if (pathname === "/login") return null;

  return returnTo;
}

export function resolveLoginDestination(
  result: LoginDestinationResult,
  returnTo?: string | null,
): string {
  if (result.nextStep === "setup-password") {
    return PASSWORD_SETUP_DESTINATION;
  }

  return getSafeReturnTo(returnTo) ?? DEFAULT_LOGIN_DESTINATION;
}

export function buildActivationReturnPath(code: string): string {
  const normalizedCode = code.trim();

  if (!normalizedCode) {
    return "/activate";
  }

  return `/activate?code=${encodeURIComponent(normalizedCode)}`;
}
