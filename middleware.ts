import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role_id")
    .eq("id", user.id)
    .maybeSingle();

  let roleName: "teacher" | "student" | null = null;
  if (profile?.role_id) {
    const { data: roleRow } = await supabase
      .from("roles")
      .select("name")
      .eq("id", profile.role_id)
      .maybeSingle();
    if (roleRow?.name === "teacher" || roleRow?.name === "student") {
      roleName = roleRow.name;
    }
  }

  if (roleName === "student") {
    const isTeacherRoute =
      pathname === "/create-classroom" ||
      pathname.endsWith("/add-students") ||
      pathname.endsWith("/edit") ||
      pathname.endsWith("/delete");

    const isForbiddenStudentPath = isTeacherRoute;

    if (isForbiddenStudentPath) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/classrooms/:path*",
    "/documents/:path*",
    "/profile/:path*",
  ],
};
