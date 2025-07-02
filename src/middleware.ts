import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");

  if (!origin) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "You don't have permission to access this resource.",
      },
      { status: 403 }
    );
  }

  if (
    origin &&
    !origin.includes("https://age-detection.kdx.web.id") &&
    !origin.includes("http://localhost:3000")
  ) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "You don't have permission to access this resource.",
      },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
