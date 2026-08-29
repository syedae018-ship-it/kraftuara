import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/demo"],
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/admin",
          "/admin/",
          "/login",
          "/signup",
          "/verify-email",
          "/forgot-password",
          "/reset-password",
          "/callback",
          "/choose-plan",
          "/choose-template",
          "/create-store",
          "/api/",
        ],
      },
    ],
    sitemap: "https://www.kraftaura.in/sitemap.xml",
  };
}
