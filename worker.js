import htmlContent from "./index.html";
import brandBinary from "./brand.jpeg.bin";
import favBinary from "./fav.ico.bin";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Dynamic CORS Headers allows secure access across any local or production environment
    const origin = request.headers.get("Origin") || "*";
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };

    // 1. Handle pre-flight browser requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 2. SERVE EMBEDDED BINARY IMAGES & FAVICON
    if (request.method === "GET") {
      if (url.pathname === "/brand.jpeg") {
        return new Response(brandBinary, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=604800, immutable", // Cache for 7 days
          },
        });
      }

      if (url.pathname === "/favicon.ico" || url.pathname === "/fav.ico") {
        return new Response(favBinary, {
          headers: {
            "Content-Type": "image/x-icon",
            "Cache-Control": "public, max-age=604800, immutable",
          },
        });
      }

      // Serve index.html globally on root URL visits
      return new Response(htmlContent, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      });
    }

    // 3. SECURE YOUTUBE DIRECT UPLOAD HANDSHAKE (POST /)
    if (request.method === "POST") {
      try {
        const body = await request.json();
        const { title, description } = body;
        const clientOrigin = request.headers.get("Origin") || "https://julies-yt-uploader.oostenjac.workers.dev";

        // Exchange custom Google Refresh Token for Google Access Token
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: env.YT_CLIENT_ID,
            client_secret: env.YT_CLIENT_SECRET,
            refresh_token: env.YT_REFRESH_TOKEN,
            grant_type: "refresh_token",
          }),
        });
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
          return new Response(JSON.stringify({ error: "Failed to fetch access token from Google." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        // Request Resumable Session URI from YouTube
        const ytResponse = await fetch(
          "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
              "X-Upload-Content-Type": "video/*",
              "Origin": clientOrigin, // CORS verification bound back to user origin!
            },
            body: JSON.stringify({
              snippet: {
                title: title || "New Submitted Video",
                description: description || "Uploaded via Portal",
                categoryId: "22"
              },
              status: {
                privacyStatus: "unlisted"
              }
            })
          }
        );

        const uploadUrl = ytResponse.headers.get("Location");

        if (!uploadUrl) {
          const ytError = await ytResponse.text();
          return new Response(JSON.stringify({ error: "YouTube API Error", details: ytError }), {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({ uploadUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    // Default Fallback
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};